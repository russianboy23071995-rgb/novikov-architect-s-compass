import { createRecoverySession } from "../src/application/project-files/recovery-session.ts";
import {
  createRecoveryCatalog,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage.ts";
import { createRecoveryMaintenanceStorage } from "../src/interop/project-file/recovery-maintenance-storage.ts";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import {
  parseRecoveryV2,
  restoreRecoveryV2,
} from "../src/application/project-files/recovery-v2.ts";
import type { MaintenanceState } from "../src/application/project-files/recovery-maintenance.ts";
import { image, payloadStats } from "./recovery-session-fixture.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
const output = document.querySelector("#result")!;
const button = document.querySelector<HTMLButtonElement>("#run")!;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
button.onclick = async () => {
  button.disabled = true;
  const start = performance.now();
  const events: { ms: number; state: MaintenanceState }[] = [];
  const report: Record<string, unknown> = {
    events,
    limitations:
      "Real 30-second idle time and IndexedDB. Programmatic activity signal; manual retry after abort. Five-minute automatic retry remains deterministic unit-test evidence, not waited here. No user database.",
  };
  let service: ReturnType<typeof createRecoverySession> | undefined;
  try {
    const name = `novikov-recovery-v2-pilot-automatic-${crypto.randomUUID()}`;
    report["name"] = name;
    const catalog = createRecoveryCatalog(() => openRecoveryDatabase(name), true),
      v2 = catalog.v2!;
    const storage = createRecoveryMaintenanceStorage(() => openRecoveryDatabase(name));
    let state: MaintenanceState = { status: "idle", message: "" };
    service = createRecoverySession(
      catalog,
      storage,
      () => {},
      (next) => {
        state = next;
        events.push({ ms: performance.now() - start, state: next });
      },
      {
        now: () => performance.now(),
        schedule(callback, ms) {
          const timer = setTimeout(callback, ms);
          return () => clearTimeout(timer);
        },
      },
      true,
    );
    const foreign = recoveryFixture("foreign", 1000, image(999));
    await (
      await prepareRecoveryV2Writer(v2.project("foreign"), "foreign", v2.codec)
    ).save(foreign, () => true);
    let previous = recoveryFixture("active", 1000, image(201)),
      current = previous;
    service.hold("setup", true);
    for (let i = 0; i < 3; i++) {
      previous = current;
      current = recoveryFixture("active", 1000, image(201 + i));
      service.update(current, "same-context");
      await service.saveNow();
    }
    const verify = async () => {
      const raw = (await v2.project("active").read()).record,
        record = parseRecoveryV2(raw);
      if (!record.previous) throw Error("Missing previous");
      if (
        serializeProject((await restoreRecoveryV2(raw, "active", v2.codec)).project) !==
        serializeProject(current)
      )
        throw Error("Current mismatch");
      if (
        serializeProject(await v2.codec.restore(record.previous.document, {})) !==
        serializeProject(previous)
      )
        throw Error("Previous mismatch");
      if (
        serializeProject(
          (
            await restoreRecoveryV2(
              (await v2.project("foreign").read()).record,
              "foreign",
              v2.codec,
            )
          ).project,
        ) !== serializeProject(foreign)
      )
        throw Error("Foreign mismatch");
    };
    report["before"] = await payloadStats(name);
    service.hold("setup", false);
    output.textContent = "Echte Ruhephase läuft; Aktivität setzt sie nach 3 Sekunden zurück.";
    await delay(3000);
    service.activity();
    const activityAt = performance.now();
    await delay(28000);
    if (events.some((e) => e.state.status === "running"))
      throw Error("Maintenance started before quiet period");
    output.textContent = "Kein vorzeitiger Start. Warte auf automatische Wartung…";
    const deadline = performance.now() + 15000;
    while (state.status !== "success" && performance.now() < deadline) await delay(100);
    if (state.status !== "success") throw Error(`Automatic run failed: ${state.status}`);
    report["quietBeforeStartMs"] =
      events.find((e) => e.state.status === "running")!.ms + start - activityAt;
    report["afterAutomatic"] = await payloadStats(name);
    if ((report["afterAutomatic"] as { count: number }).count !== 3)
      throw Error("Retention mismatch");
    await verify();
    previous = current;
    current = recoveryFixture("active", 1000, image(204));
    service.update(current, "same-context");
    await service.saveNow();
    const beforeAbort = await payloadStats(name);
    const timer = setTimeout(() => service!.activity(), 10);
    try {
      await service.runMaintenance();
    } finally {
      clearTimeout(timer);
    }
    if ((state as MaintenanceState).status !== "cancelled")
      throw Error("Expected preparation abort");
    if ((await payloadStats(name)).count !== beforeAbort.count) throw Error("Abort deleted data");
    await verify();
    report["abort"] = "PASS: all current/previous/foreign contents preserved";
    await service.runMaintenance();
    if ((state as MaintenanceState).status !== "success") throw Error("Manual retry failed");
    await verify();
    report["afterRetry"] = await payloadStats(name);
    if ((report["afterRetry"] as { count: number }).count !== 3)
      throw Error("Retry retention mismatch");
    report["status"] = "PASS";
  } catch (error) {
    report["status"] = "FAIL";
    report["error"] = String(error);
  } finally {
    service?.dispose();
    report["elapsedMs"] = performance.now() - start;
    output.textContent = JSON.stringify(report, null, 2);
    button.disabled = false;
  }
};
