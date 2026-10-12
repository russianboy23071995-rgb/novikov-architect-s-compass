import {
  createRecoveryCatalog,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage";
import {
  listRecoveryProjects,
  readProjectRecovery,
  saveProjectRecovery,
} from "../src/application/project-files/recovery-catalog";
import { createAutosaveController } from "../src/application/project-files/autosave";
import { startRecoveryOffer } from "../src/application/project-files/recovery-offer";
import { serializeProject } from "../src/lib/bim/model";
import { recoveryFixture } from "./recovery-capacity-fixture";
import type { RecoveryRecordV2 } from "../src/application/project-files/recovery-v2";
if (!import.meta.env.DEV || location.port !== "8084") throw new Error("Diagnostic only");
const root = document.getElementById("root")!;
root.style.cssText = "font:15px system-ui;max-width:1050px;margin:35px auto";
root.innerHTML =
  '<h1>V2: bestehender Sicherungs- und Wiederaufnahmeablauf</h1><p>Separate Testdatenbank. Produktionskatalog, Autosave-Controller und Wiederaufnahme-Query.</p><button id="run">Prüfung starten</button><p role="status">Bereit</p><pre id="output"></pre>';
const run = document.querySelector<HTMLButtonElement>("#run")!,
  status = document.querySelector<HTMLElement>('[role="status"]')!;
run.onclick = async () => {
  run.disabled = true;
  const name = `novikov-routing-test-${crypto.randomUUID()}`,
    checks: string[] = [];
  const result: Record<string, unknown> = { name, started: new Date().toISOString(), checks };
  let controller: ReturnType<typeof createAutosaveController> | undefined;
  const check = (ok: boolean, label: string) => {
    if (!ok) throw new Error(label);
    checks.push(label);
  };
  const reject = async (fn: () => Promise<unknown>, label: string) => {
    let failed = false;
    try {
      await fn();
    } catch {
      failed = true;
    }
    check(failed, label);
  };
  const open = () => openRecoveryDatabase(name);
  const read = async (store: string, key: string) => {
    const db = await open();
    try {
      return await new Promise<unknown>((resolve, reject) => {
        const tx = db.transaction(store),
          req = tx.objectStore(store).get(key);
        tx.oncomplete = () => resolve(req.result);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  };
  const put = async (store: string, key: string, value: unknown) => {
    const db = await open();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  };
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 2;
    canvas.getContext("2d")!.fillRect(0, 0, 2, 2);
    const image = {
      id: "plan",
      mimeType: "image/png" as const,
      pixelWidth: 2,
      pixelHeight: 2,
      data: canvas.toDataURL().split(",")[1]!,
    };
    const a = recoveryFixture("selected", 10, image),
      b = recoveryFixture("untouched", 10);
    const record = (p: typeof a) =>
      JSON.stringify({
        version: 1,
        current: { savedAt: "2026-10-12T00:00:00Z", json: serializeProject(p) },
      });
    const rawA = record(a),
      rawB = record(b);
    // Real version-2 database before application upgrade; includes old manual slot.
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open(name, 2);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("snapshots");
        r.result.createObjectStore("recovery-index");
      };
      r.onerror = () => reject(r.error);
      r.onsuccess = () => {
        const db = r.result,
          tx = db.transaction(["snapshots", "recovery-index"], "readwrite");
        tx.objectStore("snapshots").put(rawA, "manual");
        tx.objectStore("snapshots").put(rawA, "project:selected");
        tx.objectStore("snapshots").put(rawB, "project:untouched");
        for (const id of [a.id, b.id])
          tx.objectStore("recovery-index").put(
            { projectId: id, savedAt: "2026-10-12T00:00:00Z" },
            id,
          );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
    let catalog = createRecoveryCatalog(open, true);
    const listing = await listRecoveryProjects(catalog);
    check(listing.projects.length === 2, "V2-Upgrade erhält beide Katalogeinträge");
    check((await read("snapshots", "manual")) === rawA, "Manueller V1-Originalslot unverändert");
    check((await read("recovery-v2-heads", a.id)) === undefined, "Auflisten migriert kein Projekt");
    check(
      serializeProject((await readProjectRecovery(catalog, a.id))!.project) === serializeProject(a),
      "V1-Wiederaufnahme vor Migration identisch",
    );
    controller = createAutosaveController(catalog, () => {});
    controller.update(a, "session");
    await controller.saveNow();
    check(
      ((await read("recovery-v2-heads", a.id)) as { version: number }).version === 2,
      "Bestehender Save-Controller publiziert V2",
    );
    check(
      (await read("snapshots", "project:selected")) === rawA,
      "Ausgewähltes V1-Original bleibt erhalten",
    );
    check(
      (await read("snapshots", "project:untouched")) === rawB &&
        (await read("recovery-v2-heads", b.id)) === undefined,
      "Anderes Projekt wird nicht migriert",
    );
    const changed = { ...a, storey: { ...a.storey, lines: [] } };
    controller.update(changed, "session");
    await controller.saveNow();
    controller.dispose();
    controller = undefined;
    // New catalog/controller are equivalent to restart; every adapter call closes its DB connection.
    catalog = createRecoveryCatalog(open, true);
    let offered = false;
    await startRecoveryOffer(catalog, (offer) => {
      offered = offer.kind === "available" && offer.projects.some((p) => p.projectId === a.id);
    }).done;
    check(offered, "Startangebot findet V2 nach Neustart");
    check(
      serializeProject((await readProjectRecovery(catalog, a.id))!.project) ===
        serializeProject(changed),
      "Wiederaufnahme nach Neustart vollständig identisch",
    );
    const port = catalog.v2!.project(a.id),
      source = await port.read(),
      head = source.record as RecoveryRecordV2;
    check(
      (await catalog.list()).find((p) => p.projectId === a.id)!.savedAt === head.current.savedAt,
      "Katalog und Head tragen denselben Speicherzeitpunkt",
    );
    const oldIndex = await read("recovery-index", a.id),
      oldHead = await read("recovery-v2-heads", a.id);
    let contextChecks = 0;
    await reject(
      () =>
        port.publish(
          { legacy: rawA, revision: head.revision },
          {
            ...head,
            revision: crypto.randomUUID(),
            current: { ...head.current, savedAt: "2026-10-12T23:59:00Z" },
          },
          undefined,
          () => ++contextChecks < 4,
        ),
      "Später Abbruch verwirft Katalog- und Headwrite",
    );
    check(
      JSON.stringify(await read("recovery-index", a.id)) === JSON.stringify(oldIndex) &&
        JSON.stringify(await read("recovery-v2-heads", a.id)) === JSON.stringify(oldHead),
      "Atomarer Rollback erhält Katalog und Head",
    );
    await reject(
      () => catalog.project(a.id).replace(rawA, rawA + " "),
      "Alter V1-Schreibpfad überschreibt keinen V2-Katalog",
    );
    const broken = structuredClone(oldHead) as { current: { model: { id: string } } };
    broken.current.model.id = "foreign";
    await put("recovery-v2-heads", a.id, broken);
    const fallback = await readProjectRecovery(catalog, a.id);
    check(
      !!fallback?.fallback && serializeProject(fallback.project) === serializeProject(a),
      "Beschädigtes current bietet gültigen Vorgänger an",
    );
    await put("recovery-v2-heads", a.id, { version: 99, revision: head.revision });
    await reject(
      () => readProjectRecovery(catalog, a.id),
      "Unbekannte Version wird als Fehler sichtbar",
    );
    await reject(
      () => saveProjectRecovery(a, catalog),
      "Unbekannte Version wird nicht überschrieben",
    );
    check(
      (await listRecoveryProjects(catalog)).projects.some((p) => p.projectId === a.id),
      "Unlesbarer Stand bleibt im Katalog sichtbar",
    );
    await put("recovery-v2-heads", a.id, oldHead);
    check(
      serializeProject((await readProjectRecovery(catalog, a.id))!.project) ===
        serializeProject(changed),
      "Gültiger Stand nach Fehlerprüfung unverändert",
    );
    let scheduled: (() => void) | undefined,
      finish!: () => void,
      began = false;
    const autosaved = new Promise<void>((resolve) => {
      finish = resolve;
    });
    controller = createAutosaveController(
      catalog,
      (state) => {
        if (state.busy) began = true;
        if (began && !state.busy) finish();
      },
      {
        schedule(callback) {
          scheduled = callback;
          return () => {
            scheduled = undefined;
          };
        },
      },
    );
    controller.update(changed, "auto");
    controller.setEnabled(true);
    controller.update(a, "auto");
    if (!scheduled) throw new Error("Autosave timer missing");
    scheduled();
    await autosaved;
    check(
      serializeProject((await readProjectRecovery(catalog, a.id))!.project) === serializeProject(a),
      "Automatische Sicherung über bestehenden Timer-/Controllerpfad übernimmt Bild und Modell",
    );
    result["status"] = "passed";
    status.textContent = `Bestanden: ${checks.length} Prüfungen. Produktive Nutzerdaten unverändert.`;
  } catch (error) {
    result["status"] = "failed";
    result["error"] = String(error);
    status.textContent = String(error);
  } finally {
    controller?.dispose();
    run.disabled = false;
    document.getElementById("output")!.textContent = JSON.stringify(result, null, 2);
  }
};
