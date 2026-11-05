import type { Point, Project } from "../../domain/project/schema.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { columnOutline } from "../../domain/elements/column/model.ts";
import { getLocalSnapSources } from "../snapping/local-sources.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";

/**
 * Transparency trace (Transparenzpause, docs/TRANSPARENZPAUSE.md, S4): one other storey shown
 * faintly under the working storey, so walls can be drawn reliably above each other. Session
 * state only, never part of the project file.
 */
export type Tracing = {
  enabled: boolean;
  /** The traced storey; null: none chosen (no other storey). */
  storeyId: string | null;
  /** Opacity of the trace, 0,1 … 0,8. */
  opacity: number;
  color: string;
  /** Snap to the walls and columns of the trace. */
  snap: boolean;
};

export const TRACING_COLORS = [
  ["#64748b", "Grau"],
  ["#2563eb", "Blau"],
  ["#dc2626", "Rot"],
  ["#16a34a", "Grün"],
] as const;

/** The storey below the working storey, else the one above, else none. */
export function defaultTracingStorey(project: Project): string | null {
  const working = project.workingStoreyId ?? project.groundStoreyId;
  const index = project.storeys.findIndex((s) => s.id === working);
  return project.storeys[index - 1]?.id ?? project.storeys[index + 1]?.id ?? null;
}

export function tracingDefaults(project: Project): Tracing {
  return {
    enabled: false,
    storeyId: defaultTracingStorey(project),
    opacity: 0.35,
    color: TRACING_COLORS[0][0],
    snap: true,
  };
}

/** Outlines of the walls and columns of the traced storey (user decision: walls and columns). */
export function tracingOutlines(
  project: Project,
  storeyId: string,
): { walls: Point[][]; columns: Point[][] } {
  const storey = project.storeys.find((s) => s.id === storeyId);
  if (!storey) return { walls: [], columns: [] };
  return {
    walls: storey.walls.map((wall) => wallBody(wall).corners),
    columns: (storey.columns ?? []).map((column) => columnOutline(column)),
  };
}

/**
 * Snap sources of the trace: the traced storey seen as working storey with its walls and columns
 * only, so the snap engine offers their points, edges and axes. The ids name the snappable
 * elements of the trace (they belong to another storey than the visibility policy checks).
 */
export function tracingSnap(project: Project, storeyId: string) {
  const storey = project.storeys.find((s) => s.id === storeyId);
  if (!storey) return null;
  const traced: Project = {
    ...project,
    workingStoreyId: storeyId,
    storeys: project.storeys.map((s) =>
      s.id === storeyId
        ? {
            ...s,
            windows: [],
            doors: [],
            hatches: [],
            lines: [],
            slabs: [],
            roofs: [],
            rooms: [],
          }
        : s,
    ),
  };
  return {
    sources: getLocalSnapSources(traced),
    ids: new Set([...storey.walls.map((w) => w.id), ...(storey.columns ?? []).map((c) => c.id)]),
  };
}

/**
 * Candidate filter while the trace snaps: a wall of the trace is never a T-join host. Its axis
 * would otherwise offer the perpendicular foot of the cursor, which wins just before the wall end
 * and leaves a new wall a millimetre short (2,9988 m instead of 3 m).
 */
export function acceptsTraceCandidate(ids: ReadonlySet<string>) {
  return (candidate: SnapCandidate) =>
    !(
      candidate.sourceFeature === "t-axis" &&
      candidate.sourceEntityId !== null &&
      ids.has(candidate.sourceEntityId)
    );
}
