import { prepareLinePreview } from "./prepared-line.ts";
import { prepareHatchContourPreview } from "./prepared-hatch.ts";
import { prepareWallEndpointPreview } from "./prepared-wall.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";
import { prepareWindowAxisPreview } from "./prepared-window.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import type { ElementTarget } from "../selection/target.ts";

/** Disposable Application preview capability; never a commit or a second model.
 * Prepare once per edit session. Adapters own dependency scope, not the renderer.
 */
export interface PreparedDirectEditPreview {
  /** Derived Project view for legacy 2D consumers; never a commit capability. */
  materialize?(current: Project, selection: ElementTarget | null, point: Point): Project;
  evaluate(
    current: Project,
    selection: ElementTarget | null,
    point: Point,
    candidate?: SnapCandidate | null,
  ): GeometryPreview;
}

/** null explicitly denotes an unmigrated legacy path, not an optimized capability.
 * Do not catch preparation errors here: invalid context must not become a capability.
 * New adapters require the A04 admission evidence before registration.
 */
export function prepareDirectEditPreview(session: EditSession): PreparedDirectEditPreview | null {
  return prepareCapability(session, false);
}

function prepareCapability(
  session: EditSession,
  projectView: boolean,
): PreparedDirectEditPreview | null {
  if (
    session.target.kind === "hatch" &&
    ["point", "edge", "offset", "insert"].includes(session.action)
  )
    return prepareHatchContourPreview(session);
  if (
    session.target.kind === "line" &&
    ["point", "edge", "offset", "insert"].includes(session.action)
  )
    return prepareLinePreview(session);
  if (session.target.kind === "window" && session.action === "axis")
    return prepareWindowAxisPreview(session);
  // Remaining registered adapters currently expose geometry patches only.
  if (projectView) return null;
  return prepareWallEndpointPreview(session);
}

const projectPreviews = new WeakMap<EditSession, PreparedDirectEditPreview | null>();
/** Application registry for legacy project-shaped consumers. No renderer type dispatch. */
export function preparedProjectPreview(
  session: EditSession,
  project: Project,
  selection: ElementTarget | null,
  point: Point,
): Project | null {
  if (!projectPreviews.has(session)) projectPreviews.set(session, prepareCapability(session, true));
  return projectPreviews.get(session)?.materialize?.(project, selection, point) ?? null;
}
