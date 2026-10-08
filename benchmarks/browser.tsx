import { largePointFixture } from "./large-point-fixture";
import { setSessionExtrusion } from "./extrusion-mode";
import { tPairFixture } from "./t-pair-fixture";
import { ManualRecorder } from "./ManualRecorder";
import { recordManualReact } from "./manual-capture";
import { checkMovementGeometry } from "./movement-geometry-check";
import { runMovementProfile } from "./movement-driver";
import { traceReactCommit } from "./movement-trace";
/** Dev-only diagnostic page. Never imported by the product routes. */
import { commitProfileCases } from "./commit-profile";
import React, { Profiler, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import "../src/styles.css";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import {
  createProject,
  validateProject,
  serializeProject,
  deserializeProject,
} from "../src/lib/bim/model";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history";
import { beginSelectionMove, previewSelectionMove } from "../src/application/selection/move";
import { beginWallChain, previewWallChain } from "../src/application/drawing/wall-chain";
import { selectionIndex } from "../src/application/selection/state";
import { defaultLineAppearance } from "../src/lib/bim/lines";
import { connectedWallSolids } from "../src/domain/elements/wall/connections";
import { propertyFormKey } from "../src/components/cad/property-form-key";
import type { Project } from "../src/lib/bim/model";
if (!import.meta.env.DEV) throw new Error("Development diagnostics only");
const samples: Record<string, number[]> = {};
const add = (key: string, value: number) => (samples[key] ??= []).push(value);
let imageData = "";
let movementReport: Awaited<ReturnType<typeof runMovementProfile>> | null = null;
function image() {
  if (imageData) return imageData;
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1400;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(1400, 1400);
  let seed = 42;
  for (let i = 0; i < pixels.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels.data[i + c] = seed >>> 24;
    }
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  imageData = canvas.toDataURL("image/png").split(",")[1]!;
  return imageData;
}
function fixture(count: number, withImage: boolean, dense: boolean): Project {
  const p = createProject("benchmark", "storey");
  const pairs = Math.floor(count / 10);
  for (let i = 0; i < pairs; i++) {
    const x = (i % 25) * 8,
      y = Math.floor(i / 25) * 8;
    const a = `wall-${i * 2 + 1}`,
      b = `wall-${i * 2 + 2}`;
    p.storey.walls.push(
      {
        id: a,
        layerId: p.defaultLayerIds.wall,
        start: { x, y },
        end: { x: x + 4, y },
        height: 2.8,
        thickness: 0.36,
        bodyOffset: 0,
      },
      {
        id: b,
        layerId: p.defaultLayerIds.wall,
        start: { x: x + 4, y },
        end: { x: x + 4, y: y + 4 },
        height: 2.8,
        thickness: 0.36,
        bodyOffset: 0,
      },
    );
    p.storey.wallJoins.push({
      first: { wallId: a, endpoint: 1 },
      second: { wallId: b, endpoint: 0 },
    });
    p.storey.windows.push({
      id: `window-${i}`,
      wallId: a,
      layerId: p.defaultLayerIds.window,
      width: 1.2,
      height: 1.2,
      sillHeight: 0.9,
      position: 0.5,
    });
  }
  p.storey.lines = [];
  for (let i = pairs * 3; i < count - (withImage ? 1 : 0); i++)
    p.storey.lines.push({
      id: `line-${i}`,
      layerId: p.defaultLayerIds.line,
      kind: "line",
      points: [
        { x: i % 100, y: 50 + Math.floor(i / 100) },
        { x: (i % 100) + 0.8, y: 50 + Math.floor(i / 100) },
      ],
      ...defaultLineAppearance,
    });
  if (withImage) {
    p.assets.push({
      id: "image",
      mimeType: "image/png",
      pixelWidth: 1400,
      pixelHeight: 1400,
      data: image(),
    });
    p.storey.references.push({
      id: "reference",
      kind: "image-reference",
      assetId: "image",
      layerId: p.defaultLayerIds.line,
      origin: { x: -15, y: 0 },
      rotation: 0,
      metresPerPixel: 0.01,
    });
  }
  if (dense) {
    // Twenty stationary branches on the first moving host, retaining its corner/window.
    p.storey.lines.splice(-20);
    p.storey.walls[0]!.end.x = 14.3;
    p.storey.walls[1]!.start.x = 14.3;
    p.storey.walls[1]!.end.x = 14.3;
    for (let i = 0; i < 20; i++) {
      const id = `branch-${i}`,
        x = 0.5 + i * 0.6;
      p.storey.walls.push({
        id,
        layerId: p.defaultLayerIds.wall,
        start: { x, y: -2 },
        end: { x, y: 0 },
        thickness: 0.36,
        height: 2.8,
        bodyOffset: 0,
      });
      p.storey.wallTJunctions.push({ hostWallId: "wall-1", incoming: { wallId: id, endpoint: 1 } });
    }
  }
  return validateProject(p);
}
const frame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
async function measure(name: string, fn: () => unknown) {
  fn();
  for (let i = 0; i < 21; i++) {
    await frame();
    const t = performance.now();
    fn();
    add(name, performance.now() - t);
  }
}
function stats() {
  return Object.fromEntries(
    Object.entries(samples).map(([k, v]) => {
      const a = [...v].sort((x, y) => x - y);
      return [
        k,
        {
          n: a.length,
          medianMs: a[Math.floor(a.length / 2)],
          p95Ms: a[Math.ceil(a.length * 0.95) - 1],
        },
      ];
    }),
  );
}
export function Harness() {
  const [count, setCount] = useState(100),
    [selectedWalls, setSelectedWalls] = useState(20),
    [reuseExtrusion, setReuseExtrusion] = useState(true),
    [images, setImages] = useState(false),
    [dense, setDense] = useState(false),
    [heldShift, setHeldShift] = useState(false),
    [repeatShift, setRepeatShift] = useState(false),
    [tPair, setTPair] = useState(false),
    [manualRecording, setManualRecording] = useState(false),
    [running, setRunning] = useState(false),
    [project, setProject] = useState<Project>(),
    [status, setStatus] = useState("Ready"),
    [report, setReport] = useState("");
  async function task(action: () => Promise<void>) {
    if (running || manualRecording) return;
    setRunning(true);
    try {
      await action();
    } finally {
      setRunning(false);
    }
  }
  async function load(largePoints = false) {
    setStatus("Loading");
    movementReport = null;
    setReport("");
    await frame();
    for (const k of Object.keys(samples)) delete samples[k];
    const t = performance.now();
    const p = largePoints
      ? largePointFixture()
      : tPair
        ? tPairFixture()
        : fixture(count, images, dense);
    add("fixtureValidate", performance.now() - t);
    flushSync(() => setProject(p));
    await frame();
    add("loadAndMount", performance.now() - t);
    setStatus("Loaded");
  }
  async function run() {
    if (!project) return;
    setStatus("Measuring");
    try {
      const p = project,
        targets = [...selectionIndex(p).values()].slice(0, 20).filter((x) => x.kind !== "window"),
        s = beginSelectionMove(p, targets, { x: 0, y: 0 }),
        h = createHistory(p),
        next = previewSelectionMove(s, p, targets, { x: 1, y: 1 }),
        committed = commitProject(h, next),
        text = serializeProject(p),
        chain = beginWallChain(p, { x: -30, y: -30 });
      const cases: [string, () => unknown][] = [
        [
          "formKeysLegacy",
          () => [
            JSON.stringify([{ kind: "wall", id: "wall-1" }, p]),
            JSON.stringify([{ kind: "wall", id: "wall-1" }, p]),
          ],
        ],
        ["groupPreview", () => previewSelectionMove(s, p, targets, { x: 1, y: 1 })],
        ["wallPreview", () => previewWallChain(chain, p, { x: -25, y: -30 })],
        ["wallSolids", () => connectedWallSolids(p)],
        ["commit", () => commitProject(h, next)],
        ["undoRedo", () => redoProject(undoProject(committed))],
        ["jsonSave", () => serializeProject(p)],
        ["jsonLoad", () => deserializeProject(text)],
      ];
      for (const [name, fn] of cases) {
        setStatus(name);
        await measure(name, fn);
      }
      setStatus("Complete");
      show();
    } catch (e) {
      setStatus(String(e));
    }
  }
  async function profileCommit() {
    if (!project) return;
    setStatus("Preparing commit profile");
    await frame();
    try {
      const targets = [...selectionIndex(project).values()].slice(0, 20);
      const session = beginSelectionMove(project, targets, { x: 0, y: 0 });
      const next = previewSelectionMove(session, project, targets, { x: 1, y: 1 });
      const cases = commitProfileCases(createHistory(project), next);
      for (const [name] of cases) delete samples[name];
      for (const [, fn] of cases) fn();
      // Interleave cases and reverse every other round to reduce ordering bias.
      for (let i = 0; i < 21; i++) {
        for (const [name, fn] of i % 2 ? [...cases].reverse() : cases) {
          setStatus(`${name} ${i + 1}/21`);
          await frame();
          const t = performance.now();
          fn();
          add(name, performance.now() - t);
        }
      }
      setStatus("Commit profile complete");
      show();
    } catch (e) {
      setStatus(String(e));
    }
  }
  async function movement() {
    setSessionExtrusion(reuseExtrusion);
    setStatus("Measuring active movement");
    await frame();
    try {
      if (!project) return;
      if (
        !tPair &&
        selectedWalls > project.storey.walls.filter((w) => w.id.startsWith("wall-")).length
      )
        throw new Error("Load a larger fixture for this wall selection");
      movementReport = await runMovementProfile(
        (delta) => checkMovementGeometry(project, delta, tPair ? 2 : selectedWalls),
        heldShift,
        tPair ? 2 : selectedWalls,
        { x: 0, y: tPair ? 0.18 : 0 },
        tPair,
        repeatShift,
      );
      setStatus("Movement complete");
      show();
    } catch (e) {
      setStatus(String(e));
    }
  }
  async function keys() {
    if (!project) return;
    setStatus("Measuring keys");
    await measure("formKeysRevision", () => [
      propertyFormKey(project, { kind: "wall", id: "wall-1" }),
      propertyFormKey(project, { kind: "wall", id: "wall-1" }),
    ]);
    setStatus("Complete");
    show();
  }
  function show() {
    const m = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
    setReport(
      JSON.stringify(
        {
          count: tPair ? 4 : count,
          images,
          dense,
          tPair,
          selectedWalls: tPair ? 2 : selectedWalls,
          extrusionMode: reuseExtrusion ? "session" : "fresh",
          bytes: project ? new TextEncoder().encode(JSON.stringify(project)).length : 0,
          userAgent: navigator.userAgent,
          heap: m
            ? { used: m.usedJSHeapSize, total: m.totalJSHeapSize, limit: m.jsHeapSizeLimit }
            : null,
          results: stats(),
          movement: movementReport,
        },
        null,
        2,
      ),
    );
  }
  return (
    <>
      <aside
        style={{
          position: "fixed",
          zIndex: 9999,
          top: 0,
          right: 0,
          width: 430,
          background: "white",
          border: "1px solid",
          padding: 4,
          fontSize: 11,
        }}
      >
        <fieldset disabled={running || manualRecording} style={{ border: 0, padding: 0 }}>
          <label>
            Elements
            <select
              aria-label="Benchmark count"
              value={count}
              onChange={(e) => setCount(+e.target.value)}
            >
              {[100, 1000, 5000].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            <input
              aria-label="With image"
              type="checkbox"
              checked={images}
              onChange={(e) => setImages(e.target.checked)}
            />
            Image
          </label>
          <label>
            <input
              aria-label="Dense connections"
              type="checkbox"
              checked={dense}
              onChange={(e) => setDense(e.target.checked)}
            />
            Dense T connections
          </label>
          <label>
            <input
              aria-label="Hold Shift"
              type="checkbox"
              checked={heldShift}
              onChange={(e) => setHeldShift(e.target.checked)}
            />
            Hold Shift
          </label>
          <label>
            <input
              aria-label="T pair"
              type="checkbox"
              checked={tPair}
              onChange={(e) => setTPair(e.target.checked)}
            />
            T pair
          </label>
          <label>
            <input
              aria-label="Repeat Shift"
              type="checkbox"
              checked={repeatShift}
              onChange={(e) => setRepeatShift(e.target.checked)}
            />
            Repeat Shift
          </label>
          <label>
            Selected walls{" "}
            <select
              aria-label="Selected walls"
              value={selectedWalls}
              onChange={(e) => setSelectedWalls(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </label>
          <label>
            Extrusion{" "}
            <select
              aria-label="Extrusion mode"
              value={reuseExtrusion ? "session" : "fresh"}
              onChange={(e) => setReuseExtrusion(e.target.value === "session")}
            >
              <option value="fresh">Fresh baseline</option>
              <option value="session">Session reuse</option>
            </select>
          </label>
          <button onClick={() => task(load)}>Load scenario</button>
          <button onClick={() => task(() => load(true))}>Load 200k points</button>{" "}
          <button onClick={() => task(run)}>Measure core</button>{" "}
          <button onClick={() => task(profileCommit)}>Profile commit</button>{" "}
          <button onClick={() => task(movement)}>Profile movement</button>{" "}
          <button onClick={() => task(keys)}>Measure keys</button>{" "}
          <button onClick={show}>Report</button>
        </fieldset>
        <p role="status">{status}</p>
        <textarea
          aria-label="Benchmark report"
          value={report}
          readOnly
          style={{ width: "100%", height: 70 }}
        />
        <ManualRecorder ready={!!project && !running} onRecordingChange={setManualRecording} />
      </aside>
      {project && (
        <Profiler
          id="workspace"
          onRender={(_id, phase, duration, _base, start, commit) => {
            add(`react-${phase}`, duration);
            traceReactCommit(duration);
            recordManualReact(phase, duration, commit, start);
          }}
        >
          <CadWorkspace key={propertyFormKey(project, null)} initialProject={project} />
        </Profiler>
      )}
    </>
  );
}
// Event -> two animation frames: paint opportunity, not hardware presentation latency.
for (const type of ["click", "pointermove"]) {
  let pending = false;
  window.addEventListener(
    type,
    (e) => {
      const target = e.target as Element;
      if (!target.closest("main") || pending) return;
      pending = true;
      const t = performance.now();
      frame().then(() => {
        add(`event-${type}-twoRAF`, performance.now() - t);
        pending = false;
      });
    },
    true,
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
