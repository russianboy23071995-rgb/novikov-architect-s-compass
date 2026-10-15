import { prepareEndpoint } from "./prepared-endpoint.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { editAtPointer, type EditSession } from "../../lib/bim/direct-edit.ts";
import { connectSnappedT } from "../walls/t-axis-snap.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { PreparedDirectEditPreview } from "./prepared-preview.ts";

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
  const replacedIds = [...storeyOf(base).walls, ...storeyOf(base).windows].map((e) => e.id);
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
      // New snapped relations may reach beyond the prepared dependency component.
      if (candidate?.sourceFeature === "t-axis") {
        const next = connectSnappedT(pinned, editAtPointer(pinned, base, point), point, candidate);
        const level = storeyOf(next);
        const geometry = { storey: level, assets: [] };

        return {
          geometry,
          replacedIds,
          storeyPatches: [{ storeyId: s.id, geometry, replacedIds }],
        };
      }
      return prepared.evaluateGeometry(point).patch;
    },
  } satisfies PreparedDirectEditPreview);
}
