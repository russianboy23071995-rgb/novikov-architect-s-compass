import { buildingViewFixture } from "./building-view-fixture.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { createSolidRenderer } from "../src/rendering/viewport/solid-renderer.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
const output = document.querySelector("#result")!;
const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
document.querySelector("#run")!.addEventListener("click", () => {
  const renderer = createSolidRenderer(canvas);
  try {
    let p = buildingViewFixture(100);
    const scene = buildBuildingSolid(p);
    const projection = createProjectionState(
      createProjectionFrame(scene),
      { yaw: 0.7, pitch: 0.6, zoom: 1, panX: 0, panY: 0 },
      { left: 0, top: 0, width: 600, height: 400 },
      { width: 600, height: 400 },
    )!;
    const read = () => {
      const gl = canvas.getContext("webgl")!,
        pixels = new Uint8Array(600 * 400 * 4);
      gl.readPixels(0, 0, 600, 400, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    };
    renderer.draw(scene, projection, new Set(), [], []);
    const initial = read();
    if (!initial.some((v) => v)) throw Error("Empty frame");
    const runs = [];
    for (let i = 0; i < 7; i++) {
      const previous = p,
        start = performance.now();
      p = selectWorkingStorey(p, p, `s${(i % 4) + 1}`);
      const switched = performance.now(),
        solid = buildBuildingSolid(p),
        derived = performance.now();
      if (solid !== scene || previous === p) throw Error("Scene/context contract violated");
      renderer.draw(solid, projection, new Set(), [], []);
      const pixels = read();
      if (pixels.some((v, k) => v !== initial[k])) throw Error("View switch changed 3D pixels");
      runs.push({
        switchMs: switched - start,
        deriveMs: derived - switched,
        identicalPixels: true,
      });
    }
    output.textContent = JSON.stringify(
      {
        status: "PASS",
        userAgent: navigator.userAgent,
        storeys: 5,
        walls: 500,
        windows: 500,
        runs,
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
