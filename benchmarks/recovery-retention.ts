import { collectRecoveryV2Pilot } from "../src/interop/project-file/recovery-retention-pilot.ts";
import {
  openRecoveryV2Pilot,
  createRecoveryV2Storage,
} from "../src/interop/project-file/recovery-v2-storage.ts";
import { createProjectRecoveryCodec } from "../src/interop/project-file/recovery-codec.ts";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import { restoreRecoveryV2 } from "../src/application/project-files/recovery-v2.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
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
function get(db: IDBDatabase, store: string, key: IDBValidKey): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store),
      r = tx.objectStore(store).get(key);
    tx.oncomplete = () => resolve(r.result);
    tx.onabort = () => reject(tx.error);
  });
}
function put(db: IDBDatabase, store: string, key: IDBValidKey, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    if (value === undefined) tx.objectStore(store).delete(key);
    else tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
}
function count(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("assets"),
      r = tx.objectStore("assets").count();
    tx.oncomplete = () => resolve(r.result);
    tx.onabort = () => reject(tx.error);
  });
}
button.onclick = async () => {
  button.disabled = true;
  const checks: string[] = [],
    name = `novikov-recovery-v2-pilot-retention-gc-${crypto.randomUUID()}`;
  const report: Record<string, unknown> = {
    name,
    started: new Date().toISOString(),
    userAgent: navigator.userAgent,
    checks,
  };
  let a: IDBDatabase | undefined, b: IDBDatabase | undefined;
  const check = (ok: boolean, label: string) => {
    if (!ok) throw Error(label);
    checks.push(label);
    output.textContent = checks.join("\n");
  };
  try {
    a = await openRecoveryV2Pilot(name);
    b = await openRecoveryV2Pilot(name);
    const db = a,
      other = b,
      codec = createProjectRecoveryCodec();
    const images = ["red", "green", "blue", "purple"].map(image);
    const projects = images.map((i) => recoveryFixture("A", 10, i));
    const store = createRecoveryV2Storage(db, "A", codec),
      second = createRecoveryV2Storage(other, "B", codec);
    const writer = await prepareRecoveryV2Writer(store, "A", codec);
    for (const p of projects) await writer.save(p, () => true);
    const writerB = await prepareRecoveryV2Writer(second, "B", codec),
      projectB = recoveryFixture("B", 10, images[0]);
    await writerB.save(projectB, () => true);
    const before = await count(db),
      result = await collectRecoveryV2Pilot(db, codec);
    check(
      before === 4 &&
        result.status === "collected" &&
        result.deleted === 1 &&
        result.retained === 3,
      "Nur verwaistes Bild gelöscht; current/previous und fremder Slot geschützt",
    );
    const restoredB = await restoreRecoveryV2((await second.read()).record, "B", codec);
    check(
      serializeProject(restoredB.project) === serializeProject(projectB),
      "Anderes Projekt vollständig identisch wiederhergestellt",
    );
    const raw = (await get(db, "heads", "A")) as {
      current: { model: Record<string, unknown> };
      previous: { model: Record<string, unknown> };
    };
    await put(db, "heads", "A", {
      ...raw,
      current: { ...raw.current, model: { ...raw.current.model, assets: null } },
    });
    check(
      (await collectRecoveryV2Pilot(db, codec)).status === "skipped" && (await count(db)) === 3,
      "Beschädigter aktueller Stand verhindert Bereinigung",
    );
    const fallback = await restoreRecoveryV2((await store.read()).record, "A", codec);
    check(
      fallback.fallback && serializeProject(fallback.project) === serializeProject(projects[2]!),
      "Gültiger Vorgänger bleibt als Rückfall vollständig lesbar",
    );
    await put(db, "heads", "A", {
      ...raw,
      previous: { ...raw.previous, model: { ...raw.previous.model, assets: null } },
    });
    check(
      (await collectRecoveryV2Pilot(db, codec)).status === "skipped",
      "Beschädigter Vorgänger verhindert Bereinigung",
    );
    await put(db, "heads", "A", raw);
    await put(db, "heads", "future", { version: 999 });
    check(
      (await collectRecoveryV2Pilot(db, codec)).status === "skipped" && (await count(db)) === 3,
      "Unbekannte Version verhindert jede Löschung",
    );
    await put(db, "heads", "future", undefined);
    const legacy = "unverändertes V1-Migrationsoriginal";
    await put(db, "legacy", "A", legacy);
    check(
      (await collectRecoveryV2Pilot(db, codec)).status === "skipped" &&
        (await get(db, "legacy", "A")) === legacy,
      "V1-Präsenz blockiert Pilot; Original bleibt bytegleich",
    );
    await put(db, "legacy", "A", undefined);
    const stale = await prepareRecoveryV2Writer(
      createRecoveryV2Storage(other, "A", codec),
      "A",
      codec,
    );
    await writer.save(projects[1]!, () => true);
    check((await count(db)) === 4, "Undo-Bild nach Bereinigung erneut vollständig bereitgestellt");
    let rejected = false;
    try {
      await stale.save(projects[0]!, () => true);
    } catch (e) {
      rejected = e instanceof Error && e.message === "Recovery revision conflict";
    }
    check(rejected, "Veralteter Schreiber bleibt durch CAS gesperrt");
    // Deterministic writer interleaving while asynchronous root validation is paused.
    let resume!: () => void, entered!: () => void;
    const gate = new Promise<void>((r) => {
        resume = r;
      }),
      reached = new Promise<void>((r) => {
        entered = r;
      });
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
    const collecting = collectRecoveryV2Pilot(db, paused);
    await reached;
    await writerB.save(recoveryFixture("B", 10, images[2]), () => true);
    resume();
    check(
      (await collecting).status === "skipped" && (await count(db)) === 4,
      "Veröffentlichung während Vorbereitung invalidiert Bereinigung",
    );
    const next = await collectRecoveryV2Pilot(db, codec);
    check(
      next.status === "collected" && next.deleted === 0,
      "Neue Referenzen beider Slots nach Konflikt vollständig geschützt",
    );
    // Queue a concurrent publish: whichever transaction wins, the complete save must survive.
    const concurrent = await Promise.all([
      collectRecoveryV2Pilot(db, codec),
      writer.save(projects[0]!, () => true),
    ]);
    check(
      concurrent.length === 2 &&
        serializeProject(
          (await restoreRecoveryV2((await store.read()).record, "A", codec)).project,
        ) === serializeProject(projects[0]!),
      "Konkurrierendes Speichern und Bereinigen erhalten gültigen Stand",
    );
    const aborter = new AbortController();
    aborter.abort();
    let aborted = false;
    try {
      await collectRecoveryV2Pilot(db, codec, aborter.signal);
    } catch {
      aborted = true;
    }
    check(aborted, "Abbruch vor Start löscht nichts");
    // Image removal: two saves expire both A roots, B still owns two shared payloads.
    const empty = recoveryFixture("A", 10);
    await writer.save(empty, () => true);
    await writer.save(empty, () => true);
    // Intercept only this diagnostic connection to abort deterministically inside the write transaction.
    const original = db.transaction.bind(db);
    const inside = new AbortController();
    db.transaction = ((...args: Parameters<typeof original>) => {
      const tx = original(...args);
      if (args[1] === "readwrite") {
        const objectStore = tx.objectStore.bind(tx);
        tx.objectStore = (name: string) => {
          const store = objectStore(name);
          if (name === "assets") {
            const remove = store.delete.bind(store);
            store.delete = (key: IDBValidKey | IDBKeyRange) => {
              const request = remove(key);
              request.addEventListener("success", () => inside.abort());
              return request;
            };
          }
          return store;
        };
      }
      return tx;
    }) as typeof db.transaction;
    const beforeAbort = await count(db);
    aborted = false;
    try {
      await collectRecoveryV2Pilot(db, codec, inside.signal);
    } catch {
      aborted = true;
    } finally {
      db.transaction = original;
    }
    check(
      aborted && (await count(db)) === beforeAbort,
      "Abbruch nach ausgeführter Löschung rollt gesamten Payloadbestand zurück",
    );
    const beforeRemoval = await count(db);
    const removed = await collectRecoveryV2Pilot(db, codec);
    check(
      removed.status === "collected" &&
        removed.retained === 2 &&
        removed.deleted === beforeRemoval - 2 &&
        (await count(db)) === 2,
      "Bildentfernung bereinigt nur außerhalb aller current/previous-Referenzen",
    );
    db.close();
    other.close();
    a = await openRecoveryV2Pilot(name);
    check(
      serializeProject(
        (
          await restoreRecoveryV2(
            (await createRecoveryV2Storage(a, "A", codec).read()).record,
            "A",
            codec,
          )
        ).project,
      ) === serializeProject(empty),
      "Projekt nach DB-Neuöffnung vollständig identisch",
    );
    report["status"] = "PASS";
  } catch (e) {
    report["status"] = "FAIL";
    report["error"] = String(e);
  } finally {
    a?.close();
    b?.close();
    report["finished"] = new Date().toISOString();
    output.textContent = JSON.stringify(report, null, 2);
    button.disabled = false;
  }
};
