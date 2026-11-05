import {
  windowPlacementInteraction,
  windowPlacementHost,
  parseWindowDimensions,
  type WindowDimensionDraft,
} from "@/application/drawing/window-placement";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import { useOpeningPlacement, type OpeningPlacementKind } from "./useOpeningPlacement";
import { WINDOW_INSERT_DEFAULTS } from "@/domain/elements/window/insert";

const windowKind: OpeningPlacementKind<WindowDimensionDraft> = {
  idPrefix: "window",
  inactive: "Fensterplatzierung nicht mehr aktiv. Aktuelle Vorschau verwenden.",
  parse: parseWindowDimensions,
  host: windowPlacementHost,
  interaction: windowPlacementInteraction,
  // R1: a window element takes its outside from the second click; a plain opening has none.
  side: {
    applies: (draft) => draft.insert !== null,
    with: (draft, exterior) => ({
      ...draft,
      insert: { ...(draft.insert ?? WINDOW_INSERT_DEFAULTS), exterior },
    }),
  },
};

/** Lifecycle owner only; geometry, snapping, validation and history stay shared. */
export function useWindowPlacement(
  active: boolean,
  project: Project,
  visibility: LayerVisibilityPolicy,
  commit: (next: Project, id: string) => void,
  cancel: () => void,
  dimensions: WindowDimensionDraft,
  setDimensions: (value: WindowDimensionDraft) => void,
) {
  return useOpeningPlacement(
    windowKind,
    active,
    project,
    visibility,
    commit,
    cancel,
    dimensions,
    setDimensions,
  );
}
