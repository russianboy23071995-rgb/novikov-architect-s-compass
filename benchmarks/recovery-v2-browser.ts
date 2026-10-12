import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer";
import { createBoundedRecoveryCodec } from "../src/interop/project-file/recovery-codec";
import {
  createRecoveryV2Storage,
  openRecoveryV2Pilot,
} from "../src/interop/project-file/recovery-v2-storage";
import {
  createAssetPreparation,
  restoreCheckedSnapshot,
} from "../src/interop/project-file/recovery-codec";
import {
  migrateRecoveryV1,
  restoreRecoveryV2,
  type RecoveryRecordV2,
} from "../src/application/project-files/recovery-v2";
import { recoveryFixture } from "./recovery-capacity-fixture";
import { serializeProject } from "../src/lib/bim/model";
if (!import.meta.env.DEV || location.port !== "8084") throw new Error("Diagnostic only");
const root = document.getElementById("root")!;
root.style.cssText = "font:15px system-ui;max-width:1000px;margin:40px auto";
root.innerHTML =
  '<h1>Recovery V2: atomarer Adapter</h1><p>Nur synthetische Daten. Zwei echte Datenbankverbindungen, Migration und Fehlerfälle.</p><button id="run">Prüfung starten</button><p role="status">Bereit</p><pre id="output"></pre>';
const button = document.querySelector<HTMLButtonElement>("#run")!;
const status = document.querySelector<HTMLElement>('[role="status"]')!;
async function mutate(db: IDBDatabase, store: string, fn: (s: IDBObjectStore) => void) {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    fn(tx.objectStore(store));
  });
}
async function read(db: IDBDatabase, store: string, key: string) {
  return new Promise<unknown>((resolve, reject) => {
    const tx = db.transaction(store),
      r = tx.objectStore(store).get(key);
    tx.oncomplete = () => resolve(r.result);
    tx.onabort = () => reject(tx.error);
  });
}
button.onclick = async () => {
  button.disabled = true;
  const checks: string[] = [],
    name = `novikov-recovery-v2-pilot-${crypto.randomUUID()}`;
  const report: Record<string, unknown> = { started: new Date().toISOString(), name, checks };
  let a: IDBDatabase | undefined, b: IDBDatabase | undefined;
  const check = (ok: boolean, label: string) => {
    if (!ok) throw new Error(label);
    checks.push(label);
    status.textContent = label;
  };
  const rejects = async (fn: () => Promise<unknown>, label: string) => {
    let failed = false;
    try {
      await fn();
    } catch {
      failed = true;
    }
    check(failed, label);
  };
  try {
    a = await openRecoveryV2Pilot(name);
    b = await openRecoveryV2Pilot(name);
    const p = recoveryFixture("v2", 10);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 2;
    canvas.getContext("2d")!.fillRect(0, 0, 2, 2);
    p.assets.push({
      id: "image",
      mimeType: "image/png",
      pixelWidth: 2,
      pixelHeight: 2,
      data: canvas.toDataURL().split(",")[1]!,
    });
    const legacy = JSON.stringify({
      version: 1,
      current: { savedAt: "2026-10-12T12:00:00Z", json: serializeProject(p) },
    });
    await mutate(a, "legacy", (s) => s.put(legacy, p.id));
    const codec = {
      prepare: createAssetPreparation({ maxBytes: 8 * 1024 * 1024, maxPixels: 1_000_000 }).prepare,
      restore: restoreCheckedSnapshot,
    };
    const first = createRecoveryV2Storage(a, p.id, codec),
      second = createRecoveryV2Storage(b, p.id, codec);
    await migrateRecoveryV1(first, p.id, codec);
    const initial = await first.read();
    check(initial.legacy === legacy, "V1 byte-identisch erhalten");
    check(
      serializeProject((await restoreRecoveryV2(initial.record, p.id, codec)).project) ===
        serializeProject(p),
      "Migration vollständig identisch",
    );
    const old = initial.record as RecoveryRecordV2;
    const next = { ...old, revision: crypto.randomUUID(), previous: old.current };
    const race = await Promise.allSettled([
      first.publish({ legacy, revision: old.revision }, next),
      second.publish(
        { legacy, revision: old.revision },
        { ...next, revision: crypto.randomUUID() },
      ),
    ]);
    check(
      race.filter((r) => r.status === "fulfilled").length === 1,
      "Zwei Verbindungen: genau ein CAS-Gewinner",
    );
    let current = (await first.read()).record as RecoveryRecordV2;
    check(
      !!current.previous &&
        serializeProject(await codec.restore(current.previous.document)) === serializeProject(p),
      "Vorgänger vollständig erhalten",
    );
    const persisted = await read(a, "heads", p.id);
    check(
      !JSON.stringify(persisted).includes(p.assets[0]!.data),
      "Head enthält keine Bildpayloads",
    );
    await mutate(b, "legacy", (s) => s.put(legacy + " ", p.id));
    await rejects(
      () =>
        first.publish(
          { legacy, revision: current.revision },
          { ...current, revision: crypto.randomUUID() },
        ),
      "Geänderter V1-Quelltoken blockiert Veröffentlichung",
    );
    await mutate(b, "legacy", (s) => s.put(legacy, p.id));
    const controller = new AbortController();
    // Deterministic test-only observation of the real queued head write; no adapter fault hook.
    const instrumented = new Proxy(a, {
      get(target, prop) {
        if (prop === "transaction")
          return (...args: Parameters<IDBDatabase["transaction"]>) => {
            const tx = target.transaction(...args);
            if (args[1] === "readwrite") {
              const original = tx.objectStore.bind(tx);
              tx.objectStore = (store: string) => {
                const objectStore = original(store);
                if (store === "heads") {
                  const put = objectStore.put.bind(objectStore);
                  objectStore.put = (...values: Parameters<IDBObjectStore["put"]>) => {
                    const request = put(...values);
                    request.addEventListener("success", () => controller.abort(), { once: true });
                    return request;
                  };
                }
                return objectStore;
              };
            }
            return tx;
          };
        const value = Reflect.get(target, prop, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    canvas.getContext("2d")!.clearRect(0, 0, 2, 2);
    const q = { ...p, assets: [{ ...p.assets[0]!, data: canvas.toDataURL().split(",")[1]! }] };
    const changed = await codec.prepare(q),
      newKey = changed.model.assets[0]!.key;
    const abortNext = {
      ...current,
      revision: crypto.randomUUID(),
      current: { ...current.current, document: changed },
    };
    await rejects(
      () =>
        createRecoveryV2Storage(instrumented, p.id, codec).publish(
          { legacy, revision: current.revision },
          abortNext,
          controller.signal,
        ),
      "Abbruch nach Head-Request vor Commit abgewiesen",
    );
    check(
      JSON.stringify(await read(a, "heads", p.id)) === JSON.stringify(persisted),
      "Rollback erhält veröffentlichten Head",
    );
    check(
      (await read(a, "assets", newKey)) === undefined,
      "Rollback entfernt neue unbestätigte Payload",
    );
    const distinct = { ...abortNext, revision: crypto.randomUUID(), previous: current.current };
    await first.publish({ legacy, revision: current.revision }, distinct);
    await mutate(a, "assets", (s) => s.delete(newKey));
    const fallback = await restoreRecoveryV2((await first.read()).record, p.id, codec);
    check(
      fallback.fallback && serializeProject(fallback.project) === serializeProject(p),
      "Fehlendes current-Bild fällt auf vollständig geprüften Vorgänger zurück",
    );
    await mutate(a, "heads", (s) => s.put(persisted, p.id));
    const corrupt = structuredClone(current);
    corrupt.revision = crypto.randomUUID();
    corrupt.current.document.blobs = {};
    await rejects(
      () => first.publish({ legacy, revision: current.revision }, corrupt),
      "Ungültiges neues current wird trotz gültigem previous abgewiesen",
    );
    const key = current.current.document.model.assets[0]!.key,
      payload = current.current.document.blobs[key]!;
    await mutate(a, "assets", (s) => s.put({ ...payload, data: "AAAA" }, key));
    await rejects(
      async () => restoreRecoveryV2((await first.read()).record, p.id, codec),
      "Beschädigte Payload wird beim Lesen abgewiesen",
    );
    await rejects(
      () =>
        first.publish(
          { legacy, revision: current.revision },
          { ...current, revision: crypto.randomUUID() },
        ),
      "Vorhandene beschädigte Payload wird nicht still wiederverwendet",
    );
    await mutate(a, "assets", (s) => s.delete(key));
    await rejects(
      async () => restoreRecoveryV2((await first.read()).record, p.id, codec),
      "Fehlende Payload wird beim Lesen abgewiesen",
    );
    await mutate(a, "assets", (s) => s.put(payload, key));
    await mutate(a, "heads", (s) => s.put({ version: 99, revision: current.revision }, p.id));
    await rejects(
      () => migrateRecoveryV1(first, p.id, codec),
      "Unbekannte V2-Version verhindert Migration",
    );
    await rejects(
      () =>
        first.publish(
          { legacy, revision: current.revision },
          { ...current, revision: crypto.randomUUID() },
        ),
      "Unbekannte Version wird auch bei passender Revision nicht überschrieben",
    );
    check(
      ((await read(a, "heads", p.id)) as { version: number }).version === 99,
      "Unbekannter Stand bleibt erhalten",
    );
    await mutate(a, "heads", (s) => s.put(persisted, p.id));
    const brokenPort = createRecoveryV2Storage(a, "broken", codec);
    await mutate(a, "legacy", (s) => s.put('{"version":1,"current":{"json":"broken"}}', "broken"));
    await rejects(
      () => migrateRecoveryV1(brokenPort, "broken", codec),
      "Fehlerhafte V1-Migration veröffentlicht nichts",
    );
    check((await brokenPort.read()).record === null, "Fehlerhafter Quellstand bleibt ohne V2-Head");
    a.close();
    a = await openRecoveryV2Pilot(name);
    current = (await createRecoveryV2Storage(a, p.id, codec).read()).record as RecoveryRecordV2;
    check(
      serializeProject((await restoreRecoveryV2(current, p.id, codec)).project) ===
        serializeProject(p),
      "Wiederöffnung nach allen Fehlerfällen vollständig identisch",
    );
    check(
      (await read(a, "legacy", p.id)) === legacy,
      "V1 auch nach allen Fehlerfällen unverändert",
    );
    const bounded = createBoundedRecoveryCodec({
      modelBytes: 1024 * 1024,
      payloadBytes: 1024 * 1024,
      pixels: 1000,
    });
    const writerPort = createRecoveryV2Storage(a, p.id, bounded);
    const writer = await prepareRecoveryV2Writer(writerPort, p.id, bounded);
    const saved = await writer.save(p, () => true);
    check((await writerPort.read()).record !== null, "Writer speichert gültigen Arbeitsstand");
    const stopped = new AbortController();
    stopped.abort();
    await rejects(
      () => writer.save(p, () => true, stopped.signal),
      "Writer-Abbruch erhält letzte Revision",
    );
    check(
      ((await writerPort.read()).record as RecoveryRecordV2).revision === saved.revision,
      "Abbruch verändert Head nicht",
    );
    await rejects(() => writer.save(p, () => false), "Veralteter Writer-Kontext wird abgewiesen");
    let checksBeforeCommit = 0;
    await rejects(
      () =>
        writerPort.publish(
          { legacy, revision: saved.revision },
          { ...current, revision: crypto.randomUUID() },
          undefined,
          () => ++checksBeforeCommit < 4,
        ),
      "Kontextwechsel beim finalen Headrequest rollt Transaktion zurück",
    );
    check(
      ((await writerPort.read()).record as RecoveryRecordV2).revision === saved.revision,
      "Später Kontextwechsel erhält Head",
    );
    await writer.save(q, () => true);
    check(
      serializeProject(
        (await restoreRecoveryV2((await writerPort.read()).record, p.id, bounded)).project,
      ) === serializeProject(q),
      "Writer-Retry nach Abbruch speichert vollständig",
    );
    const competing = await prepareRecoveryV2Writer(
      createRecoveryV2Storage(b, p.id, bounded),
      p.id,
      bounded,
    );
    await competing.save(p, () => true);
    await rejects(
      () => writer.save(q, () => true),
      "Externer Writer-Konflikt wird erhalten statt überschrieben",
    );
    const resumed = await prepareRecoveryV2Writer(writerPort, p.id, bounded);
    await resumed.save(q, () => true);
    check(
      serializeProject(
        (await restoreRecoveryV2((await writerPort.read()).record, p.id, bounded)).project,
      ) === serializeProject(q),
      "Neue Writersitzung setzt nach Konflikt sicher fort",
    );
    report["status"] = "passed";
    status.textContent = `Bestanden: ${checks.length} Prüfungen. Produktionsdaten unverändert.`;
  } catch (error) {
    report["status"] = "failed";
    report["error"] = String(error);
    status.textContent = String(error);
  } finally {
    a?.close();
    b?.close();
    button.disabled = false;
    document.getElementById("output")!.textContent = JSON.stringify(report, null, 2);
  }
};
