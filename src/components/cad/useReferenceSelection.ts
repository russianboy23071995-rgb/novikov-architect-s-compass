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
    selected,
    state,
    selecting: state.draft !== null,
    hits: current?.hits ?? [],
    hot: current?.hot ?? null,
    position: current?.position ?? null,
    begin: () => send({ type: "begin" }),
    cancel: () => send({ type: "cancel" }),
    clear: () => send({ type: "clear" }),
    toggle: (r: SnapReference) => send({ type: "toggle", key: segmentKey(r) }),
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
