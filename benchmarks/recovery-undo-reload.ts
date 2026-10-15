import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
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
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";

const key = "novikov-diagnostic-undo-reload-v1";
const output = document.querySelector("#result")!;
const run = document.querySelector<HTMLButtonElement>("#run")!;
type Checkpoint = {
  name: string;
  current: string;
  previous: string;
  foreign: string;
  saves: number;
};
async function digest(text: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, "0")).join("");
}
async function verify(c: Checkpoint) {
  if (!c.name.startsWith("novikov-recovery-v2-pilot-undo-"))
    throw Error("Invalid diagnostic database");
  const v2 = createRecoveryCatalog(() => openRecoveryDatabase(c.name), true).v2!;
  const raw = (await v2.project("session").read()).record;
  const record = parseRecoveryV2(raw);
  if (!record.previous) throw Error("Missing previous");
  const values = [
    (await restoreRecoveryV2(raw, "session", v2.codec)).project,
    await v2.codec.restore(record.previous.document, {}),
    (await restoreRecoveryV2((await v2.project("foreign").read()).record, "foreign", v2.codec))
      .project,
  ];
  const hashes = await Promise.all(values.map((p) => digest(serializeProject(p))));
  if (hashes.join() !== [c.current, c.previous, c.foreign].join())
    throw Error("Recovery content mismatch");
}
run.onclick = async () => {
  run.disabled = true;
  try {
    const name = `novikov-recovery-v2-pilot-undo-${crypto.randomUUID()}`;
    const v2 = createRecoveryCatalog(() => openRecoveryDatabase(name), true).v2!;
    const maintenance = createRecoveryMaintenanceStorage(() => openRecoveryDatabase(name));
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#227788";
    ctx.fillRect(0, 0, 1024, 1024);
    const asset = createImageAssetHandle({
      id: "image",
      mimeType: "image/png",
      pixelWidth: 1024,
      pixelHeight: 1024,
      data: canvas.toDataURL().split(",")[1],
    });
    const original = recoveryFixture("session", 1000, asset);
    const removed = recoveryFixture("session", 1000);
    const foreign = recoveryFixture("foreign", 1000, asset);
    await (
      await prepareRecoveryV2Writer(v2.project("foreign"), "foreign", v2.codec)
    ).save(foreign, () => true);
    const writer = await prepareRecoveryV2Writer(v2.project("session"), "session", v2.codec);
    let state = createEditingState(original),
      previous = original,
      saves = 0;
    await writer.save(original, () => true);
    for (let cycle = 0; cycle < 8; cycle++) {
      for (const event of [
        { type: "project", project: removed },
        { type: "undo" },
        { type: "redo" },
        { type: "undo" },
      ] as const) {
        previous = state.history.present;
        state = editingReducer(state, event);
        if (state.error) throw Error(state.error);
        const expected = event.type === "undo" ? original : removed;
        if (serializeProject(state.history.present) !== serializeProject(expected))
          throw Error("Application history mismatch");
        await writer.save(state.history.present, () => true);
        saves++;
        const result = await maintenance.collect(new AbortController().signal);
        if (result.status !== "collected") throw Error("Maintenance skipped");
        const checkpoint: Checkpoint = {
          name,
          current: await digest(serializeProject(state.history.present)),
          previous: await digest(serializeProject(previous)),
          foreign: await digest(serializeProject(foreign)),
          saves,
        };
        await verify(checkpoint);
        sessionStorage.setItem(key, JSON.stringify(checkpoint));
        output.textContent = `Verified ${saves}/32 saves with Application Undo/Redo and maintenance`;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    output.textContent = JSON.stringify(
      {
        status: "READY_FOR_RELOAD",
        saves,
        limitations:
          "Accelerated Application test, not UI gestures or hours-long session. Reload validates saved models, not persistence of undo history.",
      },
      null,
      2,
    );
  } catch (error) {
    output.textContent = `FAIL: ${String(error)}`;
  } finally {
    run.disabled = false;
  }
};
const saved = sessionStorage.getItem(key);
if (saved) {
  run.disabled = true;
  try {
    const checkpoint: Checkpoint = JSON.parse(saved);
    await verify(checkpoint);
    output.textContent = JSON.stringify(
      {
        status: "RELOAD_PASS",
        ...checkpoint,
        navigationType: (
          performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
        )?.type,
      },
      null,
      2,
    );
  } catch (error) {
    output.textContent = `FAIL: ${String(error)}`;
  } finally {
    run.disabled = false;
  }
}
