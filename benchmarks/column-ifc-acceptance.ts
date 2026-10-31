import type { Project } from "../src/domain/project/schema.ts";
import { createProject } from "../src/application/projects/create.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { addColumn } from "../src/application/columns/actions.ts";
import { setStoreyHeight, renameStorey } from "../src/application/storeys/actions.ts";

/**
 * Archicad acceptance of columns (docs/STUETZEN.md, P3): one storey of 3,00 m, an 8 × 6 m wall
 * ring (0,30 m, 2,80 m) and four columns – 30 × 30 cm bound to the storey, 24 × 50 cm turned
 * 30°, Ø 40 cm bound, Ø 25 cm fixed 2,00 m high as Abbruch.
 */
export function columnAcceptanceProject(): Project {
  let p = createProject("novikov-stuetzen-abnahme", "eg");
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 3 });
  p = renameStorey(p, p, { projectId: p.id, storeyId: "eg", name: "Erdgeschoss" });
  const corners = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 0, y: 6 },
  ];
  corners.forEach((start, i) => {
    p = addWall(p, {
      id: `wand-${i + 1}`,
      start,
      end: corners[(i + 1) % 4]!,
      thickness: 0.3,
      height: 2.8,
    });
  });
  p = addColumn(p, {
    id: "Stuetze-30x30",
    position: { x: 2, y: 2 },
    shape: { kind: "rectangle", width: 0.3, depth: 0.3 },
    renovation: "new",
  });
  p = addColumn(p, {
    id: "Stuetze-24x50-gedreht",
    position: { x: 4, y: 3 },
    shape: { kind: "rectangle", width: 0.24, depth: 0.5 },
    rotation: 30,
    renovation: "existing",
  });
  p = addColumn(p, {
    id: "Stuetze-rund-40",
    position: { x: 6, y: 2 },
    shape: { kind: "circle", diameter: 0.4 },
    renovation: "new",
  });
  p = addColumn(p, {
    id: "Stuetze-rund-25-Abbruch",
    position: { x: 6, y: 4.5 },
    shape: { kind: "circle", diameter: 0.25 },
    height: 2,
    renovation: "demolish",
  });
  return p;
}
