import { createProject } from "../src/application/projects/create.ts";
import { validateProject, type Project } from "../src/domain/project/schema.ts";
import { withOpeningMarks } from "../src/domain/elements/wall/opening-marks.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { defaultHatchAppearance } from "../src/domain/elements/hatch/model.ts";
import { DOOR_DEFAULTS } from "../src/domain/elements/door/model.ts";
import { defaultDoorLayerId } from "../src/application/doors/actions.ts";

type Storey = Project["storeys"][number];
type Point = { x: number; y: number };

/** Plan-like school for the acceptance run (user decision 25.10.2026), five storeys.
 * Each wing per storey: 50 × 20 m (1.000 m²) with a 2.5 m middle corridor and six classrooms on
 * each side. Exterior walls joined at the corners, corridor walls and partitions T-connected,
 * one door per classroom on the corridor, two windows per classroom on the facade, one
 * hatch per room and the corridor, desks as closed polylines. Walls below the top storey are
 * bound to their storey height, 0,20 m below OK raw floor above (as the former slab binding). Position numbers as after placement.
 * Still synthetic (regular grid, no stairs, no slabs); `wings` repeats the building along x.
 */
export function schoolPlanFixture(options: { wings?: number; desksPerRoom?: number } = {}) {
  const wings = options.wings ?? 1,
    desks = options.desksPerRoom ?? 44;
  const storeyCount = 5,
    storeyHeight = 3.5,
    slab = 0.3,
    thickness = 0.3;
  const p = createProject("school-plan", "s0");
  const template = p.storeys[0]!;
  const doorLayer = defaultDoorLayerId(p);
  const rooms = 6,
    length = 50,
    depth = 20,
    corridor = 2.5;
  const south = (depth - corridor) / 2,
    north = south + corridor,
    roomWidth = length / rooms;
  p.storeys = Array.from({ length: storeyCount }, (_, s): Storey => {
    const storey: Storey = {
      ...template,
      id: `s${s}`,
      name: s === 0 ? "Erdgeschoss" : `${s}. Obergeschoss`,
      height: storeyHeight,
      walls: [],
      windows: [],
      doors: [],
      wallJoins: [],
      wallTJunctions: [],
      lines: [],
      hatches: [],
      references: [],
    };
    const bound = s < storeyCount - 1;
    for (let w = 0; w < wings; w++) {
      const ox = w * (length + 10);
      const id = (name: string) => `s${s}-w${w}-${name}`;
      const wall = (name: string, start: Point, end: Point, width = thickness) =>
        storey.walls.push({
          id: id(name),
          start: { x: ox + start.x, y: start.y },
          end: { x: ox + end.x, y: end.y },
          thickness: width,
          bodyOffset: 0,
          height: storeyHeight - slab,
          layerId: p.defaultLayerIds.wall,
          ...(bound
            ? {
                topBinding: { kind: "storey" as const, topOffset: 0 - slab },
              }
            : {}),
        });
      // Exterior ring, counter-clockwise, joined at the four corners.
      wall("ext-s", { x: 0, y: 0 }, { x: length, y: 0 });
      wall("ext-e", { x: length, y: 0 }, { x: length, y: depth });
      wall("ext-n", { x: length, y: depth }, { x: 0, y: depth });
      wall("ext-w", { x: 0, y: depth }, { x: 0, y: 0 });
      for (const [a, b] of [
        ["ext-s", "ext-e"],
        ["ext-e", "ext-n"],
        ["ext-n", "ext-w"],
        ["ext-w", "ext-s"],
      ] as const)
        storey.wallJoins.push({
          first: { wallId: id(a), endpoint: 1 },
          second: { wallId: id(b), endpoint: 0 },
        });
      // Realistic junctions (user decision 26.10.2026, docs/WALL_JUNCTIONS.md): corridor walls
      // T into both gable walls; 24 cm partitions T into the facade and the corridor wall.
      const partition = 0.24;
      wall("cor-s", { x: 0, y: south }, { x: length, y: south });
      wall("cor-n", { x: 0, y: north }, { x: length, y: north });
      for (const corridorWall of ["cor-s", "cor-n"])
        storey.wallTJunctions.push(
          { hostWallId: id("ext-w"), incoming: { wallId: id(corridorWall), endpoint: 0 } },
          { hostWallId: id("ext-e"), incoming: { wallId: id(corridorWall), endpoint: 1 } },
        );
      for (let k = 1; k < rooms; k++) {
        const x = k * roomWidth;
        wall(`par-s${k}`, { x, y: 0 }, { x, y: south }, partition);
        wall(`par-n${k}`, { x, y: north }, { x, y: depth }, partition);
        storey.wallTJunctions.push(
          { hostWallId: id("ext-s"), incoming: { wallId: id(`par-s${k}`), endpoint: 0 } },
          { hostWallId: id("cor-s"), incoming: { wallId: id(`par-s${k}`), endpoint: 1 } },
          { hostWallId: id("cor-n"), incoming: { wallId: id(`par-n${k}`), endpoint: 0 } },
          { hostWallId: id("ext-n"), incoming: { wallId: id(`par-n${k}`), endpoint: 1 } },
        );
      }
      for (let r = 0; r < rooms; r++) {
        const centre = (r + 0.5) / rooms;
        for (const [side, host, corridorWall, y0, y1] of [
          ["s", "ext-s", "cor-s", 0, south],
          ["n", "ext-n", "cor-n", north, depth],
        ] as const) {
          // ext-n runs from x = length to 0, so its relative position is mirrored.
          const along = side === "n" ? 1 - centre : centre;
          for (const offset of [-2.2, 2.2])
            storey.windows.push({
              id: id(`win-${side}${r}${offset < 0 ? "a" : "b"}`),
              wallId: id(host),
              width: 1.5,
              height: 1.35,
              sillHeight: 0.9,
              position: along + offset / length,
              layerId: p.defaultLayerIds.window,
            });
          storey.doors!.push({
            id: id(`door-${side}${r}`),
            wallId: id(corridorWall),
            position: centre,
            ...DOOR_DEFAULTS,
            opensTo: side === "s" ? "right" : "left",
            layerId: doorLayer,
          });
          const x0 = r * roomWidth + 0.4,
            x1 = (r + 1) * roomWidth - 0.4;
          const ya = y0 + 0.4,
            yb = y1 - 0.4;
          storey.hatches.push({
            id: id(`room-${side}${r}`),
            kind: "hatch",
            layerId: p.defaultLayerIds.line,
            points: [
              { x: ox + x0, y: ya },
              { x: ox + x1, y: ya },
              { x: ox + x1, y: yb },
              { x: ox + x0, y: yb },
            ],
            fill: { color: side === "s" ? "#dbeafe" : "#dcfce7", opacity: 0.5 },
            ...defaultHatchAppearance,
          });
          // Desk grid: closed rectangles 1.2 × 0.6 m.
          const columns = Math.ceil(Math.sqrt(desks * 1.6));
          for (let d = 0; d < desks; d++) {
            const cx = x0 + 0.5 + (d % columns) * ((x1 - x0 - 1.7) / Math.max(1, columns - 1)),
              cy = ya + 0.6 + Math.floor(d / columns) * 0.9;
            if (cy + 0.6 > yb) break;
            storey.lines!.push({
              id: id(`desk-${side}${r}-${d}`),
              kind: "polyline",
              layerId: p.defaultLayerIds.line,
              points: [
                { x: ox + cx, y: cy },
                { x: ox + cx + 1.2, y: cy },
                { x: ox + cx + 1.2, y: cy + 0.6 },
                { x: ox + cx, y: cy + 0.6 },
                { x: ox + cx, y: cy },
              ],
              ...defaultLineAppearance,
            });
          }
        }
      }
      storey.hatches.push({
        id: id("corridor"),
        kind: "hatch",
        layerId: p.defaultLayerIds.line,
        points: [
          { x: ox + 0.4, y: south + 0.3 },
          { x: ox + length - 0.4, y: south + 0.3 },
          { x: ox + length - 0.4, y: north - 0.3 },
          { x: ox + 0.4, y: north - 0.3 },
        ],
        fill: { color: "#fef3c7", opacity: 0.5 },
        ...defaultHatchAppearance,
      });
    }
    return storey;
  });
  p.workingStoreyId = "s0";
  return validateProject(withOpeningMarks(p));
}

/** Element counts per kind over all storeys. */
export function schoolPlanCounts(p: Project) {
  const sum = (f: (s: Storey) => number) => p.storeys.reduce((n, s) => n + f(s), 0);
  const counts = {
    walls: sum((s) => s.walls.length),
    windows: sum((s) => s.windows.length),
    doors: sum((s) => s.doors?.length ?? 0),
    lines: sum((s) => s.lines?.length ?? 0),
    hatches: sum((s) => s.hatches.length),
    references: sum((s) => s.references.length),
  };
  return { ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}
