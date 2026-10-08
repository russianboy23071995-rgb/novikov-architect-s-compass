import { defaultLineAppearance } from "@/lib/bim/lines";
import {
  defaultDrawingWindow,
  type WindowDimensionDraft,
} from "@/application/drawing/window-placement";
import { useMemo, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { HatchDefaults, LineDefaults, ToolDefaults } from "@/application/tools/pickup";
import { defaultHatchFill } from "@/application/drawing/actions";
import { defaultHatchAppearance } from "@/domain/elements/hatch/model";

/** Session defaults are not model state and never enter model history. */
export function useToolDefaults(project: Project) {
  const [lineState, setLineState] = useState<{ projectId: string; values: LineDefaults } | null>(
    null,
  );
  const line =
    lineState?.projectId === project.id
      ? lineState.values
      : { ...defaultLineAppearance, layerId: project.defaultLayerIds.line };
  const lineDefaults = {
    ...line,
    layerId: project.layers.some((l) => l.id === line.layerId)
      ? line.layerId
      : project.defaultLayerIds.line,
  };
  const [windowState, setWindowState] = useState<{
    projectId: string;
    values: WindowDimensionDraft;
  } | null>(null);
  const windowDefaults = useMemo(() => {
    const values =
      windowState?.projectId === project.id
        ? windowState.values
        : {
            width: String(defaultDrawingWindow.width),
            height: String(defaultDrawingWindow.height),
            sillHeight: String(defaultDrawingWindow.sillHeight),
            layerId: project.defaultLayerIds.window,
          };
    return {
      ...values,
      layerId: project.layers.some((l) => l.id === values.layerId)
        ? values.layerId!
        : project.defaultLayerIds.window,
    };
  }, [project, windowState]);
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
    line: lineDefaults,
    setLine(values: LineDefaults) {
      setLineState({ projectId: project.id, values });
    },
    window: windowDefaults,
    setWindow(values: WindowDimensionDraft) {
      setWindowState({ projectId: project.id, values });
    },
    setHatch(values: HatchDefaults) {
      setState({ projectId: project.id, hatch: values });
    },
    apply(defaults: ToolDefaults) {
      if (defaults.tool === "hatch") setState({ projectId: project.id, hatch: defaults.values });
      else if (defaults.tool === "line")
        setLineState({ projectId: project.id, values: defaults.values });
      else
        setWindowState({
          projectId: project.id,
          values: {
            width: String(defaults.values.width),
            height: String(defaults.values.height),
            sillHeight: String(defaults.values.sillHeight),
            layerId: defaults.values.layerId,
          },
        });
    },
  };
}
