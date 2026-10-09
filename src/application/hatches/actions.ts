import { samePattern } from "../../domain/elements/hatch/revision.ts";
import {
  validateHatchPattern,
  type HatchPatternDefinition,
} from "../../domain/elements/hatch/pattern.ts";
import {
  defaultHatchAppearance,
  patternRotationSchema,
} from "../../domain/elements/hatch/model.ts";
import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Hatch } from "../../domain/elements/hatch/model.ts";
import { commitProject } from "../../lib/bim/history.ts";
import type { ProjectHistory } from "../../lib/bim/history.ts";

export type HatchRequest = {
  projectId: string;
  patternDefinition?: HatchPatternDefinition | null | undefined;
  patternRotation?: number | undefined;
} & (
  | {
      kind: "create";
      hatch: Omit<Hatch, "kind" | "layerId" | "background" | "contour"> &
        Partial<Pick<Hatch, "background" | "contour">> & { layerId?: string };
    }
  | {
      kind: "update";
      id: string;
      changes: Partial<
        Pick<Hatch, "points" | "fill" | "layerId" | "background" | "contour" | "pattern">
      >;
    }
);

/** UI and future text/voice adapters share this snapshot-bound preview/commit boundary. */
export function previewHatch(base: Project, current: Project, request: HatchRequest): Project {
  if (base !== current || request.projectId !== current.id)
    throw new Error("Das Projekt wurde geändert. Schraffurvorgang erneut beginnen.");
  const project = validateProject(current);
  const hatches = project.storey.hatches;
  if (request.kind === "update" && !hatches.some((h) => h.id === request.id))
    throw new Error("Die Schraffur existiert nicht mehr.");
  const definition = request.patternDefinition
    ? validateHatchPattern(request.patternDefinition)
    : null;
  const existing = definition && project.hatchPatterns.find((p) => p.id === definition.id);
  if (existing && !samePattern(existing, definition))
    throw new Error("Muster-ID hat eine andere Definition.");
  const source =
    request.kind === "create" ? request.hatch : hatches.find((h) => h.id === request.id)!;
  const assignment =
    request.patternDefinition === undefined
      ? {}
      : {
          pattern: definition
            ? {
                patternId: definition.id,
                mode: "model" as const,
                ...(source.pattern?.rotation === undefined
                  ? {}
                  : { rotation: source.pattern.rotation }),
                origin:
                  source.pattern?.patternId === definition.id
                    ? source.pattern.origin
                    : {
                        x: Math.min(...source.points.map((p) => p.x)),
                        y: Math.min(...source.points.map((p) => p.y)),
                      },
              }
            : null,
        };
  if (request.patternRotation !== undefined) {
    const pattern =
      request.patternDefinition !== undefined
        ? assignment.pattern
        : request.kind === "update" && request.changes.pattern !== undefined
          ? request.changes.pattern
          : source.pattern;
    if (!pattern) throw new Error("Zuerst ein Schraffurmuster wählen.");
    if (!patternRotationSchema.safeParse(request.patternRotation).success)
      throw new Error("Musterwinkel muss zwischen 0 und 360 Grad liegen.");
    const rotation = request.patternRotation % 360;
    const { rotation: _previous, ...unrotated } = pattern;
    assignment.pattern = rotation === 0 ? unrotated : { ...pattern, rotation };
  }
  const next = validateProject({
    ...project,
    hatchPatterns:
      definition && !existing ? [...project.hatchPatterns, definition] : project.hatchPatterns,
    storey: {
      ...project.storey,
      hatches:
        request.kind === "create"
          ? [
              ...hatches,
              {
                ...defaultHatchAppearance,
                layerId: project.defaultLayerIds.line,
                ...request.hatch,
                ...assignment,
                kind: "hatch",
              },
            ]
          : hatches.map((h) =>
              h.id === request.id
                ? { ...h, ...request.changes, ...assignment, id: h.id, kind: h.kind }
                : h,
            ),
    },
  });
  return JSON.stringify(next) === JSON.stringify(project) ? current : next;
}

export function commitHatch(
  history: ProjectHistory,
  base: Project,
  request: HatchRequest,
): ProjectHistory {
  return commitProject(history, previewHatch(base, history.present, request));
}
