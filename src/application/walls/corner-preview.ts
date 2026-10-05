import type { Project } from "../../domain/project/schema.ts";
import { deriveCornerSolids } from "../../domain/elements/wall/corner-solid.ts";
import type { CornerTarget } from "../../domain/elements/wall/corner-openings.ts";

export type CornerPreview = { base: Project; geometry: ReturnType<typeof deriveCornerSolids> };
export type CornerPreviewState = { preview: CornerPreview | null; error: string };
export function cornerPreviewReducer(
  _state: CornerPreviewState,
  event:
    | { type: "clear" }
    | { type: "preview"; project: Project; first: CornerTarget; second: CornerTarget },
): CornerPreviewState {
  if (event.type === "clear") return { preview: null, error: "" };
  try {
    return {
      preview: {
        base: event.project,
        geometry: deriveCornerSolids(event.project, event.first, event.second),
      },
      error: "",
    };
  } catch (error) {
    return {
      preview: null,
      error: error instanceof Error ? error.message : "Ungültiger Anschluss.",
    };
  }
}
export function currentCornerPreview(state: CornerPreviewState, project: Project) {
  return state.preview?.base === project ? state.preview : null;
}
