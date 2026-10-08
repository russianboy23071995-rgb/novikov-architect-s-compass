import test from "node:test";
import assert from "node:assert/strict";
import { cameraMatrix, projectWithMatrix } from "./solid-matrix.ts";
import { projectOrthographic } from "../src/geometry/projections/orthographic.ts";
import type { Vector3 } from "../src/geometry/projections/orthographic.ts";
test("camera matrix retains NDC position and depth for aspect, pan, zoom and distant local origins", () => {
  for (const offset of [0, 1e9])
    for (const aspect of [0.5, 1, 2])
      for (const pitch of [-1.4, 0, 0.6, 1.4]) {
        const origin: Vector3 = [offset, offset, 0],
          frame = { center: [offset + 2, offset - 3, 1] as Vector3, radius: 10, depthRadius: 40 };
        const camera = { yaw: 1.7, pitch, zoom: 2.3, panX: 0.2, panY: -0.4 };
        const matrix = cameraMatrix(frame, camera, aspect, origin);
        for (const point of [
          [offset - 4, offset + 2, 0],
          [offset + 3, offset - 4, 2.8],
        ] as Vector3[]) {
          const expected = projectOrthographic(point, frame, camera, aspect),
            actual = projectWithMatrix(point, origin, matrix);
          actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]!) < 2e-6));
        }
      }
});
