import { largePointFixture } from "./large-point-fixture";
import { prepareTranslation } from "../src/domain/project/prepared-translation";
import { tPairFixture } from "./t-pair-fixture";
import { createProject, validateProject, serializeProject, updateLine } from "../src/lib/bim/model";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../src/lib/bim/history";
import { defaultLineAppearance } from "../src/lib/bim/lines";
import { importImage } from "../src/interop/images/import";
import { previewCreateReference } from "../src/application/references/actions";
import { exportIfc } from "../src/lib/bim/ifc";
import { planBounds } from "../src/components/cad/bim-view";
import { connectedWallSolids } from "../src/domain/elements/wall/connections";
export const tick = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
const bytes = (s: string) => new TextEncoder().encode(s).length;
export function heap() {
  return (
    (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ??
    null
  );
}
export function capacityFixture(count: number) {
  const p = createProject("capacity", "storey"),
    pair = tPairFixture();
  // Disjoint T groups with windows, not a claim about one huge dependency closure.
  for (let i = 0; i < Math.min(25, Math.floor(count / 10)); i++) {
    const id = (s: string) => `${s}-${i}`;
    p.storey.walls.push(
      ...pair.storey.walls.map((w) => ({
        ...w,
        id: id(w.id),
        start: { x: w.start.x + i * 10, y: w.start.y },
        end: { x: w.end.x + i * 10, y: w.end.y },
      })),
    );
    p.storey.windows.push(
      ...pair.storey.windows.map((w) => ({ ...w, id: id(w.id), wallId: id(w.wallId) })),
    );
    p.storey.wallTJunctions.push(
      ...pair.storey.wallTJunctions.map((t) => ({
        ...t,
        hostWallId: id(t.hostWallId),
        incoming: { ...t.incoming, wallId: id(t.incoming.wallId) },
      })),
    );
  }
  p.storey.lines = Array.from(
    { length: count - p.storey.walls.length - p.storey.windows.length },
    (_, i) => ({
      id: `line-${i}`,
      layerId: p.defaultLayerIds.line,
      kind: "line" as const,
      points: [
        { x: i % 100, y: 10 + Math.floor(i / 100) },
        { x: (i % 100) + 0.5, y: 10.5 + Math.floor(i / 100) },
      ],
      ...defaultLineAppearance,
    }),
  );
  return validateProject(p);
}
function chainFixture() {
  const p = createProject("chain", "storey");
  let start = { x: 0, y: 0 };
  for (let i = 0; i < 100; i++) {
    const end = { x: start.x + (i % 2 ? 0 : 4), y: start.y + (i % 2 ? 4 : 0) };
    p.storey.walls.push({
      id: `wall-${i}`,
      layerId: p.defaultLayerIds.wall,
      start,
      end,
      thickness: 0.36,
      height: 2.8,
      bodyOffset: 0,
    });
    if (i)
      p.storey.wallJoins.push({
        first: { wallId: `wall-${i - 1}`, endpoint: 1 },
        second: { wallId: `wall-${i}`, endpoint: 0 },
      });
    start = end;
  }
  return validateProject(p);
}
async function sourceFile(index: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!,
    pixels = ctx.createImageData(512, 512);
  let seed = 42 + index;
  for (let i = 0; i < pixels.data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels.data[i + j] = seed >>> 24;
    }
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const type = index % 2 ? "image/jpeg" : "image/png";
  const blob = await new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), type, 0.85),
  );
  return new File([blob], `reference-${index}`, { type });
}
export async function runCapacity(status: (s: string) => void) {
  const report: Record<string, unknown> = {
    userAgent: navigator.userAgent,
    heapStart: heap(),
    memoryScope: "JS heap samples only; not peak/process/decoded/GPU memory",
    fixture: "synthetic 512x512 RGB noise, alternating PNG/JPEG; not real architectural scans",
  };
  const time = <T>(fn: () => T) => {
    const start = performance.now();
    const value = fn();
    return { value, ms: performance.now() - start };
  };
  const profiles = [];
  for (const count of [100, 1000, 5000, 200000, -1]) {
    status(`Geometry ${count}`);
    await tick();
    const p =
      count === 200000
        ? largePointFixture()
        : count === -1
          ? chainFixture()
          : capacityFixture(count);
    const save = time(() => serializeProject(p)),
      load = time(() => readProjectFile(save.value));
    const plan = time(() => planBounds(p)),
      solid = time(() => connectedWallSolids({ ...p }));
    const start = performance.now();
    const ifc = await exportIfc(p);
    const ifcMs = performance.now() - start;
    const prepared = p.storey.walls.length
      ? time(() => prepareTranslation(p, [p.storey.walls[0]!.id]))
      : null;
    const preview = prepared ? time(() => prepared.value.evaluate({ x: 0.1, y: -1 })) : null;
    profiles.push({
      prepareMs: prepared?.ms,
      previewMs: preview?.ms,
      affectedWalls: preview?.value.geometry.storey.walls.length,
      fixture:
        count === 200000 ? "200k-points" : count === -1 ? "100-connected-walls" : String(count),
      elementCount: p.storey.walls.length + p.storey.windows.length + (p.storey.lines?.length ?? 0),
      wallCount: p.storey.walls.length,
      tConnections: p.storey.wallTJunctions.length,
      pointCount: (p.storey.lines ?? []).reduce((n, l) => n + l.points.length, 0),
      fileBytes: bytes(save.value),
      saveMs: save.ms,
      loadMs: load.ms,
      planBoundsMs: plan.ms,
      solidDerivationMs: solid.ms,
      ifcMs,
      ifcBytes: bytes(ifc),
      heap: heap(),
    });
  }
  report["profiles"] = profiles;
  let p = capacityFixture(1000),
    h = createHistory(p);
  const imports = [];
  for (let i = 0; i < 3; i++) {
    status(`Import ${i + 1}/3`);
    await tick();
    const file = await sourceFile(i);
    const start = performance.now();
    const asset = await importImage(file, `asset-${i}`);
    const importMs = performance.now() - start;
    const request = {
      projectId: p.id,
      asset,
      reference: {
        id: `ref-${i}`,
        kind: "image-reference" as const,
        layerId: p.defaultLayerIds.line,
        assetId: asset.id,
        origin: { x: i * 60, y: -20 },
        rotation: 0,
        metresPerPixel: 0.1,
      },
    };
    const preview = time(() => previewCreateReference(p, p, request));
    const commit = time(() => commitProject(h, preview.value));
    h = commit.value;
    p = h.present;
    imports.push({
      sourceType: file.type,
      sourceBytes: file.size,
      storedType: asset.mimeType,
      base64Bytes: asset.data.length,
      pixels: asset.pixelWidth * asset.pixelHeight,
      rgbaBufferEstimate: asset.pixelWidth * asset.pixelHeight * 4,
      importMs,
      placementPreviewMs: preview.ms,
      commitMs: commit.ms,
      projectBytes: bytes(JSON.stringify(p)),
      heap: heap(),
    });
  }
  report["imports"] = imports;
  h = createHistory(p);
  const checkpoints = [],
    actionTimes = [],
    commitTimes = [];
  for (let i = 1; i <= 100; i++) {
    if (i === 1 || i % 10 === 0) {
      status(`History ${i}/100`);
      await tick();
    }
    const action = time(() =>
      updateLine(h.present, "line-0", { color: i % 2 ? "#112233" : "#334155" }),
    );
    actionTimes.push(action.ms);
    const commit = time(() => commitProject(h, action.value));
    h = commit.value;
    commitTimes.push(commit.ms);
    if ([1, 10, 50, 100].includes(i)) {
      const save = time(() => serializeProject(h.present));
      const load = time(() => readProjectFile(save.value));
      const undo = time(() => undoProject(h));
      const redo = time(() => redoProject(undo.value));
      if (JSON.stringify(redo.value.present) !== JSON.stringify(h.present))
        throw new Error("Undo/redo mismatch");
      checkpoints.push({
        depth: h.past.length,
        fileBytes: bytes(save.value),
        saveMs: save.ms,
        loadMs: load.ms,
        undoMs: undo.ms,
        redoMs: redo.ms,
        heap: heap(),
        assetObjectsShared: h.past[0]!.assets[0] === h.present.assets[0],
        sameAssetText: h.past[0]!.assets[0]!.data === h.present.assets[0]!.data,
      });
    }
  }
  report["history"] = { checkpoints, actionMs: actionTimes, commitMs: commitTimes };
  const start = performance.now();
  const ifc = await exportIfc(h.present);
  report["withImagesIfc"] = { ms: performance.now() - start, bytes: bytes(ifc) };
  // Size-limit probe uses the already decoded asset, no invented base64 data.
  let probe = h.present;
  const limit = [];
  for (let i = 3; i < 12; i++) {
    status(`Size limit ${i + 1} references`);
    await tick();
    const asset = { ...p.assets[0]!, id: `asset-${i}` };
    const request = {
      projectId: probe.id,
      asset,
      reference: { ...p.storey.references[0]!, id: `ref-${i}`, assetId: asset.id },
    };
    try {
      probe = previewCreateReference(probe, probe, request);
      limit.push({
        references: probe.storey.references.length,
        bytes: bytes(JSON.stringify(probe)),
        accepted: true,
      });
    } catch (e) {
      limit.push({ references: i + 1, accepted: false, error: String(e) });
      break;
    }
  }
  report["limitProbe"] = limit;
  report["heapEnd"] = heap();
  return { project: h.present, report };
}
