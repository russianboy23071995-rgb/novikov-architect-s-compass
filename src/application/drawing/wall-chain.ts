import { prepareWallDrawing } from "./prepared-wall.ts";
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
  startCandidate: SnapCandidate | null;
};

export function beginWallChain(
  base: Project,
  origin: Point,
  candidate?: SnapCandidate | null,
): WallChain {
  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y))
    throw new Error("Ungültiger Ursprung.");
  const startCandidate =
    candidate?.sourceFeature === "t-axis"
      ? {
          ...candidate,
          worldPoint: { ...candidate.worldPoint },
        }
      : null;
  if (
    startCandidate &&
    (startCandidate.worldPoint.x !== origin.x ||
      startCandidate.worldPoint.y !== origin.y ||
      !base.storey.walls.some((w) => w.id === startCandidate.sourceEntityId))
  )
    throw new Error("T-Startziel ist nicht mehr korrekt.");
  return { base, preview: base, points: [{ ...origin }], wallIds: [], startCandidate };
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
    chain.preview.storey.wallTJunctions.some((r) => r.incoming.wallId === chain.wallIds.at(-1))
  )
    throw new Error(
      "Wandkette am T-Anschluss abschlie\u00dfen. Eine T-Nebenwand darf noch keinen eigenen Eckanschluss haben.",
    );
  const created = createDrawing(chain.preview, chain.preview, id, {
    kind: "wall",
    start: chain.points.at(-1)!,
    end: point,
    ...defaultDrawingWall,
  });
  const connectedStart =
    chain.wallIds.length === 0
      ? connectWallAtTAxis(created, id, 0, chain.points[0]!, chain.startCandidate)
      : created;
  const preview = connectWallAtTAxis(connectedStart, id, 1, point, candidate);
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

const preparedPreviews = new WeakMap<
  WallChain,
  { id: string; x: number; y: number; value: ReturnType<typeof prepareWallDrawing> }
>();

/** Derived model only: uses exactly the same validation as placing the next segment. */
export function previewWallChain(
  chain: WallChain,
  current: Project,
  point: Point,
  candidate?: SnapCandidate | null,
): Project {
  assertDrawingContext(chain.base, current);
  let id = "@wall-preview";
  const ids = new Set(
    [
      ...chain.preview.storey.walls,
      ...chain.preview.storey.windows,
      ...(chain.preview.storey.lines ?? []),
      ...chain.preview.storey.hatches,
    ].map((e) => e.id),
  );
  while (ids.has(id)) id += "-";
  if (
    !chain.wallIds.length &&
    chain.points.length === 1 &&
    !chain.startCandidate &&
    chain.preview === chain.base
  ) {
    const origin = chain.points[0]!;
    let cached = preparedPreviews.get(chain);
    if (!cached || cached.id !== id || cached.x !== origin.x || cached.y !== origin.y) {
      cached = { id, x: origin.x, y: origin.y, value: prepareWallDrawing(current, origin, id) };
      preparedPreviews.set(chain, cached);
    }
    return cached.value.evaluate(point, candidate).project;
  }
  return appendWallChain(chain, current, id, point, candidate).preview;
}
