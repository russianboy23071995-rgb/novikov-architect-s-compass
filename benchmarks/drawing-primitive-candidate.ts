// Diagnostic only: intentionally not imported by production.
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { storeyOf, replaceStorey } from "../src/domain/storeys/access.ts";
import type { Project } from "../src/domain/project/schema.ts";
import type { Point2 } from "../src/geometry/primitives/point.ts";
type Data = ReturnType<typeof projectSnapPrimitives>;
type Entry = { points: readonly Point2[]; data: Data };
function freeze(value: object): void {
  for (const child of Object.values(value)) if (child && typeof child === "object") freeze(child);
  Object.freeze(value);
}
export function drawingPrimitiveCandidate(maxPoints = 120_000, maxEntries = 2048) {
  let scope = "",
    previous = new Map<string, Entry>();
  let stats = { hits: 0, misses: 0, entries: 0, points: 0 };
  return {
    stats: () => ({ ...stats }),
    build(project: Project): Data {
      const storey = storeyOf(project);
      const context = JSON.stringify([project.id, storey.id]);
      if (scope !== context) previous.clear();
      scope = context;
      const next = new Map<string, Entry>();
      stats = { hits: 0, misses: 0, entries: 0, points: 0 };
      // Wall geometry and dependencies are always derived from the full model.
      const result = projectSnapPrimitives(
        replaceStorey(project, { ...storey, hatches: [], lines: [] }),
      );
      const append = (
        kind: "hatch" | "line",
        entity: NonNullable<typeof storey.lines>[number] | (typeof storey.hatches)[number],
      ) => {
        const key = JSON.stringify([kind, entity.id]);
        let entry = previous.get(key);
        if (
          entry &&
          entry.points.length === entity.points.length &&
          entity.points.every(
            (p, i) => Object.is(p.x, entry!.points[i]!.x) && Object.is(p.y, entry!.points[i]!.y),
          )
        ) {
          stats.hits++;
        } else {
          stats.misses++;
          // Use the actual production adapter, not a rewritten geometry formula.
          const data = projectSnapPrimitives(
            replaceStorey(project, {
              ...storey,
              walls: [],
              windows: [],
              wallJoins: [],
              wallTJunctions: [],
              hatches: kind === "hatch" ? [entity as (typeof storey.hatches)[number]] : [],
              lines: kind === "line" ? [entity as NonNullable<typeof storey.lines>[number]] : [],
            }),
          );
          entry = { points: entity.points.map((p) => ({ ...p })), data };
          freeze(entry);
        }
        for (const ref of entry.data.references) result.references.push(ref);
        for (const segment of entry.data.segments) result.segments.push(segment);
        if (next.size < maxEntries && stats.points + entry.points.length <= maxPoints) {
          next.set(key, entry);
          stats.points += entry.points.length;
        }
      };
      for (const hatch of storey.hatches) append("hatch", hatch);
      for (const line of storey.lines ?? []) append("line", line);
      previous = next;
      stats.entries = next.size;
      return result;
    },
  };
}
