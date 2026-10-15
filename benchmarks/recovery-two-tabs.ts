import {
  createRecoveryCatalog,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage.ts";
import { createRecoveryMaintenanceStorage } from "../src/interop/project-file/recovery-maintenance-storage.ts";
import { createRecoverySession } from "../src/application/project-files/recovery-session.ts";
import { observeRecoveryActivity } from "../src/interop/project-file/recovery-activity.ts";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import {
  parseRecoveryV2,
  restoreRecoveryV2,
} from "../src/application/project-files/recovery-v2.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { image, payloadStats } from "./recovery-session-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
const params = new URLSearchParams(location.search),
  run = params.get("run"),
  role = params.get("role");
if (!run || !/^[a-z0-9-]{8,80}$/.test(run) || !["a", "b"].includes(role ?? ""))
  throw Error("Explicit isolated test identity required");
const name = `novikov-recovery-v2-pilot-tabs-${run}`;
const catalog = createRecoveryCatalog(() => openRecoveryDatabase(name), true),
  v2 = catalog.v2!;
const output = document.querySelector("#result")!;
const events: unknown[] = [];
const report: Record<string, unknown> = {
  role,
  name,
  events,
  limitations:
    "Real separate tabs; deterministic writer conflict. Lifecycle log records only events actually delivered. No process-kill, quota or hours test.",
};
const show = () => {
  output.textContent = JSON.stringify(report, null, 2);
};
const session = createRecoverySession(
  catalog,
  createRecoveryMaintenanceStorage(() => openRecoveryDatabase(name)),
  () => {},
  (s) => {
    events.push({ maintenance: s });
    show();
  },
  {
    now: () => performance.now(),
    schedule(callback, ms) {
      const id = setTimeout(callback, ms);
      return () => clearTimeout(id);
    },
  },
  false,
);
const stop = observeRecoveryActivity(document, window, {
  activity: session.activity,
  hold: session.hold,
  visible(value) {
    events.push({ visible: value });
    session.visible(value);
    show();
  },
});
window.addEventListener(
  "pagehide",
  () => {
    stop();
    session.dispose();
  },
  { once: true },
);
let writer: Awaited<ReturnType<typeof prepareRecoveryV2Writer>> | undefined;
const project = (seed: number) => recoveryFixture("active", 1000, image(seed));
const foreign = () => recoveryFixture("foreign", 1000, image(509));
async function action(kind: string) {
  try {
    if (kind === "init") {
      if (role !== "a") throw Error("Only A initializes");
      if ((await v2.project("active").read()).record !== null)
        throw Error("Test database already seeded");
      const seed = await prepareRecoveryV2Writer(v2.project("active"), "active", v2.codec);
      await seed.save(project(500), () => true);
      await seed.save(project(501), () => true);
      await (
        await prepareRecoveryV2Writer(v2.project("foreign"), "foreign", v2.codec)
      ).save(foreign(), () => true);
      report["initialized"] = true;
    } else if (kind === "prepare") {
      writer = await prepareRecoveryV2Writer(v2.project("active"), "active", v2.codec);
      report["prepared"] = true;
    } else if (kind === "save") {
      if (!writer) throw Error("Prepare first");
      try {
        await writer.save(project(role === "a" ? 502 : 503), () => true);
        report["save"] = "committed";
      } catch (error) {
        report["save"] = "rejected";
        report["saveError"] = String(error);
      }
    } else if (kind === "maintain") {
      await session.runMaintenance();
      report["payloads"] = await payloadStats(name);
    } else if (kind === "verify") {
      const raw = (await v2.project("active").read()).record,
        record = parseRecoveryV2(raw);
      if (!record.previous) throw Error("Missing previous");
      if (
        serializeProject((await restoreRecoveryV2(raw, "active", v2.codec)).project) !==
        serializeProject(project(502))
      )
        throw Error("Winner changed");
      if (
        serializeProject(await v2.codec.restore(record.previous.document, {})) !==
        serializeProject(project(501))
      )
        throw Error("Previous changed");
      if (
        serializeProject(
          (
            await restoreRecoveryV2(
              (await v2.project("foreign").read()).record,
              "foreign",
              v2.codec,
            )
          ).project,
        ) !== serializeProject(foreign())
      )
        throw Error("Foreign changed");
      report["verification"] = "PASS: winner, previous, foreign identical";
      report["payloads"] = await payloadStats(name);
    }
  } catch (error) {
    report["error"] = String(error);
  } finally {
    show();
  }
}
for (const button of document.querySelectorAll<HTMLButtonElement>("button[data-action]"))
  button.onclick = async () => {
    button.disabled = true;
    try {
      await action(button.dataset["action"]!);
    } finally {
      button.disabled = false;
    }
  };
show();
