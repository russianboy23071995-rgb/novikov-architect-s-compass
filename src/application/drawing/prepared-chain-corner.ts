import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
/** Owned prepared scope for the second free right-angle segment. */
import { validateProject, type Point } from "../../lib/bim/model.ts";
import { appendWallChain, type WallChain } from "./wall-chain-actions.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
function freeze<T>(v: T): T {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    for (const x of Object.values(v)) freeze(x);
    Object.freeze(v);
  }
  return v;
}
export function prepareChainCorner(source: WallChain, id: string) {
  const chain = freeze({
    ...source,
    base: validateProject(source.base),
    preview: validateProject(source.preview),
    points: source.points.map((p) => ({ ...p })),
    wallIds: [...source.wallIds],
    startCandidate: source.startCandidate ? structuredClone(source.startCandidate) : null,
  });
  const p = chain.preview,
    s = storeyOf(p),
    first = s.walls.find((w) => w.id === chain.wallIds[0]);
  const supported =
    chain.wallIds.length === 1 &&
    chain.points.length === 2 &&
    !chain.startCandidate &&
    !!first &&
    pointsCompatible(first.start, chain.points[0]!) &&
    pointsCompatible(first.end, chain.points[1]!) &&
    !s.wallJoins.some((j) => j.first.wallId === first.id || j.second.wallId === first.id) &&
    !s.wallTJunctions.some((j) => j.hostWallId === first.id || j.incoming.wallId === first.id) &&
    !s.windows.some((w) => w.wallId === first.id);
  const foreign = s.walls.filter((w) => w !== first).flatMap((w) => [w.start, w.end]);
  const ids = new Set(
    [
      p,
      s,
      ...p.layers,
      ...p.assets,
      ...s.walls,
      ...s.windows,
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
    ].map((e) => e.id),
  );
  const local = freeze({
    ...replaceStorey(p, {
      ...s,
      walls: first ? [first] : [],
      windows: [],
      lines: [],
      hatches: [],
      references: [],
      wallJoins: [],
      wallTJunctions: [],
    }),
    assets: [],
  });
  const localChain = { ...chain, base: local, preview: local };
  const full = (point: Point, candidate?: SnapCandidate | null) =>
    appendWallChain(chain, chain.base, id, point, candidate).preview;
  return {
    evaluate(point: Point, candidate?: SnapCandidate | null) {
      const a = first?.start,
        b = first?.end;
      const right =
        !!a &&
        !!b &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        (b.x - a.x) * (point.x - b.x) + (b.y - a.y) * (point.y - b.y) === 0;
      if (
        !supported ||
        !right ||
        candidate ||
        ids.has(id.trim()) ||
        foreign.some((p) => pointsCompatible(p, b!) || pointsCompatible(p, point))
      )
        return { path: "full" as const, project: full(point, candidate) };
      const next = appendWallChain(localChain, local, id, point).preview;
      const walls = new Map(storeyOf(next).walls.map((w) => [w.id, w]));
      return {
        path: "local" as const,
        project: freeze({
          ...replaceStorey(p, {
            ...s,
            walls: [...s.walls.map((w) => walls.get(w.id) ?? w), storeyOf(next).walls.at(-1)!],
            wallJoins: [...s.wallJoins, ...storeyOf(next).wallJoins],
          }),
        }),
      };
    },
    confirm: full,
  };
}
