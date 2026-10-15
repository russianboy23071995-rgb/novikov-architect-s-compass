import { createRecoveryMaintenanceStorage } from "../src/interop/project-file/recovery-maintenance-storage.ts";
import {
  createRecoveryCatalog,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage.ts";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import {
  parseRecoveryV2,
  restoreRecoveryV2,
} from "../src/application/project-files/recovery-v2.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";

function image(seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(1024, 1024);
  let value = seed;
  for (let i = 0; i < pixels.data.length; i += 4) {
    value = (Math.imul(value, 1664525) + 1013904223) | 0;
    pixels.data[i] = value & 255;
    pixels.data[i + 1] = (value >>> 8) & 255;
    pixels.data[i + 2] = (value >>> 16) & 255;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return createImageAssetHandle({
    id: "image",
    mimeType: "image/png",
    pixelWidth: 1024,
    pixelHeight: 1024,
    data: canvas.toDataURL().split(",")[1],
  });
}
async function payloadStats(name: string) {
  const db = await openRecoveryDatabase(name);
  try {
    return await new Promise<{ count: number; base64Characters: number }>((resolve, reject) => {
      const tx = db.transaction("recovery-v2-assets"),
        req = tx.objectStore("recovery-v2-assets").openCursor();
      let count = 0,
        base64Characters = 0;
      req.onsuccess = () => {
        const c = req.result;
        if (c) {
          count++;
          base64Characters += String(c.value.data ?? "").length;
          c.continue();
        }
      };
      tx.oncomplete = () => resolve({ count, base64Characters });
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector("#result")!;
button.onclick = async () => {
  button.disabled = true;
  const name = `novikov-recovery-v2-pilot-session-${crypto.randomUUID()}`;
  const rows: unknown[] = [];
  const report: Record<string, unknown> = {
    name,
    started: new Date().toISOString(),
    userAgent: navigator.userAgent,
    rows,
    limitations:
      "24 accelerated cycles; DB connection reopen, not full browser restart; prior model re-save, not UI Undo; storage character count is not disk/heap usage; no quota exhaustion.",
  };
  const longTasks: { startTime: number; duration: number }[] = [];
  const observer = PerformanceObserver.supportedEntryTypes.includes("longtask")
    ? new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          longTasks.push({ startTime: e.startTime, duration: e.duration });
      })
    : null;
  observer?.observe({ type: "longtask", buffered: false });
  let pulse = performance.now(),
    maxGap = 0;
  const timer = setInterval(() => {
    const now = performance.now();
    maxGap = Math.max(maxGap, now - pulse);
    pulse = now;
  }, 16);
  try {
    const catalog = createRecoveryCatalog(() => openRecoveryDatabase(name), true),
      v2 = catalog.v2!,
      codec = v2.codec;
    const maintenance = createRecoveryMaintenanceStorage(() => openRecoveryDatabase(name));
    const original = recoveryFixture("session", 1000, image(1));
    const foreign = recoveryFixture("foreign", 1000, image(900));
    await (
      await prepareRecoveryV2Writer(v2.project("foreign"), "foreign", codec)
    ).save(foreign, () => true);
    let writer = await prepareRecoveryV2Writer(v2.project("session"), "session", codec);
    let previous = original;
    for (let cycle = 0; cycle < 24; cycle++) {
      const current =
        cycle % 4 === 2
          ? recoveryFixture("session", 1000)
          : cycle % 4 === 3
            ? original
            : recoveryFixture("session", 1000, image(cycle + 10));
      const started = performance.now();
      await writer.save(current, () => true);
      const saveMs = performance.now() - started;
      let maintenanceStarted: number | null = null;
      let maintenanceFinished: number | null = null;
      let maintenanceMs: number | null = null,
        before: unknown = null,
        after: unknown = null;
      if (cycle % 4 === 2 || cycle % 4 === 3) {
        before = await payloadStats(name);
        const start = performance.now();
        maintenanceStarted = start;
        const collected = await maintenance.collect(new AbortController().signal);
        maintenanceFinished = performance.now();
        maintenanceMs = maintenanceFinished - start;
        if (collected.status !== "collected") throw Error("Unexpected retention skip");
        after = await payloadStats(name);
        if ((after as { count: number }).count > 3) throw Error("Unbounded retained payload count");
      }
      const raw = (await v2.project("session").read()).record;
      const restored = (await restoreRecoveryV2(raw, "session", codec)).project;
      if (serializeProject(restored) !== serializeProject(current))
        throw Error(`Current mismatch ${cycle}`);
      if (cycle > 0) {
        const record = parseRecoveryV2(raw);
        if (
          !record.previous ||
          serializeProject(await codec.restore(record.previous.document, {})) !==
            serializeProject(previous)
        )
          throw Error(`Previous mismatch ${cycle}`);
      }
      if (
        serializeProject(
          (await restoreRecoveryV2((await v2.project("foreign").read()).record, "foreign", codec))
            .project,
        ) !== serializeProject(foreign)
      )
        throw Error("Foreign slot changed");
      if (cycle % 4 === 3)
        writer = await prepareRecoveryV2Writer(v2.project("session"), "session", codec);
      previous = current;
      rows.push({
        cycle,
        kind: cycle % 4 === 2 ? "remove" : cycle % 4 === 3 ? "restore-old-model" : "replace-image",
        saveMs,
        maintenanceMs,
        maintenanceStarted,
        maintenanceFinished,
        before,
        after,
      });
      output.textContent = `Lauf ${cycle + 1}/24, aktueller und vorheriger Stand sowie fremdes Projekt identisch.`;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    report["status"] = "PASS";
    report["finalPayloads"] = await payloadStats(name);
  } catch (error) {
    report["status"] = "FAIL";
    report["error"] = String(error);
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 50));
    observer?.disconnect();
    report["longTasks"] = observer ? longTasks : null;
    clearInterval(timer);
    report["maxObservedTimerGapMs"] = maxGap;
    report["finished"] = new Date().toISOString();
    output.textContent = JSON.stringify(report, null, 2);
    button.disabled = false;
  }
};
