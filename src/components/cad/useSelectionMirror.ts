import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  assertMirrorableSelection,
  beginSelectionMirror,
  selectionMirrorInteraction,
  type SelectionMirror,
} from "@/application/selection/mirror";
import { sameTargets } from "@/application/selection/move";
import type { AnchoredToolInteraction } from "@/application/tools/interaction";
import type { SelectionSet } from "@/application/selection/state";
import type { Project, Point } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";

/**
 * Spiegeln (docs/TASTENKUERZEL.md, B3): first axis point, then the axis direction. Before the
 * first point there is no adapter (the plan pick sets it); then the mirror interaction. Any
 * model, filter or selection change ends it.
 */
export function useSelectionMirror(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (project: Project, axis: number) => void,
) {
  const [pending, setPending] = useState<{
    base: Project;
    targets: SelectionSet;
    visibility: LayerVisibilityPolicy;
    session: SelectionMirror | null;
  } | null>(null);
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
  const adapter = useMemo((): AnchoredToolInteraction | null => {
    if (!active?.session) return null;
    return selectionMirrorInteraction(
      active.session,
      project,
      targets,
      visibility,
      (next, axis) => {
        commitRef.current(next, axis);
        cancel();
      },
      cancel,
    );
  }, [active, project, targets, visibility, cancel]);
  return {
    active: !!active,
    /** "origin" | "axis" while active. */
    stage: !active ? null : !active.session ? "origin" : "axis",
    origin: active?.session?.origin ?? null,
    begin: () => {
      assertMirrorableSelection(project, targets, visibility);
      setPending({
        base: project,
        targets: targets.map((t) => ({ ...t })),
        visibility,
        session: null,
      });
    },
    pickOrigin: (point: Point) => {
      if (active && !active.session)
        setPending({
          ...active,
          session: beginSelectionMirror(project, targets, { ...point }, visibility),
        });
    },
    cancel,
    adapter,
  };
}
