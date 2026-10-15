import { wallPatchFixture } from "./wall-patch-fixture.ts";
import { selectedWallAxis } from "../src/rendering/viewport/wall-axis.ts";
import { selectionEdges } from "../src/rendering/viewport/selection-outline.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
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
    const p = wallPatchFixture(2),
      target = { kind: "wall" as const, id: "wall-1" };
    let comparisons = 0;
    for (const index of [0, 1] as const) {
      const session: EditSession = {
        base: p,
        target,
        action: "point",
        index,
        anchor: { x: index === 0 ? 0 : 6, y: -10 },
      };
      const prepared = prepareDirectEditPreview(session)!,
        base = buildBuildingSolid(p),
        windows = buildingWindowSelectionSurfaces(p, () => true);
      const selected = new Set([target.id]);
      const read = () => {
        const gl = canvas.getContext("webgl")!,
          pixels = new Uint8Array(600 * 400 * 4);
        gl.readPixels(0, 0, 600, 400, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
      };
      for (const yaw of [0, 0.8])
        for (const dx of [-1, 0.5, 1, 2]) {
          const view = createProjectionState(
            createProjectionFrame(base),
            { ...initialCamera, yaw, pitch: 0.4 },
            { left: 0, top: 0, width: 600, height: 400 },
            { width: 600, height: 400 },
          )!;
          const point = { x: session.anchor.x + dx, y: session.anchor.y + (dx === 0.5 ? 0.4 : 0) };
          const patch = prepared.evaluate(p, target, point),
            full = editAtPointer(session, p, point);
          const derived = selectionMoveSurfaces(base, p, patch);
          const complete = buildBuildingSolid(full);
          if (
            JSON.stringify(selectedWallAxis(p, target, () => true, view, patch)) !==
            JSON.stringify(selectedWallAxis(full, target, () => true, view))
          )
            throw Error("Axis mismatch");
          renderer.draw(
            derived,
            view,
            selected,
            selectionEdges(derived.faces.filter((f) => f.wallId === target.id)),
            windowSelectionEdges(
              selectionMoveWindows(windows, p, patch, () => true),
              selected,
            ),
          );
          const pixels = read();
          if (!pixels.some((v) => v)) throw Error("Empty frame");
          renderer.draw(
            complete,
            view,
            selected,
            selectionEdges(complete.faces.filter((f) => f.wallId === target.id)),
            windowSelectionEdges(
              buildingWindowSelectionSurfaces(full, () => true),
              selected,
            ),
          );
          if (read().some((v, i) => v !== pixels[i])) throw Error(`Pixel mismatch ${yaw}/${dx}`);
          comparisons++;
        }
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
