import { buildingViewFixture } from "./building-view-fixture.ts";
import { prepareOpeningAxisPreview } from "../src/application/direct-edit/prepared-opening.ts";
import { editAnchor, editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { buildBuildingSolid, initialCamera } from "../src/lib/bim/geometry.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../src/rendering/viewport/selection-move-preview.ts";
import {
  buildingWindowSelectionSurfaces,
  windowSelectionEdges,
} from "../src/rendering/viewport/window-selection.ts";
import { createSolidRenderer } from "../src/rendering/viewport/solid-renderer.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
const canvas = document.querySelector<HTMLCanvasElement>("#scene")!,
  output = document.querySelector("#result")!;
document.querySelector("#run")!.addEventListener("click", () => {
  const renderer = createSolidRenderer(canvas);
  try {
    const p = buildingViewFixture(2),
      target = { kind: "window" as const, id: p.storeys[0]!.windows[0]!.id };
    const session: EditSession = {
      base: p,
      target,
      action: "axis",
      index: null,
      anchor: editAnchor(p, target),
    };
    const prepared = prepareOpeningAxisPreview(session),
      base = buildBuildingSolid(p),
      windows = buildingWindowSelectionSurfaces(p, () => true);
    const selected = new Set([target.id]);
    let comparisons = 0;
    const read = () => {
      const gl = canvas.getContext("webgl")!,
        pixels = new Uint8Array(600 * 400 * 4);
      gl.readPixels(0, 0, 600, 400, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    };
    for (const yaw of [0, 0.8])
      for (const dx of [-100, -0.5, 0.5, 100]) {
        const view = createProjectionState(
          createProjectionFrame(base),
          { ...initialCamera, yaw, pitch: 0.4 },
          { left: 0, top: 0, width: 600, height: 400 },
          { width: 600, height: 400 },
        )!;
        const point = { x: session.anchor.x + dx, y: session.anchor.y };
        const patch = prepared.evaluate(p, target, point),
          full = editAtPointer(session, p, point);
        renderer.draw(
          selectionMoveSurfaces(base, p, patch),
          view,
          new Set(),
          [],
          windowSelectionEdges(
            selectionMoveWindows(windows, p, patch, () => true),
            selected,
          ),
        );
        const pixels = read();
        if (!pixels.some((v) => v)) throw Error("Empty frame");
        renderer.draw(
          buildBuildingSolid(full),
          view,
          new Set(),
          [],
          windowSelectionEdges(
            buildingWindowSelectionSurfaces(full, () => true),
            selected,
          ),
        );
        if (read().some((v, i) => v !== pixels[i])) throw Error(`Pixel mismatch ${yaw}/${dx}`);
        comparisons++;
      }
    output.textContent = JSON.stringify(
      { status: "PASS", userAgent: navigator.userAgent, pixelComparisons: comparisons },
      null,
      2,
    );
  } catch (error) {
    output.textContent = `FAIL: ${error}`;
  } finally {
    renderer.dispose();
  }
});
