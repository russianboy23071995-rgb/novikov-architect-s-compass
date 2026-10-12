import { createProject, validateProject } from "../src/lib/bim/model.ts";
export function connectedFixture(kind: "chain" | "tees", count: number) {
  const p = createProject("connected-profile", "storey"),
    s = p.storey;
  const wall = (id: string, start: { x: number; y: number }, end: { x: number; y: number }) =>
    s.walls.push({
      id,
      start,
      end,
      layerId: p.defaultLayerIds.wall,
      thickness: 0.36,
      height: 2.8,
      bodyOffset: 0,
    });
  if (kind === "chain") {
    let start = { x: 0, y: 0 };
    for (let i = 0; i < count; i++) {
      const end = { x: start.x + (i % 2 ? 0 : 4), y: start.y + (i % 2 ? 4 : 0) };
      wall(`wall-${i}`, start, end);
      if (i)
        s.wallJoins.push({
          first: { wallId: `wall-${i - 1}`, endpoint: 1 },
          second: { wallId: `wall-${i}`, endpoint: 0 },
        });
      start = end;
    }
  } else {
    wall("wall-0", { x: 0, y: 0 }, { x: count * 4, y: 0 });
    for (let i = 1; i < count; i++) {
      wall(`wall-${i}`, { x: i * 4, y: -4 }, { x: i * 4, y: 0 });
      s.wallTJunctions.push({
        hostWallId: "wall-0",
        incoming: { wallId: `wall-${i}`, endpoint: 1 },
      });
    }
  }
  for (const w of s.walls)
    s.windows.push({
      id: `window-${w.id}`,
      wallId: w.id,
      layerId: p.defaultLayerIds.window,
      width: 1,
      height: 1.2,
      sillHeight: 0.9,
      position: 0.5,
    });
  return validateProject(p);
}
