import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import type { ToolInteraction } from "@/application/tools/interaction";
import { openingSideInteraction } from "@/application/drawing/window-placement";
import { storeyOf } from "@/domain/storeys/access";

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
  /**
   * Second click for the side of the wall (docs/FENSTER_TUEREN.md, R1): whether the draft needs
   * it (a plain window opening has no side) and the draft for a chosen side.
   */
  side?: {
    applies: (draft: D) => boolean;
    with: (draft: D, side: "left" | "right") => D;
  };
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
  // Position of the first click while the side is chosen; void when the context moves on.
  const [anchor, setAnchor] = useState<{
    point: Point;
    hostId: string;
    id: string;
    project: Project;
    visibility: LayerVisibilityPolicy;
    dimensions: D;
  } | null>(null);
  const activeAnchor =
    active &&
    anchor?.project === project &&
    anchor.visibility === visibility &&
    anchor.dimensions === dimensions
      ? anchor
      : null;
  useEffect(() => {
    if (anchor && !activeAnchor) setAnchor(null);
  }, [anchor, activeAnchor]);
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
    if (activeAnchor && kind.side) {
      const side = kind.side;
      const wall = storeyOf(project).walls.find((w) => w.id === activeAnchor.hostId);
      if (wall)
        return openingSideInteraction(
          activeAnchor.id,
          wall,
          activeAnchor.point,
          (chosen) => {
            const draft = side.with(dimensions, chosen);
            const placed = kind.interaction(
              project,
              visibility,
              activeAnchor.id,
              current,
              () => undefined,
              () => undefined,
              { draft, currentDraft: () => draft },
              activeAnchor.hostId,
            ).previewProject!(activeAnchor.point);
            return placed;
          },
          (next, id) => {
            setAnchor(null);
            latest.current.commit(next, id);
          },
          () => {
            setAnchor(null);
            latest.current.cancel();
          },
        );
    }
    const id = `${kind.idPrefix}-${crypto.randomUUID()}`;
    const tool = kind.interaction(
      project,
      visibility,
      id,
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
    // First click with a side to choose: keep the position, the second click places.
    if (kind.side?.applies(dimensions))
      return {
        ...tool,
        commit: (point: Point) => {
          tool.validate(point);
          setAnchor({
            point,
            hostId: activeHost?.id ?? kind.host(project, visibility, point),
            id,
            project,
            visibility,
            dimensions,
          });
        },
      };
    return tool;
  }, [kind, active, project, visibility, dimensions, precision, activeHost, activeAnchor]);
  return {
    adapter,
    dimensions,
    setDimensions,
    error,
    precision,
    pickingHost: precision && !activeHost,
    /** The position is set; the pointer now chooses the side. */
    choosingSide: !!activeAnchor,
    setPrecision: (value: boolean) => {
      setHost(null);
      setPrecision(value);
    },
  };
}
