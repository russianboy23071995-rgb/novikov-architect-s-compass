import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { HatchDefaults, ToolDefaults } from "@/application/tools/pickup";
import { defaultHatchFill } from "@/application/drawing/actions";
import { defaultHatchAppearance } from "@/domain/elements/hatch/model";

/** Session defaults are not model state and never enter model history. */
export function useToolDefaults(project: Project) {
  const [state, setState] = useState<{ projectId: string; hatch: HatchDefaults } | null>(null);
  const hatch =
    state?.projectId === project.id
      ? state.hatch
      : {
          fill: defaultHatchFill,
          ...defaultHatchAppearance,
          layerId: project.defaultLayerIds.line,
        };
  const current = {
    ...hatch,
    layerId: project.layers.some((l) => l.id === hatch.layerId)
      ? hatch.layerId
      : project.defaultLayerIds.line,
  };
  return {
    hatch: current,
    setHatch(values: HatchDefaults) {
      setState({ projectId: project.id, hatch: values });
    },
    apply(defaults: ToolDefaults) {
      setState({ projectId: project.id, hatch: defaults.values });
    },
  };
}
