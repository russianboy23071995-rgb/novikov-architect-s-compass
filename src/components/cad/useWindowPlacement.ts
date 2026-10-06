import { useMemo, useRef, useState } from "react";
import {
  windowPlacementInteraction,
  defaultDrawingWindow,
  parseWindowDimensions,
  type WindowDimensionDraft,
} from "@/application/drawing/window-placement";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";

/** Lifecycle owner only; geometry, snapping, validation and history stay shared. */
export function useWindowPlacement(
  active: boolean,
  project: Project,
  visibility: LayerVisibilityPolicy,
  commit: (next: Project, id: string) => void,
  cancel: () => void,
) {
  const [dimensions, setDimensions] = useState<WindowDimensionDraft>(() => ({
    width: String(defaultDrawingWindow.width),
    height: String(defaultDrawingWindow.height),
    sillHeight: String(defaultDrawingWindow.sillHeight),
  }));
  let error = "";
  try {
    parseWindowDimensions(dimensions);
  } catch (reason) {
    error = reason instanceof Error ? reason.message : "Ungültige Maße.";
  }
  const latest = useRef({ project, visibility, commit, cancel, active, dimensions });
  latest.current = { project, visibility, commit, cancel, active, dimensions };
  const adapter = useMemo(
    () =>
      active
        ? windowPlacementInteraction(
            project,
            visibility,
            `window-${crypto.randomUUID()}`,
            () => {
              if (!latest.current.active) throw new Error("Fensterwerkzeug nicht mehr aktiv.");
              return latest.current;
            },
            (next, id) => latest.current.commit(next, id),
            () => latest.current.cancel(),
            { draft: dimensions, currentDraft: () => latest.current.dimensions },
          )
        : null,
    [active, project, visibility, dimensions],
  );
  return { adapter, dimensions, setDimensions, error };
}
