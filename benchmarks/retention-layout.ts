import { collectRecoveryV2Pilot } from "../src/interop/project-file/recovery-retention-pilot.ts";
import { recoveryV2Layout } from "../src/interop/project-file/recovery-layout.ts";
import {
  createRecoveryCatalog,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage.ts";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import {
  migrateRecoveryV1,
  restoreRecoveryV2,
} from "../src/application/project-files/recovery-v2.ts";
import { prepareRecoverySnapshot } from "../src/application/project-files/recovery.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { recoveryFixture, summary } from "./recovery-capacity-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector("#result")!;
function image(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 2, 2);
  return createImageAssetHandle({
    id: "image",
    mimeType: "image/png",
    pixelWidth: 2,
    pixelHeight: 2,
    data: c.toDataURL().split(",")[1],
  });
}
function readAll(db: IDBDatabase, store: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store),
      r = tx.objectStore(store).getAll();
    tx.oncomplete = () => resolve(r.result);
    tx.onabort = () => reject(tx.error);
  });
}
function put(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("snapshots", "readwrite"),
      store = tx.objectStore("snapshots");
    if (value === undefined) store.delete(key);
    else store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
}
button.onclick = async () => {
  button.disabled = true;
  const name = `novikov-recovery-v2-pilot-layout-${crypto.randomUUID()}`,
    checks: string[] = [],
    timings: unknown[] = [];
  const report: Record<string, unknown> = {
    name,
    userAgent: navigator.userAgent,
    started: new Date().toISOString(),
    checks,
    timings,
  };
  let db: IDBDatabase | undefined;
  const check = (ok: boolean, label: string) => {
    if (!ok) throw Error(label);
    checks.push(label);
    output.textContent = checks.join("\n");
  };
  try {
    db = await openRecoveryDatabase(name);
    const connection = db;
    const catalog = createRecoveryCatalog(() => openRecoveryDatabase(name), true),
      v2 = catalog.v2!,
      codec = v2.codec;
    const [a, b, c] = ["red", "blue", "green"].map((color) =>
      recoveryFixture("migration", 10, image(color)),
    );
    const current = { savedAt: "2026-10-15T12:00:00Z", json: serializeProject(a!) },
      previous = { savedAt: "2026-10-15T11:00:00Z", json: serializeProject(b!) };
    const legacy = JSON.stringify({ version: 1, current, previous });
    await catalog.project("migration").replace(null, legacy);
    await migrateRecoveryV1(v2.project("migration"), "migration", codec);
    const writer = await prepareRecoveryV2Writer(v2.project("migration"), "migration", codec);
    await writer.save(c!, () => true);
    await writer.save(c!, () => true);
    const indexBefore = JSON.stringify(await readAll(db, "recovery-index"));
    const result = await collectRecoveryV2Pilot(db, codec, undefined, recoveryV2Layout);
    check(
      result.status === "collected" && result.deleted === 2 && result.retained === 1,
      "Produktives Layout: nur zwei nicht mehr von V2 benötigte Bilder entfernt",
    );
    check(
      (await catalog.project("migration").read()) === legacy,
      "Echtes V1-Migrationsoriginal bytegleich erhalten",
    );
    check(
      serializeProject((await prepareRecoverySnapshot(current)).project) === serializeProject(a!) &&
        serializeProject((await prepareRecoverySnapshot(previous)).project) ===
          serializeProject(b!),
      "Beide eingebetteten V1-Bildstände bleiben unabhängig von V2-Payloads lesbar",
    );
    check(
      serializeProject(
        (await restoreRecoveryV2((await v2.project("migration").read()).record, "migration", codec))
          .project,
      ) === serializeProject(c!),
      "Migrierter V2-Stand vollständig erhalten",
    );
    check(
      JSON.stringify(await readAll(db, "recovery-index")) === indexBefore,
      "Katalogindex unverändert",
    );
    await put(db, "unknown", JSON.stringify({ version: 99 }));
    check(
      (await collectRecoveryV2Pilot(db, codec, undefined, recoveryV2Layout)).status === "skipped",
      "Unbekannter Altstand blockiert Bereinigung",
    );
    await put(
      db,
      "unknown",
      JSON.stringify({ version: 1, current, previous: { savedAt: "broken", json: "broken" } }),
    );
    check(
      (await collectRecoveryV2Pilot(db, codec, undefined, recoveryV2Layout)).status === "skipped",
      "Beschädigter V1-Vorgänger blockiert Bereinigung",
    );
    await put(db, "unknown", undefined);
    let resume!: () => void, entered!: () => void;
    const gate = new Promise<void>((r) => (resume = r)),
      reached = new Promise<void>((r) => (entered = r));
    let first = true;
    const paused = {
      ...codec,
      restore: async (...args: Parameters<typeof codec.restore>) => {
        if (first) {
          first = false;
          entered();
          await gate;
        }
        return codec.restore(...args);
      },
    };
    const pending = collectRecoveryV2Pilot(connection, paused, undefined, recoveryV2Layout);
    await reached;
    await put(db, "new-slot", legacy);
    resume();
    const race = await pending;
    check(
      race.status === "skipped" && race.reason === "changed-roots",
      "Neuer V1-Slot während Vorbereitung invalidiert atomare Freigabe",
    );
    await put(db, "new-slot", undefined);
    const profileWriter = await prepareRecoveryV2Writer(v2.project("profile"), "profile", codec);
    for (const lines of [1000, 10000]) {
      const project = recoveryFixture("profile", lines);
      await profileWriter.save(project, () => true);
      await profileWriter.save(project, () => true);
      const runs: number[] = [];
      for (let i = 0; i < 3; i++) {
        const started = performance.now();
        const collected = await collectRecoveryV2Pilot(db, codec, undefined, recoveryV2Layout);
        runs.push(performance.now() - started);
        if (collected.status !== "collected") throw Error("Profile collection failed");
      }
      timings.push({
        lines,
        runs,
        totalMs: { median: summary(runs).median, observedMaximum: Math.max(...runs) },
      });
      check(
        serializeProject(
          (await restoreRecoveryV2((await v2.project("profile").read()).record, "profile", codec))
            .project,
        ) === serializeProject(project),
        `${lines} Linien: Modell bleibt vollständig identisch`,
      );
    }
    db.close();
    db = await openRecoveryDatabase(name);
    check(
      (await catalog.project("migration").read()) === legacy &&
        (await readAll(db, "recovery-v2-assets")).length === 1,
      "DB-Neuöffnung erhält Original und bereinigten Bestand",
    );
    report["status"] = "PASS";
  } catch (e) {
    report["status"] = "FAIL";
    report["error"] = String(e);
  } finally {
    db?.close();
    report["finished"] = new Date().toISOString();
    output.textContent = JSON.stringify(report, null, 2);
    button.disabled = false;
  }
};
