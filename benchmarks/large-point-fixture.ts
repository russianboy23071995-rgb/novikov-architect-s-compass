import { createProject, validateProject } from "../src/lib/bim/model.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
/** Valid, below-file-limit regression fixture: 20 polylines, 200,000 points. */
export function largePointFixture() {
  const project = createProject("large-points", "storey");
  project.storey.lines = Array.from({ length: 20 }, (_, row) => ({
    id: `polyline-${row}`,
    layerId: project.defaultLayerIds.line,
    kind: "polyline" as const,
    points: Array.from({ length: 10000 }, (_, i) => ({
      x: (i - 5000) / 10,
      y: row * 10 + (i % 2),
    })),
    ...defaultLineAppearance,
  }));
  return validateProject(project);
}
