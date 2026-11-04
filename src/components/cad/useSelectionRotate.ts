import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  assertRotatableSelection,
  beginSelectionRotation,
  rotationAt,
  selectionRotationInteraction,
  type SelectionRotation,
} from "@/application/selection/rotate";
import { sameTargets } from "@/application/selection/move";
import { precisionTarget } from "@/application/input/precision";
import { drawingSnapPolicy } from "@/application/tools/snapping";
import type { AnchoredToolInteraction } from "@/application/tools/interaction";
import type { SelectionSet } from "@/application/selection/state";
import type { Project, Point } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";

/**
 * Drehen (docs/TASTENKUERZEL.md, B2): pivot click, reference click, target click. Before the
 * pivot there is no adapter (the plan pick sets it); the reference is a direction tool from the
 * pivot; the turn is the rotation interaction. Any model, filter or selection change ends it.
 */
export function useSelectionRotate(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (project: Project, degrees: number) => void,
) {
  const [pending, setPending] = useState<{
    base: Project;
    targets: SelectionSet;
    visibility: LayerVisibilityPolicy;
    pivot: Point | null;
    session: SelectionRotation | null;
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
    if (!active?.pivot) return null;
    if (active.session)
      return selectionRotationInteraction(
        active.session,
        project,
        targets,
        visibility,
        (next, degrees) => {
          commitRef.current(next, degrees);
          cancel();
        },
        cancel,
      );
    const pivot = active.pivot;
    const setReference = (point: Point) =>
      setPending({
        ...active,
        session: beginSelectionRotation(project, targets, pivot, point, visibility),
      });
    return {
      identity: active,
      origin: pivot,
      snapping: drawingSnapPolicy(pivot),
      input: { axisLabel: null, degrees: null },
      click: "confirm",
      preview: (angle, length, aim) => precisionTarget(pivot, aim, angle, length),
      validate: () => {},
      confirm: setReference,
      commit: setReference,
      cancel,
    };
  }, [active, project, targets, visibility, cancel]);
  return {
    active: !!active,
    /** "pivot" | "reference" | "turn" while active. */
    stage: !active ? null : !active.pivot ? "pivot" : !active.session ? "reference" : "turn",
    pivot: active?.pivot ?? null,
    session: active?.session ?? null,
    begin: () => {
      assertRotatableSelection(project, targets, visibility);
      setPending({
        base: project,
        targets: targets.map((t) => ({ ...t })),
        visibility,
        pivot: null,
        session: null,
      });
    },
    pickPivot: (point: Point) => {
      if (active && !active.pivot) setPending({ ...active, pivot: { ...point } });
    },
    angleAt: (point: Point | null) =>
      active?.session && point ? rotationAt(active.session, point) : null,
    cancel,
    adapter,
  };
}
