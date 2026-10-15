import { storeyOf, replaceStorey } from "../src/domain/storeys/access.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history.ts";
import {
  openRecoveryV2Pilot,
  createRecoveryV2Storage,
} from "../src/interop/project-file/recovery-v2-storage.ts";
import { createProjectRecoveryCodec } from "../src/interop/project-file/recovery-codec.ts";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import { restoreRecoveryV2 } from "../src/application/project-files/recovery-v2.ts";
const output = document.querySelector("#result")!,
  button = document.querySelector<HTMLButtonElement>("#run")!;
const check = (ok: boolean, label: string) => {
  if (!ok) throw Error(label);
};
function image(seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!,
    data = ctx.createImageData(256, 256);
  let n = seed + 1;
  for (let i = 0; i < data.data.length; i += 4) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    data.data[i] = n & 255;
    data.data[i + 1] = (n >>> 8) & 255;
    data.data[i + 2] = (n >>> 16) & 255;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  return createImageAssetHandle({
    id: "image",
    mimeType: "image/png",
    pixelWidth: 256,
    pixelHeight: 256,
    data: canvas.toDataURL("image/png").split(",")[1],
  });
}
async function all(db: IDBDatabase, store: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store),
      r = tx.objectStore(store).getAll();
    tx.oncomplete = () => resolve(r.result);
    tx.onabort = () => reject(tx.error);
  });
}
button.onclick = async () => {
  button.disabled = true;
  const name = `novikov-recovery-v2-pilot-retention-${crypto.randomUUID()}`,
    report: Record<string, unknown> = {
      name,
      userAgent: navigator.userAgent,
      started: new Date().toISOString(),
      snapshots: [],
    };
  let db: IDBDatabase | undefined, other: IDBDatabase | undefined;
  try {
    db = await openRecoveryV2Pilot(name);
    other = await openRecoveryV2Pilot(name);
    const codec = createProjectRecoveryCodec(),
      initial = image(0);
    const rows: unknown[] = [];
    const expectedImages = new Map<string, string>();
    report["snapshots"] = rows;
    for (const scenario of ["stable", "replacement"]) {
      let history = createHistory(recoveryFixture(scenario, 1000, initial));
      const storage = createRecoveryV2Storage(db, scenario, codec),
        writer = await prepareRecoveryV2Writer(storage, scenario, codec);
      await writer.save(history.present, () => true);
      const stale = await prepareRecoveryV2Writer(
        createRecoveryV2Storage(other, scenario, codec),
        scenario,
        codec,
      );
      for (let i = 1; i <= 110; i++) {
        const before = history.present;
        const assets = scenario === "replacement" && i % 10 === 0 ? [image(i)] : before.assets;
        history = commitProject(
          history,
          replaceStorey(
            { ...before, assets },
            {
              ...storeyOf(before),
              walls: storeyOf(before).walls.map((w, k) =>
                k === 0 ? { ...w, height: 2.8 + i * 0.001 } : w,
              ),
            },
          ),
        );
        if (i % 10 === 0 || i === 1) await writer.save(history.present, () => true);
        if ([1, 10, 50, 100, 110].includes(i)) {
          const snapshots = [...history.past, history.present, ...history.future],
            handles = new Set(snapshots.flatMap((p) => p.assets));
          const payloads = new Set([...handles].map((a) => a.data));
          const memory = (
            performance as Performance & {
              memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
            }
          ).memory;
          check(
            handles.size === (scenario === "stable" ? 1 : Math.min(11, Math.floor(i / 10) + 1)),
            "shared image handle count",
          );
          rows.push({
            scenario,
            step: i,
            past: history.past.length,
            handles: handles.size,
            uniquePayloads: payloads.size,
            logicalBase64Characters: [...payloads].reduce((n, s) => n + s.length, 0),
            storedPayloads: (await all(db, "assets")).length,
            heapSample: memory
              ? { used: memory.usedJSHeapSize, total: memory.totalJSHeapSize }
              : null,
          });
        }
        if (i % 10 === 0) {
          output.textContent = `${scenario}: ${i}/110`;
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      check(history.past.length === 100, "history bound");
      const finalHeight = storeyOf(history.present).walls[0]!.height,
        finalData = history.present.assets[0]!.data;
      for (let i = 0; i < 100; i++) history = undoProject(history);
      check(history.future.length === 100, "undo count");
      for (let i = 0; i < 100; i++) history = redoProject(history);
      check(
        storeyOf(history.present).walls[0]!.height === finalHeight &&
          history.present.assets[0]!.data === finalData,
        "redo image",
      );
      expectedImages.set(scenario, finalData);
      let conflict = false;
      try {
        await stale.save(history.present, () => true);
      } catch (error) {
        conflict = error instanceof Error && error.message === "Recovery revision conflict";
      }
      check(conflict, "stale writer must conflict");
    }
    const heads = (await all(db, "heads")) as {
      current: { model: { assets: { key: string }[] } };
      previous?: { model: { assets: { key: string }[] } };
    }[];
    const roots = new Set(
      heads.flatMap((h) =>
        [h.current, h.previous].flatMap((s) => s?.model.assets.map((a) => a.key) ?? []),
      ),
    );
    const payloads = await all(db, "assets");
    check(
      heads.length === 2 && payloads.length === 12 && roots.size === 3,
      "recovery retention counts",
    );
    report["disk"] = {
      heads: heads.length,
      payloads: payloads.length,
      currentPreviousKeys: roots.size,
      notReferencedByV2Heads: payloads.length - roots.size,
      logicalPayloadJsonBytes: new TextEncoder().encode(JSON.stringify(payloads)).length,
    };
    db.close();
    other.close();
    db = await openRecoveryV2Pilot(name);
    for (const id of ["stable", "replacement"]) {
      const state = await createRecoveryV2Storage(db, id, codec).read();
      const restored = await restoreRecoveryV2(state.record, id, codec);
      check(storeyOf(restored.project).walls[0]!.height === 2.8 + 110 * 0.001, "reopened head");
      check(restored.project.assets[0]!.data === expectedImages.get(id), "reopened image");
    }
    report["status"] = "PASS";
    report["checks"] = [
      "100 history entries",
      "100 Undo/Redo each scenario",
      "stale writers rejected",
      "both project heads restored after reopen",
    ];
  } catch (error) {
    report["status"] = "FAIL";
    report["error"] = String(error);
  } finally {
    db?.close();
    other?.close();
    report["finished"] = new Date().toISOString();
    output.textContent = JSON.stringify(report, null, 2);
    button.disabled = false;
  }
};
