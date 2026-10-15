import { prepareEndpoint } from "./prepared-endpoint.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { editAtPointer, type EditSession } from "../../lib/bim/direct-edit.ts";
import { connectSnappedT } from "../walls/t-axis-snap.ts";
import type { PreparedDirectEditPreview } from "./prepared-preview.ts";

/** Shared axis-endpoint edits; body-corner and other gestures remain explicit legacy. */
export function prepareWallEndpointPreview(session: EditSession): PreparedDirectEditPreview | null {
  const s = storeyOf(session.base);
  const wall = s.walls.find((w) => w.id === session.target.id);
  if (
    session.target.kind !== "wall" ||
    session.action !== "point" ||
    (session.index !== 0 && session.index !== 1) ||
    !wall ||
    session.anchor.x !== (session.index === 0 ? wall.start.x : wall.end.x) ||
    session.anchor.y !== (session.index === 0 ? wall.start.y : wall.end.y)
  )
    return null;
  const source = session.base;
  const base = createProjectSnapshot(source);
  const prepared = prepareEndpoint(base, wall.id, session.index);
  const replacedIds = [...storeyOf(base).walls, ...storeyOf(base).windows].map((e) => e.id);
  const pinned = Object.freeze({
    ...session,
    base,
    target: Object.freeze({ ...session.target }),
    anchor: Object.freeze({ ...session.anchor }),
  });
  return Object.freeze({
    evaluate(current, selection, point, candidate) {
      if (
        current !== source ||
        selection?.id !== pinned.target.id ||
        selection.kind !== pinned.target.kind
      )
        throw Error("Bearbeitungskontext geändert.");
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
