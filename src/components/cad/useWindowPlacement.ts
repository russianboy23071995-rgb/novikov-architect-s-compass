import { useEffect, useMemo, useRef, useState } from "react";
import {
  windowPlacementInteraction,
  windowPlacementHost,
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
  dimensions: WindowDimensionDraft,
  setDimensions: (value: WindowDimensionDraft) => void,
) {
  const [precision, setPrecision] = useState(false);
  const [host, setHost] = useState<{
    id: string;
    project: Project;
    visibility: LayerVisibilityPolicy;
  } | null>(null);
  const activeHost =
    active && host?.project === project && host.visibility === visibility ? host : null;
  useEffect(() => {
    if (host && !activeHost) setHost(null);
  }, [host, activeHost]);
  let error = "";
  try {
    parseWindowDimensions(dimensions);
  } catch (reason) {
    error = reason instanceof Error ? reason.message : "Ungültige Maße.";
  }
  const latest = useRef({
    project,
    visibility,
    commit,
    cancel,
    active,
    dimensions,
    precision,
    host: activeHost,
  });
  latest.current = {
    project,
    visibility,
    commit,
    cancel,
    active,
    dimensions,
    precision,
    host: activeHost,
  };
  const adapter = useMemo(() => {
    if (!active) return null;
    const current = () => {
      const now = latest.current;
      if (!now.active || now.precision !== precision || now.host !== activeHost)
        throw new Error("Fensterplatzierung nicht mehr aktiv. Aktuelle Vorschau verwenden.");
      return now;
    };
    const tool = windowPlacementInteraction(
      project,
      visibility,
      `window-${crypto.randomUUID()}`,
      current,
      (next, id) => latest.current.commit(next, id),
      () => latest.current.cancel(),
      { draft: dimensions, currentDraft: () => latest.current.dimensions },
      precision ? activeHost?.id : undefined,
    );
    if (precision && !activeHost) {
      const pickHost = (point: Parameters<typeof tool.validate>[0]) => {
        const now = current();
        if (
          now.project !== project ||
          now.visibility !== visibility ||
          now.dimensions !== dimensions
        )
          throw new Error("Kontext geändert. Wand erneut wählen.");
        parseWindowDimensions(dimensions);
        return windowPlacementHost(project, visibility, point);
      };
      return {
        ...tool,
        validate: (point: Parameters<typeof tool.validate>[0]) => {
          pickHost(point);
        },
        commit: (point: Parameters<typeof tool.validate>[0]) =>
          setHost({ id: pickHost(point), project, visibility }),
      };
    }
    return tool;
  }, [active, project, visibility, dimensions, precision, activeHost]);
  return {
    adapter,
    dimensions,
    setDimensions,
    error,
    precision,
    pickingHost: precision && !activeHost,
    setPrecision: (value: boolean) => {
      setHost(null);
      setPrecision(value);
    },
  };
}
