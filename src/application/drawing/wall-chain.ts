import type { SnapCandidate } from "../../constraints/snapping/engine.ts";
import { connectWallAtTAxis } from "../walls/t-axis-snap.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { assertDrawingContext, createDrawing, defaultDrawingWall } from "./actions.ts";

/** Ephemeral transaction: only finishWallChain may supply the history commit. */
export type WallChain = {
  base: Project;
  preview: Project;
  points: Point[];
  wallIds: string[];
};

export function beginWallChain(base: Project, origin: Point): WallChain {
  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y))
    throw new Error("Ungültiger Ursprung.");
  return { base, preview: base, points: [{ ...origin }], wallIds: [] };
}

export function appendWallChain(
  chain: WallChain,
  current: Project,
  id: string,
  point: Point,
  candidate?: SnapCandidate | null,
): WallChain {
  assertDrawingContext(chain.base, current);
  if (
    chain.wallIds.length &&
    chain.preview.storey.wallTJunctions.some(
      (r) => r.incoming.wallId === chain.wallIds.at(-1) && r.incoming.endpoint === 1,
    )
  )
    throw new Error(
      "Wandkette am T-Anschluss abschlie\u00dfen. Ecke und T sind noch nicht kombinierbar.",
    );
  const created = createDrawing(chain.preview, chain.preview, id, {
    kind: "wall",
    start: chain.points.at(-1)!,
    end: point,
    ...defaultDrawingWall,
  });
  const preview = connectWallAtTAxis(created, id, 1, point, candidate);
  return {
    ...chain,
    preview,
    points: [...chain.points, { ...point }],
    wallIds: [...chain.wallIds, id],
  };
}

export function finishWallChain(chain: WallChain, current: Project): Project {
  assertDrawingContext(chain.base, current);
  if (!chain.wallIds.length) throw new Error("Mindestens einen Wandabschnitt zeichnen.");
  return chain.preview;
}
