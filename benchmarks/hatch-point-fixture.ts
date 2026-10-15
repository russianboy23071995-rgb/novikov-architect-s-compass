import { createProject, validateProject } from "../src/lib/bim/model.ts";
import { defaultHatchAppearance } from "../src/domain/elements/hatch/model.ts";
export function hatchPointFixture(count = 4, vertices = 100) {
  const p = createProject("hatch-point", "s");
  p.hatchPatterns.push({
    id: "pattern",
    name: "Diagonal",
    width: 1,
    height: 1,
    lines: [{ start: { x: 0, y: 1 }, end: { x: 1, y: 0 } }],
  });
  p.storeys[0]!.lines = [];
  p.storeys[0]!.hatches = Array.from({ length: count }, (_, k) => ({
    id: `h${k}`,
    kind: "hatch" as const,
    layerId: p.defaultLayerIds.line,
    points: Array.from({ length: vertices }, (_, i) => {
      const a = (2 * Math.PI * i) / vertices;
      return { x: k * 30 + 10 * Math.cos(a), y: 10 * Math.sin(a) };
    }),
    fill: { color: "#33aabb", opacity: 0.6 },
    ...defaultHatchAppearance,
    pattern: {
      patternId: "pattern",
      mode: "model" as const,
      origin: { x: k * 30, y: 0 },
      rotation: 45,
    },
  }));
  p.storeys.push({ ...p.storeys[0]!, id: "upper", name: "Upper", hatches: [] });
  return validateProject(p);
}
