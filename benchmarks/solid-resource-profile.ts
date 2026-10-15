import { createSolidRenderer } from "../src/rendering/viewport/solid-renderer.ts";
import { recordingCanvas, resourceFixture, resourceProjection } from "./solid-resource-fixture.ts";
for (const count of [100, 1000, 5000]) {
  const { canvas, stats } = recordingCanvas(),
    renderer = createSolidRenderer(canvas),
    solid = resourceFixture(count),
    projection = resourceProjection();
  renderer.draw(solid, projection, new Set(), [], []);
  const initial = { ...stats },
    runs = [];
  for (let i = 0; i < 6; i++) {
    const start = performance.now();
    renderer.draw(solid, projection, new Set([`w${i % 2}`]), [], []);
    runs.push(performance.now() - start);
  }
  const selection = { ...stats },
    moves = [];
  for (let i = 0; i < 6; i++) {
    const moving = {
      ...solid,
      faces: [
        ...solid.faces.slice(1),
        {
          ...solid.faces[0]!,
          vertices: solid.faces[0]!.vertices.map(
            ([x, y, z]) => [x + i / 10, y, z] as [number, number, number],
          ),
        },
      ],
    };
    const start = performance.now();
    renderer.draw(moving, projection, new Set(["w0"]), [], []);
    moves.push(performance.now() - start);
  }
  console.log(
    JSON.stringify({
      count,
      initial,
      selection,
      moved: { ...stats },
      selectionMs: runs,
      movementMs: moves,
    }),
  );
  renderer.dispose();
}
