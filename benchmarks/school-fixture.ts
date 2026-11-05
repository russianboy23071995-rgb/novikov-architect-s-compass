import { createProject } from "../src/application/projects/create.ts";
import {
  validateProject,
  type DrawingLine,
  type Project,
  type Wall,
  type BimWindow,
} from "../src/domain/project/schema.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";

/** Synthetic school-like model: equal storeys, each ten elements are two joined walls (an L),
 * one hosted window and seven lines. Geometry is repetitive; it is not a real school plan.
 */
export function schoolFixture(elements: number, storeyCount = 5): Project {
  const p = createProject("school", "s0");
  const template = p.storeys[0]!;
  const perStorey = Math.floor(elements / storeyCount);
  const groups = Math.floor(perStorey / 10);
  p.storeys = Array.from({ length: storeyCount }, (_, s) => {
    const id = (name: string) => `s${s}-${name}`;
    const walls: Wall[] = [],
      windows: BimWindow[] = [],
      wallJoins: Project["storeys"][number]["wallJoins"] = [],
      lines: DrawingLine[] = [];
    for (let g = 0; g < groups; g++) {
      const x = (g % 20) * 7,
        y = Math.floor(g / 20) * 7;
      const wall = (name: string, start: { x: number; y: number }, end: { x: number; y: number }) =>
        walls.push({
          id: id(name),
          start,
          end,
          thickness: 0.24,
          bodyOffset: 0,
          height: 2.8,
          layerId: p.defaultLayerIds.wall,
        });
      wall(`a${g}`, { x, y }, { x: x + 4, y });
      wall(`b${g}`, { x: x + 4, y }, { x: x + 4, y: y + 4 });
      wallJoins.push({
        first: { wallId: id(`a${g}`), endpoint: 1 as const },
        second: { wallId: id(`b${g}`), endpoint: 0 as const },
      });
      windows.push({
        id: id(`win${g}`),
        wallId: id(`a${g}`),
        width: 1.2,
        height: 1.2,
        sillHeight: 0.9,
        position: 0.5,
        layerId: p.defaultLayerIds.window,
      });
    }
    for (let i = 0; i < perStorey - groups * 3; i++)
      lines.push({
        id: id(`line${i}`),
        layerId: p.defaultLayerIds.line,
        kind: "line" as const,
        points: [
          { x: (i % 140) * 1, y: -2 - Math.floor(i / 140) },
          { x: (i % 140) * 1 + 0.5, y: -1.5 - Math.floor(i / 140) },
        ],
        ...defaultLineAppearance,
      });
    return {
      ...template,
      id: `s${s}`,
      name: `Geschoss ${s}`,
      height: 3.2,
      walls,
      windows,
      wallJoins,
      lines,
    };
  });
  p.workingStoreyId = `s${Math.floor(storeyCount / 2)}`;
  return validateProject(p);
}

export const schoolElementCount = (p: Project) =>
  p.storeys.reduce((n, s) => n + s.walls.length + s.windows.length + (s.lines?.length ?? 0), 0);
