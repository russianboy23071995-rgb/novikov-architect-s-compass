import type { Project } from "../../domain/project/schema.ts";
import { projectSnapParts, projectSnapPrimitives, type SnapPart } from "./project-references.ts";
import {
  combineSourceIndexes,
  createPrimitiveSourceIndex,
} from "../../constraints/snapping/local-source-index.ts";
import { createDerivedCache } from "../../domain/project/derived-cache.ts";
export { completeLocalQuery } from "../../constraints/snapping/local-source-index.ts";

/** One index over all snap parts of the working storey (reference build, tests). */
export function createLocalSnapSources(project: Project) {
  return createPrimitiveSourceIndex(projectSnapPrimitives(project));
}
export type LocalSnapSources = ReturnType<typeof combineSourceIndexes>;

// The workspace index is built in blocks of up to BLOCK consecutive parts of one element kind
// (walls, doors, hatches, lines; one part per element). A block whose parts are the same objects as
// before keeps its index, so an edit rebuilds only the blocks it touched
// (docs/performance/EDIT_CYCLE.md, Teil B).
const BLOCK = 512;
type BlockIndex = ReturnType<typeof createPrimitiveSourceIndex>;
const blocks = new WeakMap<SnapPart, { parts: readonly SnapPart[]; index: BlockIndex }[]>();
function blockIndex(parts: readonly SnapPart[]): BlockIndex {
  const known = blocks.get(parts[0]!) ?? [];
  const hit = known.find(
    (entry) => entry.parts.length === parts.length && entry.parts.every((p, i) => p === parts[i]),
  );
  if (hit) return hit.index;
  const index = createPrimitiveSourceIndex({
    references: parts.flatMap((p) => p.references),
    segments: parts.flatMap((p) => p.segments),
  });
  // Keep the latest few blocks starting with this part (undo/redo alternate between them).
  blocks.set(parts[0]!, [{ parts, index }, ...known].slice(0, 4));
  return index;
}

function createBlockedSnapSources(project: Project) {
  const groups: (readonly SnapPart[])[] = [];
  for (const kind of projectSnapParts(project))
    for (let i = 0; i < kind.length; i += BLOCK) groups.push(kind.slice(i, i + BLOCK));
  return combineSourceIndexes(groups.map(blockIndex));
}

const cache = createDerivedCache<Project, LocalSnapSources>();
export function getLocalSnapSources(project: Project): LocalSnapSources {
  let sources = cache.get(project);
  if (!sources) {
    sources = createBlockedSnapSources(project);
    cache.set(project, sources);
  }
  return sources;
}
