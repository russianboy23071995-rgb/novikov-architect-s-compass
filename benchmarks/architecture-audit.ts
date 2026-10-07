/** Full-snapshot materialization diagnostic; after A-04 this is NOT the pointer path. */
import assert from "node:assert/strict";
import { createProject, validateProject } from "../src/lib/bim/model.ts";
import { beginSelectionMove, previewSelectionMove } from "../src/application/selection/move.ts";
import { connectedWallContours } from "../src/domain/elements/wall/connections.ts";
import { wallBody } from "../src/domain/elements/wall/body.ts";
import { defaultHatchAppearance } from "../src/domain/elements/hatch/model.ts";
import type { Project } from "../src/domain/project/schema.ts";

function fixture(count: number) {
  const p = createProject("audit", "storey");
  for (const [id, start, end] of [
    ["A", { x: 0, y: 0 }, { x: 4, y: 0 }],
    ["B", { x: 4, y: 0 }, { x: 4, y: 4 }],
    ["C", { x: 10, y: 0 }, { x: 12, y: 0 }],
  ] as const)
    p.storey.walls.push({
      id,
      layerId: p.defaultLayerIds.wall,
      start,
      end,
      thickness: 0.36,
      height: 2.8,
      bodyOffset: 0,
    });
  p.storey.wallJoins.push({
    first: { wallId: "A", endpoint: 1 },
    second: { wallId: "B", endpoint: 0 },
  });
  p.storey.windows.push({
    id: "W",
    wallId: "A",
    layerId: p.defaultLayerIds.window,
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  p.storey.hatches.push({
    id: "H",
    kind: "hatch",
    layerId: p.defaultLayerIds.line,
    points: [
      { x: 20, y: 20 },
      { x: 22, y: 20 },
      { x: 22, y: 22 },
    ],
    fill: { color: "#999999", opacity: 0.3 },
    ...defaultHatchAppearance,
  });
  p.assets.push({
    id: "asset",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX5sAAAAASUVORK5CYII=",
  });
  p.storey.references.push({
    id: "R",
    kind: "image-reference",
    assetId: "asset",
    layerId: p.defaultLayerIds.line,
    origin: { x: 30, y: 30 },
    rotation: 0,
    metresPerPixel: 1,
  });
  p.storey.lines = [];
  for (let i = 0; i < count - 6; i++)
    p.storey.lines.push({
      id: `L${i}`,
      layerId: p.defaultLayerIds.line,
      kind: "line",
      points: [
        { x: i, y: 50 },
        { x: i + 0.5, y: 50 },
      ],
      color: "#000000",
      penWidth: 0.25,
      style: "solid",
    });
  return validateProject(p);
}
function entities(p: Project) {
  return [
    ...p.storey.walls,
    ...p.storey.windows,
    ...p.storey.hatches,
    ...p.storey.references,
    ...(p.storey.lines ?? []),
  ];
}
const reports = [100, 1000, 5000].map((count) => {
  const base = fixture(count),
    targets = [{ kind: "wall" as const, id: "A" }];
  const original = JSON.stringify(base);
  const preview = previewSelectionMove(
    beginSelectionMove(base, targets, { x: 0, y: 0 }),
    base,
    targets,
    { x: 2, y: -2 },
  );
  const before = entities(base),
    after = entities(preview);
  const changedIds = after
    .filter((e, i) => JSON.stringify(e) !== JSON.stringify(before[i]))
    .map((e) => e.id);
  const reallocated = after.filter((e, i) => e !== before[i]).length;
  assert.deepEqual(changedIds, ["A"]);
  assert.equal(reallocated, count);
  assert.notEqual(preview.assets[0], base.assets[0]);
  assert.equal(preview.assets[0]!.data, base.assets[0]!.data);
  assert.equal(JSON.stringify(base), original);
  const b = base.storey.walls.find((w) => w.id === "B")!;
  const oldContour = connectedWallContours(base).get("B") ?? wallBody(b).corners;
  const newContour = connectedWallContours(preview).get("B") ?? wallBody(b).corners;
  assert.notDeepEqual(newContour, oldContour);
  assert.deepEqual(
    preview.storey.walls.find((w) => w.id === "B"),
    b,
  );
  return {
    count,
    changedParameterIds: changedIds,
    newEntityObjects: reallocated,
    unchangedParameterObjectsReallocated: count - 1,
    newAssetObject: true,
    equalAssetString: true,
    stationaryNeighbourContourChanged: true,
    detachedRelations: 1,
  };
});
const base = fixture(100),
  targets = [{ kind: "wall" as const, id: "C" }];
// C has no relation to the joined A/B corner, yet its new endpoint occupies that node.
assert.ok(!base.storey.wallJoins.some((j) => j.first.wallId === "C" || j.second.wallId === "C"));
assert.throws(
  () =>
    previewSelectionMove(beginSelectionMove(base, targets, { x: 0, y: 0 }), base, targets, {
      x: -6,
      y: 0,
    }),
  /Mehrfachanschluss/,
);
process.stdout.write(
  JSON.stringify(
    {
      reports,
      unrelatedEndpointAtJoinedNodeRejected: true,
      note: "Identity/value assertions only, not a latency or heap measurement.",
    },
    null,
    2,
  ) + "\n",
);
