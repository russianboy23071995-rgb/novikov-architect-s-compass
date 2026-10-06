import { useMemo, useRef } from "react";
import { windowPlacementInteraction } from "@/application/drawing/window-placement";
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
  const latest = useRef({ project, visibility, commit, cancel, active });
  latest.current = { project, visibility, commit, cancel, active };
  return useMemo(
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
          )
        : null,
    [active, project, visibility],
  );
}
