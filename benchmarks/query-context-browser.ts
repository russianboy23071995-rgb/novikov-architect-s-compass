import { linearMovementOriginQuery } from "./movement-origin-oracle.ts";
import { buildingViewFixture } from "./building-view-fixture.ts";
import { prepareViewportModel } from "../src/rendering/viewport/prepared-model.ts";
import {
  createMovementOriginQuery,
  movementCorners,
} from "../src/rendering/viewport/movement-origin.ts";
import { buildBuildingSolid, initialCamera } from "../src/lib/bim/geometry.ts";
import { createSolidRenderer } from "../src/rendering/viewport/solid-renderer.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const output = document.querySelector("#result")!;
document.querySelector("#run")!.addEventListener("click", () => {
  const renderer = createSolidRenderer(canvas);
  try {
    const project = buildingViewFixture(100),
      basis = prepareViewportModel(project);
    const solid = buildBuildingSolid(basis.model),
      frame = createProjectionFrame(solid);
    const corners = movementCorners(project, basis).slice(0, 8);
    let pixelComparisons = 0,
      queryComparisons = 0;
    const read = () => {
      const gl = canvas.getContext("webgl")!,
        pixels = new Uint8Array(600 * 400 * 4);
      gl.readPixels(0, 0, 600, 400, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    };
    for (const yaw of [0, 0.7, Math.PI])
      for (const pitch of [0.6, -0.4]) {
        const view = createProjectionState(
          frame,
          { ...initialCamera, yaw, pitch },
          { left: 0, top: 0, width: 600, height: 400 },
          { width: 600, height: 400 },
        )!;
        renderer.draw(solid, view, new Set(), [], []);
        const pixels = read();
        if (!pixels.some((v) => v)) throw Error("Empty frame");
        renderer.draw(buildBuildingSolid(project), view, new Set(), [], []);
        if (read().some((v, i) => v !== pixels[i])) throw Error("Pixel mismatch");
        pixelComparisons++;
        const prepared = createMovementOriginQuery(project, view, () => true, basis);
        const fresh = linearMovementOriginQuery(project, view, () => true);
        for (const corner of corners) {
          const p = view.project(corner.point),
            cursor = { x: (p[0] + 1) * 300, y: (1 - p[1]) * 200 };
          if (JSON.stringify(prepared(cursor)) !== JSON.stringify(fresh(cursor)))
            throw Error("Query mismatch");
          queryComparisons++;
        }
      }
    output.textContent = JSON.stringify(
      {
        status: "PASS",
        oracle: "frozen linear query before spatial index",
        userAgent: navigator.userAgent,
        walls: 500,
        windows: 500,
        pixelComparisons,
        queryComparisons,
      },
      null,
      2,
    );
  } catch (error) {
    output.textContent = `FAIL: ${error}`;
  } finally {
    renderer.dispose();
  }
});
