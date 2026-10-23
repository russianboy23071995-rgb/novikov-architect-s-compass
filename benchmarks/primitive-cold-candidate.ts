// Isolated candidate. No production imports this module.
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { createPrimitiveSourceIndex } from "../src/constraints/snapping/local-source-index.ts";
import { storeyOf, replaceStorey } from "../src/domain/storeys/access.ts";
import type { Project } from "../src/domain/project/schema.ts";
import type { Point2 } from "../src/geometry/primitives/point.ts";
type Data = ReturnType<typeof projectSnapPrimitives>;
type Entry = { points: readonly Point2[]; data: Data };
export function drawingPrimitiveCandidate(maxPoints = 120_000, maxEntries = 2048) {
  let scope = "",
    previous = new Map<string, Entry>();
  let stats = { hits: 0, misses: 0, entries: 0, points: 0 };
  return {
    stats: () => ({ ...stats }),
    build(project: Project) {
      const s = storeyOf(project),
        context = JSON.stringify([project.id, s.id]);
      const old = scope === context ? previous : new Map<string, Entry>();
      const hits = new Map<string, Entry>();
      const entities = [
        ...s.hatches.map((e) => ({ e, key: `h:${e.id}` })),
        ...(s.lines ?? []).map((e) => ({ e, key: `l:${e.id}` })),
      ];
      for (const { e, key } of entities) {
        const entry = old.get(key);
        if (
          entry &&
          entry.points.length === e.points.length &&
          e.points.every(
            (p, i) => Object.is(p.x, entry.points[i]!.x) && Object.is(p.y, entry.points[i]!.y),
          )
        )
          hits.set(key, entry);
      }
      // One full derivation for all misses and the unchanged wall full-path.
      const fresh = projectSnapPrimitives(
        hits.size
          ? replaceStorey(project, {
              ...s,
              hatches: s.hatches.filter((e) => !hits.has(`h:${e.id}`)),
              lines: (s.lines ?? []).filter((e) => !hits.has(`l:${e.id}`)),
            })
          : project,
      );
      const groups = new Map<string, Data>();
      for (const r of fresh.references) {
        let group = groups.get(r.entityId);
        if (!group) {
          group = { references: [], segments: [] };
          groups.set(r.entityId, group);
        }
        group.references.push(r);
      }
      for (const seg of fresh.segments) groups.get(seg.source.entityId)!.segments.push(seg);
      const data: Data = hits.size ? { references: [], segments: [] } : fresh;
      if (hits.size) {
        for (const wall of s.walls) {
          const group = groups.get(wall.id)!;
          data.references.push(...group.references);
          data.segments.push(...group.segments);
        }
        for (const { e, key } of entities) {
          const group = hits.get(key)?.data ?? groups.get(e.id)!;
          for (const r of group.references) data.references.push(r);
          for (const seg of group.segments) data.segments.push(seg);
        }
      }
      // Private origin: only this successful complete index build establishes deep freezing.
      // No external data/provenance flag, and no Object.isFrozen shortcut.
      const index = createPrimitiveSourceIndex(data);
      const next = new Map<string, Entry>();
      let points = 0;
      for (const { e, key } of entities) {
        if (next.size >= maxEntries || points + e.points.length > maxPoints) continue;
        const existing = hits.get(key);
        if (existing) next.set(key, existing);
        else {
          const group = groups.get(e.id) ?? { references: [], segments: [] };
          Object.freeze(group.references);
          Object.freeze(group.segments);
          Object.freeze(group);
          next.set(
            key,
            Object.freeze({
              points: Object.freeze(e.points.map((p) => Object.freeze({ ...p }))),
              data: group,
            }),
          );
        }
        points += e.points.length;
      }
      previous = next;
      scope = context;
      stats = { hits: hits.size, misses: entities.length - hits.size, entries: next.size, points };
      return { data, index };
    },
  };
}
