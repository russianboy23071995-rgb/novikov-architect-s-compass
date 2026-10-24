import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import type { ToolInteraction } from "@/application/tools/interaction";

type Point = Parameters<ToolInteraction["validate"]>[0];
type Current = () => { project: Project; visibility: LayerVisibilityPolicy };

/** One placement lifecycle for every wall opening (window, door). The kind supplies only its
 * interaction, draft parser and host lookup; geometry, snapping, validation and history stay
 * shared.
 */
export type OpeningPlacementKind<D> = {
  idPrefix: string;
  inactive: string;
  parse: (draft: D) => unknown;
  host: (project: Project, visibility: LayerVisibilityPolicy, point: Point) => string;
  interaction: (
    base: Project,
    visibility: LayerVisibilityPolicy,
    id: string,
    current: Current,
    commit: (next: Project, id: string) => void,
    cancel: () => void,
    settings: { draft: D; currentDraft: () => D },
    hostId?: string,
  ) => ToolInteraction;
};

export function useOpeningPlacement<D>(
  kind: OpeningPlacementKind<D>,
  active: boolean,
  project: Project,
  visibility: LayerVisibilityPolicy,
  commit: (next: Project, id: string) => void,
  cancel: () => void,
  dimensions: D,
  setDimensions: (value: D) => void,
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
    kind.parse(dimensions);
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
        throw new Error(kind.inactive);
      return now;
    };
    const tool = kind.interaction(
      project,
      visibility,
      `${kind.idPrefix}-${crypto.randomUUID()}`,
      current,
      (next, id) => latest.current.commit(next, id),
      () => latest.current.cancel(),
      { draft: dimensions, currentDraft: () => latest.current.dimensions },
      precision ? activeHost?.id : undefined,
    );
    if (precision && !activeHost) {
      const pickHost = (point: Point) => {
        const now = current();
        if (
          now.project !== project ||
          now.visibility !== visibility ||
          now.dimensions !== dimensions
        )
          throw new Error("Kontext geändert. Wand erneut wählen.");
        kind.parse(dimensions);
        return kind.host(project, visibility, point);
      };
      return {
        ...tool,
        validate: (point: Point) => {
          pickHost(point);
        },
        commit: (point: Point) => setHost({ id: pickHost(point), project, visibility }),
      };
    }
    return tool;
  }, [kind, active, project, visibility, dimensions, precision, activeHost]);
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
