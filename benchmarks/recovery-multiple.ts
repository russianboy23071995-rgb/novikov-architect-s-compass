import { image, payloadStats } from "./recovery-session-fixture.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
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
import { serializeProject } from "../src/lib/bim/model.ts";
const output = document.querySelector("#result")!;
const button = document.querySelector<HTMLButtonElement>("#run")!;
async function hash(value: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
}
button.onclick = async () => {
  button.disabled = true;
  const report: Record<string, unknown> = {
    limitations:
      "Synthetic eight-project workload. Optional heap values are coarse/shared; not process/GPU peaks. Abort tested during preparation, not forced inside deletion transaction. No user database.",
  };
  try {
    const name = `novikov-recovery-v2-pilot-multiple-${crypto.randomUUID()}`;
    report["name"] = name;
    const v2 = createRecoveryCatalog(() => openRecoveryDatabase(name), true).v2!;
    const expected: { id: string; current: string; previous: string }[] = [];
    for (let i = 0; i < 8; i++) {
      const id = `project-${i}`;
      const writer = await prepareRecoveryV2Writer(v2.project(id), id, v2.codec);
      const hashes: string[] = [];
      for (let revision = 0; revision < 3; revision++) {
        const project = recoveryFixture(id, 1000, image(i * 3 + revision + 100));
        hashes.push(await hash(serializeProject(project)));
        await writer.save(project, () => true);
      }
      expected.push({ id, current: hashes[2]!, previous: hashes[1]! });
      output.textContent = `Prepared ${i + 1}/8 projects`;
    }
    const maintenance = createRecoveryMaintenanceStorage(() => openRecoveryDatabase(name));
    const verify = async () => {
      for (const e of expected) {
        const raw = (await v2.project(e.id).read()).record;
        const record = parseRecoveryV2(raw);
        if (!record.previous) throw Error("Previous missing");
        if (
          (await hash(serializeProject((await restoreRecoveryV2(raw, e.id, v2.codec)).project))) !==
            e.current ||
          (await hash(serializeProject(await v2.codec.restore(record.previous.document, {})))) !==
            e.previous
        )
          throw Error(`Content mismatch ${e.id}`);
      }
    };
    report["before"] = await payloadStats(name);
    for (const phase of ["before-open", "during-preparation"]) {
      const abort = new AbortController();
      if (phase === "before-open") abort.abort();
      const timer = phase === "during-preparation" ? setTimeout(() => abort.abort(), 10) : null;
      let rejected = false;
      try {
        await maintenance.collect(abort.signal);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
        rejected = true;
      } finally {
        if (timer !== null) clearTimeout(timer);
      }
      if (!rejected) throw Error(`Abort did not reject: ${phase}`);
      if ((await payloadStats(name)).count !== 24) throw Error("Abort removed payloads");
      await verify();
      report[phase] = "PASS: 24 payloads and all current/previous states intact";
    }
    const samples: { ms: number; heap: number | null }[] = [];
    const start = performance.now();
    const sample = () =>
      samples.push({
        ms: performance.now() - start,
        heap:
          (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
            ?.usedJSHeapSize ?? null,
      });
    sample();
    const timer = setInterval(sample, 20);
    try {
      report["collected"] = await maintenance.collect(new AbortController().signal);
    } finally {
      clearInterval(timer);
      sample();
    }
    report["maintenanceMs"] = performance.now() - start;
    report["maintenanceHeapSamples"] = samples;
    report["after"] = await payloadStats(name);
    if ((report["after"] as { count: number }).count !== 16)
      throw Error("Expected sixteen protected payloads");
    await verify();
    report["status"] = "PASS";
  } catch (error) {
    report["status"] = "FAIL";
    report["error"] = String(error);
  } finally {
    output.textContent = JSON.stringify(report, null, 2);
    button.disabled = false;
  }
};
