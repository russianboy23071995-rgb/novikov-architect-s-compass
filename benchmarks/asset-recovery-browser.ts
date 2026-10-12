import {
  createPreparation,
  createAssetRecoveryStore,
  openPilotDatabase,
} from "./asset-recovery-store";
import { recoveryFixture } from "./recovery-capacity-fixture";
import { createImageAssetHandle } from "../src/domain/elements/reference/model";
import { validateProject, type Project } from "../src/domain/project/schema";
if (!import.meta.env.DEV || location.port !== "8084") throw new Error("Isolated port 8084 only");
const root = document.getElementById("root")!;
root.style.cssText = "font:14px system-ui;max-width:1100px;margin:30px auto;line-height:1.5";
root.innerHTML =
  '<h1>Asset-Recovery-Pilot · 50 MiB</h1><p>Nur synthetische Daten in eigener Testdatenbank. Keine Produktmigration. Bilder einmalig speichern, Manifest und Vorgänger atomar veröffentlichen.</p><button id="run">Pilot starten</button> <button id="cancel" disabled>Abbrechen</button> <button id="download" disabled>Ergebnis herunterladen</button><p role="status">Bereit</p><pre id="output"></pre>';
const run = document.querySelector<HTMLButtonElement>("#run")!;
const cancel = document.querySelector<HTMLButtonElement>("#cancel")!;
const download = document.querySelector<HTMLButtonElement>("#download")!;
const status = document.querySelector<HTMLElement>('[role="status"]')!;
const output = document.getElementById("output")!;
let stopped = false,
  report: Record<string, unknown>;
cancel.onclick = () => {
  stopped = true;
  status.textContent = "Abbruch nach aktueller Phase…";
};
const pause = () => new Promise<void>((r) => setTimeout(r, 0));
const bytes = (s: string) => new TextEncoder().encode(s).length;
const hash = async (p: Project) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(p))),
    ),
  ).join(",");
async function mutate(db: IDBDatabase, store: string, action: (s: IDBObjectStore) => void) {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    action(tx.objectStore(store));
  });
}
async function count(db: IDBDatabase, store: string) {
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(store);
    const r = tx.objectStore(store).count();
    tx.oncomplete = () => resolve(r.result);
    tx.onabort = () => reject(tx.error);
  });
}
run.onclick = async () => {
  run.disabled = true;
  cancel.disabled = false;
  download.disabled = true;
  stopped = false;
  const phases: unknown[] = [],
    checks: string[] = [];
  const dbName = "novikov-asset-recovery-pilot-" + crypto.randomUUID();
  report = {
    started: new Date().toISOString(),
    userAgent: navigator.userAgent,
    dbName,
    phases,
    checks,
  };
  let db: IDBDatabase | undefined;
  const check = (ok: boolean, name: string) => {
    if (!ok) throw new Error(name);
    checks.push(name);
    output.textContent = JSON.stringify(report, null, 2);
  };
  const rejection = async (fn: () => Promise<unknown>, pattern: RegExp, name: string) => {
    let error = "";
    try {
      await fn();
    } catch (e) {
      error = String(e);
    }
    check(pattern.test(error), name);
  };
  const phase = async <T>(name: string, fn: () => Promise<T>) => {
    if (stopped) throw new Error("Cancelled");
    status.textContent = name;
    await pause();
    const start = performance.now();
    const value = await fn();
    phases.push({ name, ms: performance.now() - start });
    output.textContent = JSON.stringify(report, null, 2);
    return value;
  };
  try {
    let p = await phase("Fixture mit unterschiedlichen PNGs erzeugen", async () => {
      const p = recoveryFixture("asset-recovery-pilot", 10000);
      let size = 0,
        i = 0;
      while (size < 50 * 1024 * 1024) {
        if (stopped) throw new Error("Cancelled");
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1280;
        const ctx = canvas.getContext("2d")!;
        const image = ctx.createImageData(1280, 1280);
        let seed = ++i;
        for (let j = 0; j < image.data.length; j++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          image.data[j] = seed >>> 24;
        }
        ctx.putImageData(image, 0, 0);
        const data = canvas.toDataURL("image/png").split(",")[1]!;
        size += data.length;
        p.assets.push(
          createImageAssetHandle({
            id: `a${i}`,
            mimeType: "image/png",
            pixelWidth: 1280,
            pixelHeight: 1280,
            data,
          }),
        );
        p.storey.references.push({
          id: `r${i}`,
          kind: "image-reference",
          assetId: `a${i}`,
          layerId: p.defaultLayerIds.line,
          origin: { x: i * 10, y: 0 },
          rotation: 0,
          metresPerPixel: 0.01,
        });
        canvas.width = canvas.height = 0;
        await pause();
      }
      return validateProject(p);
    });
    report["projectBytes"] = bytes(JSON.stringify(p));
    report["images"] = p.assets.length;
    const originalHash = await hash(p);
    db = await openPilotDatabase(dbName);
    const store = createAssetRecoveryStore(db),
      prep = createPreparation();
    const first = await phase("Erste Assetvorbereitung", () => prep.prepare(p));
    const one = await phase("Erste atomare Ablage", () => store.publish(first, null));
    report["first"] = one;
    check(one.payloadWrites === p.assets.length, "first write stores each different asset once");
    const initialHashes = prep.hashes;
    const previousJson = JSON.stringify(p);
    p = validateProject({
      ...p,
      storey: {
        ...p.storey,
        lines: p.storey.lines!.map((line, i) => (i === 0 ? { ...line, color: "#998877" } : line)),
      },
    });
    const expected = await hash(p);
    const second = await phase("Unveränderte Assets wiederverwenden", () => prep.prepare(p));
    check(prep.hashes === initialHashes, "geometry edit does not rehash payloads");
    const two = await phase("Zweiten Modellstand veröffentlichen", () =>
      store.publish(second, one.revision),
    );
    report["second"] = two;
    check(
      two.payloadWrites === 0 && two.payloadBytes === 0,
      "second revision writes zero image bytes",
    );
    let controlText = "";
    await phase("Monolithische Recovery-Hülle schreiben", async () => {
      controlText = JSON.stringify({
        version: 1,
        current: { json: JSON.stringify(p), savedAt: "2026-10-12T00:00:00Z" },
        previous: { json: previousJson, savedAt: "2026-10-11T00:00:00Z" },
      });
      await mutate(db!, "control", (s) => s.put(controlText, "record"));
    });
    report["controlBytes"] = bytes(controlText);
    controlText = "";
    await phase("Monolithische Recovery lesen und validieren", async () => {
      const raw = await new Promise<string>((resolve, reject) => {
        const tx = db!.transaction("control");
        const r = tx.objectStore("control").get("record");
        tx.oncomplete = () => resolve(r.result);
        tx.onabort = () => reject(tx.error);
      });
      const q = validateProject(JSON.parse(JSON.parse(raw).current.json));
      check((await hash(q)) === expected, "monolithic control roundtrip");
    });
    db.close();
    db = await openPilotDatabase(dbName);
    const reopened = createAssetRecoveryStore(db);
    await phase("Recovery nach erneutem Datenbanköffnen", async () =>
      check(
        (await hash((await reopened.read(p.id)).project)) === expected,
        "current full model roundtrip after reopen",
      ),
    );
    await phase("Vorgänger prüfen", async () =>
      check(
        (await hash((await reopened.read(p.id, true)).project)) === originalHash,
        "previous full model roundtrip",
      ),
    );
    await rejection(
      () => reopened.publish(second, one.revision),
      /Revision conflict/,
      "stale writer rejected",
    );
    const extra = createImageAssetHandle({
      id: "new-asset",
      mimeType: "image/png",
      pixelWidth: 1,
      pixelHeight: 1,
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=",
    });
    const candidate = await prep.prepare({ ...p, assets: [...p.assets, extra] });
    const before = await count(db, "assets");
    await rejection(
      () => reopened.publish(candidate, two.revision, true),
      /Injected abort/,
      "transaction abort after queued writes",
    );
    check((await count(db, "assets")) === before, "aborted new asset not persisted");
    await phase("Stand nach Fehlern unverändert", async () => {
      const q = await reopened.read(p.id);
      check(
        q.revision === two.revision && (await hash(q.project)) === expected,
        "conflict and abort preserve published head",
      );
    });
    const key = second.model.assets[0]!.key,
      good = second.blobs[key]!;
    await mutate(db, "assets", (s) =>
      s.put({ ...good, data: good.data.slice(0, -8) + "AAAA" + good.data.slice(-4) }, key),
    );
    await rejection(
      () => reopened.read(p.id),
      /integrity mismatch/,
      "corrupt asset rejects recovery before model return",
    );
    await mutate(db, "assets", (s) => s.delete(key));
    await rejection(
      () => reopened.read(p.id),
      /Missing asset/,
      "missing asset rejects recovery before model return",
    );
    await mutate(db, "assets", (s) => s.put(good, key));
    report["status"] = "passed";
    status.textContent = `Bestanden: ${checks.length} Prüfungen. Keine Produktionsdaten geändert.`;
  } catch (e) {
    report["status"] = "failed";
    report["error"] = String(e);
    status.textContent = String(e);
  } finally {
    db?.close();
    run.disabled = false;
    cancel.disabled = true;
    download.disabled = false;
    output.textContent = JSON.stringify(report, null, 2);
  }
};
download.onclick = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "asset-recovery-pilot.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
