import { createSolidRenderer } from "../src/rendering/viewport/solid-renderer.ts";
import { createExampleProject } from "../src/components/cad/bim-view.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
import { selectionEdges } from "../src/rendering/viewport/selection-outline.ts";
import { windowSelectionSurfaces } from "../src/rendering/viewport/window-selection.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import type { DisplaySurfaces } from "../src/rendering/viewport/layer-display.ts";
const result = document.querySelector("#result")!;
const a = document.querySelector<HTMLCanvasElement>("#reuse")!,
  b = document.querySelector<HTMLCanvasElement>("#fresh")!;
function pixels(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl")!,
    data = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return data;
}
document.querySelector<HTMLButtonElement>("#run")!.addEventListener("click", async () => {
  let renderer: ReturnType<typeof createSolidRenderer> | null = null;
  try {
    let p = createExampleProject();
    p = addWall(p, {
      id: "neighbour",
      start: { x: 3, y: 0 },
      end: { x: 3, y: 3 },
      thickness: 0.36,
      height: 2.8,
    });
    const solid = buildBuildingSolid(p),
      frame = createProjectionFrame(solid);
    const action = prepareSelectionTranslation(p, ["wall-1"]);
    const cases: { name: string; solid: DisplaySurfaces; selected: Set<string> }[] = [
      { name: "base", solid, selected: new Set() },
      { name: "selection", solid, selected: new Set(["wall-1"]) },
      ...[0.1, 0.2, 0.3].map((x) => ({
        name: `preview ${x}`,
        solid: selectionMoveSurfaces(solid, p, action.evaluate({ x, y: 0.5 })),
        selected: new Set(["wall-1"]),
      })),
      { name: "cancel", solid, selected: new Set() },
      {
        name: "hidden neighbour",
        solid: { ...solid, faces: solid.faces.filter((f) => f.wallId === "wall-1") },
        selected: new Set(["wall-1"]),
      },
      { name: "restore", solid, selected: new Set(["wall-1"]) },
      {
        name: "distant origin",
        solid: {
          ...solid,
          faces: solid.faces.map((f) => ({
            ...f,
            vertices: f.vertices.map(
              ([x, y, z]) => [x + 1e9, y + 1e9, z] as [number, number, number],
            ),
          })),
        },
        selected: new Set(["wall-1"]),
      },
    ];
    renderer = createSolidRenderer(a);
    const checks = [];
    for (const dpr of [1, 2])
      for (const pitch of [0.6, -0.6])
        for (const c of cases) {
          const projection = createProjectionState(
            c.name === "distant origin"
              ? {
                  ...frame,
                  center: [frame.center[0] + 1e9, frame.center[1] + 1e9, frame.center[2]],
                }
              : frame,
            { yaw: 0.7, pitch, zoom: 1, panX: 0, panY: 0 },
            { left: 0, top: 0, width: 480, height: 320 },
            { width: 480 * dpr, height: 320 * dpr },
          )!;
          const outline = selectionEdges(c.solid.faces.filter((f) => c.selected.has(f.wallId)));
          const windows =
            c.name === "selection"
              ? windowSelectionSurfaces(p, () => true).flatMap((w) => w.outline)
              : [];
          renderer.draw(c.solid, projection, c.selected, outline, windows);
          const actual = pixels(a),
            fresh = createSolidRenderer(b);
          fresh.draw(c.solid, projection, c.selected, outline, windows);
          const expected = pixels(b);
          fresh.dispose();
          if (!actual.some((v) => v !== 0)) throw Error("Empty rendered frame");
          let different = 0;
          for (let i = 0; i < actual.length; i++) if (actual[i] !== expected[i]) different++;
          if (different) throw Error(`${c.name}: ${different} pixel channels differ`);
          checks.push(`${c.name} DPR${dpr} pitch${pitch}: equal`);
        }
    const gl = a.getContext("webgl")!,
      extension = gl.getExtension("WEBGL_lose_context");
    if (!extension) throw Error("Context-loss extension unavailable");
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error("Context restore timeout")), 5000);
      a.addEventListener(
        "webglcontextlost",
        (event) => {
          event.preventDefault();
          renderer!.dispose();
          renderer = null;
          setTimeout(() => extension.restoreContext(), 100);
        },
        { once: true },
      );
      a.addEventListener(
        "webglcontextrestored",
        () => {
          clearTimeout(timeout);
          renderer = createSolidRenderer(a);
          resolve();
        },
        { once: true },
      );
      extension.loseContext();
    });
    const projection = createProjectionState(
      frame,
      { yaw: 0.7, pitch: 0.6, zoom: 1, panX: 0, panY: 0 },
      { left: 0, top: 0, width: 480, height: 320 },
      { width: 480, height: 320 },
    )!;
    renderer!.draw(solid, projection, new Set(["wall-1"]), [], []);
    if (!pixels(a).some((v) => v !== 0)) throw Error("Restore empty");
    result.textContent = JSON.stringify(
      { status: "PASS", userAgent: navigator.userAgent, checks, contextRestored: true },
      null,
      2,
    );
  } catch (error) {
    result.textContent = `FAIL: ${error}`;
  } finally {
    renderer?.dispose();
  }
});
