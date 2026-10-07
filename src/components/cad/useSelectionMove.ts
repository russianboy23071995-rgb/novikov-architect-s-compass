import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  assertMovableSelection,
  beginSelectionMove,
  sameTargets,
  selectionMoveInteraction,
  type SelectionMove,
} from "@/application/selection/move";
import type { SelectionSet } from "@/application/selection/state";
import type { Project, Point } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";

/** The selection consumer pins context; keyboard/input/snapping remain ToolInteraction-owned. */
export function useSelectionMove(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (project: Project) => void,
) {
  const [pending, setPending] = useState<{
    base: Project;
    targets: SelectionSet;
    visibility: LayerVisibilityPolicy;
    session: SelectionMove | null;
  } | null>(null);
  const latest = useRef({ project, targets, visibility, pending });
  latest.current = { project, targets, visibility, pending };
  const active =
    pending?.base === project &&
    pending.visibility === visibility &&
    sameTargets(pending.targets, targets)
      ? pending
      : null;
  useEffect(() => {
    if (pending && !active) setPending(null);
  }, [pending, active]);
  const cancel = useCallback(() => setPending(null), []);
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const adapter = useMemo(
    () =>
      active?.session
        ? selectionMoveInteraction(
            active.session,
            project,
            targets,
            visibility,
            (next) => {
              const now = latest.current;
              if (
                now.pending !== active ||
                now.project !== project ||
                now.visibility !== visibility ||
                !sameTargets(now.targets, targets)
              )
                throw new Error("Bewegung nicht mehr aktuell. Erneut beginnen.");
              commitRef.current(next);
              cancel();
            },
            cancel,
          )
        : null,
    [active, project, targets, visibility, cancel],
  );
  return {
    active: !!active,
    pickingOrigin: !!active && !active.session,
    begin: () => {
      assertMovableSelection(project, targets, visibility);
      setPending({
        base: project,
        targets: targets.map((t) => ({ ...t })),
        visibility,
        session: null,
      });
    },
    pickOrigin: (origin: Point) => {
      if (active && !active.session)
        setPending({
          ...active,
          session: beginSelectionMove(project, targets, origin, visibility),
        });
    },
    cancel,
    adapter,
  };
}
