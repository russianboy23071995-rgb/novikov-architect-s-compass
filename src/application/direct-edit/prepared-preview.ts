import { prepareWindowAxisPreview } from "./prepared-window.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import type { ElementTarget } from "../selection/target.ts";

/** Disposable Application preview capability; never a commit or a second model.
 * Prepare once per edit session. Adapters own dependency scope, not the renderer.
 */
export interface PreparedDirectEditPreview {
  evaluate(current: Project, selection: ElementTarget | null, point: Point): GeometryPreview;
}

/** null explicitly denotes an unmigrated legacy path, not an optimized capability.
 * Do not catch preparation errors here: invalid context must not become a capability.
 * New adapters require the A04 admission evidence before registration.
 */
export function prepareDirectEditPreview(session: EditSession): PreparedDirectEditPreview | null {
  if (session.target.kind === "window" && session.action === "axis")
    return prepareWindowAxisPreview(session);
  return null;
}
