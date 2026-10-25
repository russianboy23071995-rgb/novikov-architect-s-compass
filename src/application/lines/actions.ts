import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { DrawingLine, Project } from "../../domain/project/schema.ts";

type Creation<T extends { layerId: string }> = Omit<T, "layerId"> & { layerId?: string };

/** Line creation and editing, moved unchanged from lib/bim/model.ts (25.10.2026). */
export function addLine(project: Project, line: Creation<DrawingLine>): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      lines: [
        ...(storeyOf(project).lines ?? []),
        { layerId: project.defaultLayerIds.line, ...line },
      ],
    }),
  });
}

export function updateLine(
  project: Project,
  lineId: string,
  changes: Partial<Omit<DrawingLine, "id">>,
): Project {
  if (!storeyOf(project).lines?.some((line) => line.id === lineId))
    throw new Error(`Unknown line: ${lineId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      lines: storeyOf(project).lines!.map((line) =>
        line.id === lineId ? { ...line, ...changes, id: line.id } : line,
      ),
    }),
  });
}
