import {
  createRecoveryCatalog,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage.ts";
import { createRecoveryMaintenanceStorage } from "../src/interop/project-file/recovery-maintenance-storage.ts";
import { collectRecoveryPayloads } from "../src/interop/project-file/recovery-retention.ts";
import { recoveryV2Layout } from "../src/interop/project-file/recovery-layout.ts";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import {
  parseRecoveryV2,
  restoreRecoveryV2,
  type RecoveryV2Codec,
} from "../src/application/project-files/recovery-v2.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { image, payloadStats } from "./recovery-session-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
const output = document.querySelector("#result")!;
const button = document.querySelector<HTMLButtonElement>("#run")!;
button.onclick = async () => {
  button.disabled = true;
  const report: Record<string, unknown> = {
    limitations:
      "Two independent writer/catalog instances and separate IndexedDB connections in one browser page. Forced interleaving at codec restore; not two tabs/processes or a duration/throughput guarantee.",
  };
  try {
    const name = `novikov-recovery-v2-pilot-concurrent-${crypto.randomUUID()}`;
    report["name"] = name;
    const a = createRecoveryCatalog(() => openRecoveryDatabase(name), true).v2!;
    const b = createRecoveryCatalog(() => openRecoveryDatabase(name), true).v2!;
    const old = recoveryFixture("active", 1000, image(401));
    const base = recoveryFixture("active", 1000, image(402));
    const next = recoveryFixture("active", 1000, image(403));
    const foreign = recoveryFixture("foreign", 1000, image(404));
    const seed = await prepareRecoveryV2Writer(a.project("active"), "active", a.codec);
    await seed.save(old, () => true);
    await seed.save(base, () => true);
    await (
      await prepareRecoveryV2Writer(a.project("foreign"), "foreign", a.codec)
    ).save(foreign, () => true);
    const winner = await prepareRecoveryV2Writer(a.project("active"), "active", a.codec);
    const stale = await prepareRecoveryV2Writer(b.project("active"), "active", b.codec);
    let interleaved = false;
    const gated: RecoveryV2Codec = {
      ...a.codec,
      restore: async (...args) => {
        if (!interleaved) {
          interleaved = true;
          await winner.save(next, () => true);
        }
        return a.codec.restore(...args);
      },
    };
    const db = await openRecoveryDatabase(name);
    try {
      report["interruptedCollection"] = await collectRecoveryPayloads(
        db,
        gated,
        undefined,
        recoveryV2Layout,
      );
    } finally {
      db.close();
    }
    if (
      !interleaved ||
      (report["interruptedCollection"] as { status: string }).status !== "skipped"
    )
      throw Error("Root change did not stop collection");
    if ((await payloadStats(name)).count !== 4)
      throw Error("Interrupted collector deleted payloads");
    let rejected = false;
    try {
      await stale.save(old, () => true);
    } catch {
      rejected = true;
    }
    if (!rejected) throw Error("Stale writer overwrote winner");
    report["staleWriterRejected"] = true;
    const verify = async () => {
      const raw = (await b.project("active").read()).record,
        record = parseRecoveryV2(raw);
      if (!record.previous) throw Error("Previous missing");
      if (
        serializeProject((await restoreRecoveryV2(raw, "active", b.codec)).project) !==
        serializeProject(next)
      )
        throw Error("Winner lost");
      if (
        serializeProject(await b.codec.restore(record.previous.document, {})) !==
        serializeProject(base)
      )
        throw Error("Previous lost");
      if (
        serializeProject(
          (await restoreRecoveryV2((await b.project("foreign").read()).record, "foreign", b.codec))
            .project,
        ) !== serializeProject(foreign)
      )
        throw Error("Foreign lost");
    };
    await verify();
    report["parallelCollectors"] = await Promise.all([
      createRecoveryMaintenanceStorage(() => openRecoveryDatabase(name)).collect(
        new AbortController().signal,
      ),
      createRecoveryMaintenanceStorage(() => openRecoveryDatabase(name)).collect(
        new AbortController().signal,
      ),
    ]);
    await verify();
    report["payloads"] = await payloadStats(name);
    if ((report["payloads"] as { count: number }).count !== 3)
      throw Error("Protected payload count differs");
    report["status"] = "PASS";
  } catch (error) {
    report["status"] = "FAIL";
    report["error"] = String(error);
  } finally {
    output.textContent = JSON.stringify(report, null, 2);
    button.disabled = false;
  }
};
