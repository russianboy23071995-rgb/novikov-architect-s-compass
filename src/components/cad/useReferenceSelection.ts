import { sameReference } from "@/constraints/inference/hover-reference";
import type { Point2 } from "@/geometry/primitives/point";
import { useMemo, useState } from "react";
import {
  emptyReferenceSelection,
  reduceReferenceSelection,
  segmentKey,
} from "@/application/snapping/reference-selection";
import type {
  ReferenceSelection,
  ReferenceSelectionEvent,
} from "@/application/snapping/reference-selection";
import { getLocalSnapSources } from "@/application/snapping/local-sources";
import type { Project } from "@/lib/bim/model";
import type { SnapReference } from "@/constraints/snapping/engine";
export function useReferenceSelection(project: Project, scope: object) {
  const [stored, setStored] = useState<{
    scope: object;
    mode: "segments" | "points";
    points: readonly SnapReference[];
    state: ReferenceSelection;
    hits: readonly SnapReference[];
    hot: SnapReference | null;
    position: Point2 | null;
  } | null>(null);
  const current = stored?.scope === scope ? stored : null;
  const state = current?.state ?? emptyReferenceSelection();
  const selected = useMemo(
    () => (state.confirmed === null ? null : new Set(state.confirmed)),
    [state.confirmed],
  );
  const send = (event: ReferenceSelectionEvent) =>
    setStored((previous) => {
      if (event.type !== "begin" && previous?.scope !== scope) return previous;
      return {
        scope,
        mode: "segments" as const,
        points: [],
        state: reduceReferenceSelection(
          previous?.scope === scope ? previous.state : emptyReferenceSelection(),
          event,
        ),
        hits: [],
        hot: null,
        position: null,
      };
    });
  const hits = (values: readonly SnapReference[], position: Point2 | null = null) =>
    setStored((previous) =>
      previous?.scope === scope
        ? { ...previous, hits: values, hot: values[0] ?? null, position }
        : previous,
    );
  return {
    scope,
    mode: current?.mode ?? "segments",
    points: current?.points ?? [],
    setMode: (mode: "segments" | "points") =>
      setStored((previous) =>
        previous?.scope === scope ? { ...previous, mode, hits: [], hot: null } : previous,
      ),
    selected,
    state,
    selecting: state.draft !== null,
    hits: current?.hits ?? [],
    hot: current?.hot ?? null,
    position: current?.position ?? null,
    begin: () => send({ type: "begin" }),
    cancel: () => send({ type: "cancel" }),
    clear: () => send({ type: "clear" }),
    toggle: (r: SnapReference) => {
      if (current?.mode !== "points") {
        send({ type: "toggle", key: segmentKey(r) });
        return;
      }
      setStored((previous) =>
        previous?.scope === scope
          ? {
              ...previous,
              hits: [],
              hot: null,
              points: previous.points.some((p) => sameReference(p, r))
                ? previous.points.filter((p) => !sameReference(p, r))
                : [...previous.points, r],
            }
          : previous,
      );
    },
    hitsAt: hits,
    highlight: (hot: SnapReference | null) =>
      setStored((previous) => (previous?.scope === scope ? { ...previous, hot } : previous)),
    apply: () =>
      send({
        type: "apply",
        allowed: new Set(getLocalSnapSources(project).allSegments.map((s) => segmentKey(s.source))),
      }),
  };
}
export type ReferenceSelectionBinding = ReturnType<typeof useReferenceSelection>;
