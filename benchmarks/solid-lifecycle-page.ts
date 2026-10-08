import { diagnosticRenderer } from "./legacy-solid-renderer";
import { createMatrixRenderer } from "./solid-matrix-renderer";
import { connectedFixture } from "./connected-fixture";
import { buildSolid } from "../src/lib/bim/geometry";
import { createProjectionFrame } from "../src/geometry/projections/orthographic";
import { createProjectionState } from "../src/rendering/viewport/projection-state";
import { selectionEdges } from "../src/rendering/viewport/selection-outline";
import type { OutlineEdge } from "../src/rendering/viewport/selection-outline";
import {
  windowSelectionSurfaces,
  windowSelectionEdges,
} from "../src/rendering/viewport/window-selection";
import type { DisplaySurfaces } from "../src/rendering/viewport/layer-display";
import type { ProjectionState } from "../src/rendering/viewport/projection-state";
const baseline = diagnosticRenderer as (c: HTMLCanvasElement) => {
  draw(
    s: DisplaySurfaces,
    p: ProjectionState,
    selected: Set<string>,
    a: OutlineEdge[],
    b: OutlineEdge[],
  ): void;
  dispose(): void;
};
const run = document.querySelector<HTMLButtonElement>("#run")!,
  report = document.querySelector<HTMLPreElement>("#report")!,
  views = document.querySelector<HTMLDivElement>("#views")!;
const eventOnce = (c: HTMLCanvasElement, name: string) =>
  new Promise<void>((resolve, reject) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      c.removeEventListener(name, done);
      reject(Error(name + " timeout"));
    }, 5000);
    c.addEventListener(name, done, { once: true });
  });
run.onclick = async () => {
  run.disabled = true;
  views.replaceChildren();
  const a = document.createElement("canvas"),
    b = document.createElement("canvas");
  views.append(a, b);
  const original = connectedFixture("chain", 3),
    changed = connectedFixture("chain", 4),
    s0 = buildSolid(original),
    s1 = buildSolid(changed),
    frame = createProjectionFrame(s1);
  const before = JSON.stringify([s0, s1]);
  const old = baseline(a),
    pilot = createMatrixRenderer(b, s0, frame.center);
  const checks: { name: string; pixels: number; builds: number }[] = [];
  const verify = (
    name: string,
    solid: DisplaySurfaces,
    selected = new Set<string>(),
    zoom = 1,
    dpr = 1,
  ) => {
    const p = createProjectionState(
      frame,
      { yaw: 0.6, pitch: 0.6, zoom, panX: 0, panY: 0 },
      { left: 0, top: 0, width: 400, height: 300 },
      { width: 400 * dpr, height: 300 * dpr },
    )!;
    const outline = [...selected].flatMap((id) =>
        selectionEdges(solid.faces.filter((f) => f.wallId === id)),
      ),
      windows = windowSelectionEdges(
        windowSelectionSurfaces(
          changed,
          (id) => solid.faces.some((f) => f.wallId === id) || id.startsWith("window"),
        ),
        new Set(["window-wall-0"]),
      );
    pilot.update(solid, frame.center, selected);
    old.draw(solid, p, selected, outline, windows);
    pilot.draw(p, outline, windows);
    const read = (c: HTMLCanvasElement) => {
      const gl = c.getContext("webgl")!,
        data = new Uint8Array(c.width * c.height * 4);
      gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      if (gl.getError() !== gl.NO_ERROR) throw Error("WebGL error");
      return data;
    };
    const x = read(a),
      y = read(b);
    let mismatch = 0;
    for (let i = 0; i < x.length; i += 4)
      if ([0, 1, 2, 3].some((k) => Math.abs(x[i + k]! - y[i + k]!) > 8)) mismatch++;
    if (mismatch > Math.max(16, (x.length / 4) * 0.001))
      throw Error(name + ": " + mismatch + " pixels differ");
    checks.push({ name, pixels: mismatch, builds: pilot.builds });
  };
  try {
    verify("initial", s0);
    const builds = pilot.builds;
    verify("camera only", s0, new Set(), 1.2);
    if (pilot.builds !== builds) throw Error("Camera rebuilt geometry");
    verify("wall and window selection", s0, new Set(["wall-0"]));
    verify("selected zoom DPR2", s0, new Set(["wall-0"]), 0.8, 2);
    verify("model snapshot replacement", s1, new Set(["wall-2"]));
    const hidden = { ...s1, faces: s1.faces.filter((f) => f.wallId !== "wall-0") };
    verify("hidden host", hidden, new Set(["wall-2"]));
    verify("all hidden", { ...s1, faces: [] });
    verify("visible again deselected", s1);
    const gl = b.getContext("webgl")!,
      extension = gl.getExtension("WEBGL_lose_context");
    if (!extension) throw Error("Context-loss extension unavailable: test incomplete");
    let waiting = eventOnce(b, "webglcontextlost");
    extension.loseContext();
    await waiting;
    if (pilot.available) throw Error("Lost context still available");
    pilot.update(s0, frame.center, new Set(["wall-1"]));
    waiting = eventOnce(b, "webglcontextrestored");
    // Restore only after the loss event has finished dispatching.
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    extension.restoreContext();
    await waiting;
    if (!pilot.available) throw Error("Context not restored");
    const restoredBuilds = pilot.builds;
    verify("restored latest snapshot", s0, new Set(["wall-1"]));
    if (pilot.builds !== restoredBuilds) throw Error("Restoration did not retain latest state");
    if (JSON.stringify([s0, s1]) !== before) throw Error("Source changed");
    pilot.dispose();
    pilot.dispose();
    if (pilot.available) throw Error("Disposed renderer available");
    let rejected = false;
    try {
      pilot.update(s1, frame.center);
    } catch {
      rejected = true;
    }
    if (!rejected) throw Error("Disposed update accepted");
    report.textContent = JSON.stringify(
      { status: "PASS", checks, contextRestored: true, dispose: true },
      null,
      2,
    );
  } catch (e) {
    report.textContent = String(e);
  } finally {
    old.dispose();
    pilot.dispose();
    run.disabled = false;
  }
};
