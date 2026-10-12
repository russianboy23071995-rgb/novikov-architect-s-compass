import { prepareWallDrawing } from "./prepared-wall.ts";
import { prepareChainCorner } from "./prepared-chain-corner.ts";
import { appendWallChain, type WallChain } from "./wall-chain-actions.ts";
import { assertDrawingContext } from "./actions.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";
export {
  beginWallChain,
  appendWallChain,
  finishWallChain,
  type WallChain,
} from "./wall-chain-actions.ts";

const preparedPreviews = new WeakMap<
  WallChain,
  {
    id: string;
    key: string;
    preview: Project;
    value: ReturnType<typeof prepareWallDrawing> | ReturnType<typeof prepareChainCorner>;
  }
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
    !chain.startCandidate &&
    ((chain.wallIds.length === 0 && chain.points.length === 1 && chain.preview === chain.base) ||
      (chain.wallIds.length === 1 && chain.points.length === 2))
  ) {
    const origin = chain.points[0]!;
    const key = JSON.stringify([chain.points, chain.wallIds, chain.defaults]);
    let cached = preparedPreviews.get(chain);
    if (!cached || cached.id !== id || cached.key !== key || cached.preview !== chain.preview) {
      cached = {
        id,
        key,
        preview: chain.preview,
        value:
          chain.wallIds.length === 0
            ? prepareWallDrawing(current, origin, id, chain.defaults)
            : prepareChainCorner(chain, id),
      };
      preparedPreviews.set(chain, cached);
    }
    return cached.value.evaluate(point, candidate).project;
  }
  return appendWallChain(chain, current, id, point, candidate).preview;
}
