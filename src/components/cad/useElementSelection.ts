import { useCallback, useEffect, useMemo, useState } from "react";
import {
  eligibleSelection,
  selectTargets,
  singleTarget,
  type SelectionSet,
} from "@/application/selection/state";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
/** One selection owner for every viewport, tool and element type. */
export function useElementSelection(project: Project, visibility: LayerVisibilityPolicy) {
  const [requested, setRequested] = useState<SelectionSet>([{ kind: "wall", id: "wall-1" }]);
  const targets = useMemo(
    () => eligibleSelection(project, visibility, requested),
    [project, visibility, requested],
  );
  useEffect(() => {
    if (targets.length !== requested.length) setRequested(targets);
  }, [targets, requested]);
  const choose = useCallback(
    (next: SelectionSet, toggle = false) =>
      setRequested((current) =>
        selectTargets(
          eligibleSelection(project, visibility, current),
          eligibleSelection(project, visibility, next),
          toggle ? "toggle" : "replace",
        ),
      ),
    [project, visibility],
  );
  const setSelection = useCallback(
    (target: SelectionSet[number] | null) => choose(target ? [target] : []),
    [choose],
  );
  return { targets, selection: singleTarget(targets), choose, setSelection };
}
