import { prepareEndpoint } from "./prepared-endpoint.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { editAtPointerSnapshot, type EditSession } from "./session.ts";
import { automaticTHost, connectSnappedT, tAxisEndpoint } from "../walls/t-axis-snap.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { PreparedDirectEditPreview } from "./prepared-preview.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import { wallTransitionPatch } from "./wall-transition-patch.ts";

/** Shared axis/body endpoint gestures and constrained stretching retain their original anchor. */
export function prepareWallEndpointPreview(session: EditSession): PreparedDirectEditPreview | null {
  const s = storeyOf(session.base);
  const wall = s.walls.find((w) => w.id === session.target.id);
  if (
    session.target.kind !== "wall" ||
    (session.action !== "point" && session.action !== "stretch") ||
    (session.index !== 0 && session.index !== 1) ||
    !wall
  )
    return null;
  const source = session.base;
  const base = createProjectSnapshot(source);
  const prepared = prepareEndpoint(base, wall.id, session.index, {
    anchor: session.anchor,
    action: session.action,
  });
  // One disposable result per capability, never a global model/ID cache.
  let lastT:
    | {
        host: string | null;
        x: number;
        y: number;
        snapX: number;
        snapY: number;
        patch: GeometryPreview;
      }
    | undefined;
  const pinned = Object.freeze({
    ...session,
    base,
    target: Object.freeze({ ...session.target }),
    anchor: Object.freeze({ ...session.anchor }),
  });
  function assertContext(current: typeof source, selection: ElementTarget | null) {
    if (
      current !== source ||
      selection?.id !== pinned.target.id ||
      selection.kind !== pinned.target.kind
    )
      throw Error("Bearbeitungskontext geändert.");
  }
  return Object.freeze({
    materialize(current, selection, point) {
      assertContext(current, selection);
      return prepared.evaluate(point).project;
    },
    evaluate(current, selection, point, candidate) {
      assertContext(current, selection);
      // New snapped or automatic (exact axis contact) relations may reach beyond the prepared
      // dependency component.
      const snapped = candidate?.sourceFeature === "t-axis" ? candidate : null;
      const host = snapped
        ? (snapped.sourceEntityId ?? null)
        : tAxisEndpoint(session)
          ? automaticTHost(s.walls, wall.id, point, session.index === 0 ? wall.end : wall.start)
          : null;
      if (snapped || host) {
        const snap = snapped?.worldPoint ?? point;
        if (
          lastT &&
          lastT.host === host &&
          lastT.x === point.x &&
          lastT.y === point.y &&
          lastT.snapX === snap.x &&
          lastT.snapY === snap.y
        )
          return lastT.patch;
        // A failed/changed target must not retain an older successful result.
        lastT = undefined;
        const moved = editAtPointerSnapshot(pinned, base, point);
        const next = connectSnappedT(pinned, moved, point, candidate);
        // Use the established ownership boundary: callers cannot mutate a cached
        // result or freeze their own project to acquire validation provenance.
        const patch = wallTransitionPatch(base, createProjectSnapshot(next), wall.id);
        lastT = {
          host,
          x: point.x,
          y: point.y,
          snapX: snap.x,
          snapY: snap.y,
          patch,
        };
        return patch;
      }
      lastT = undefined;
      return prepared.evaluateGeometry(point).patch;
    },
  } satisfies PreparedDirectEditPreview);
}
