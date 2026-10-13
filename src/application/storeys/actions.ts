import {
  resolveStoreyLevels,
  insertStorey,
  changeStoreyHeight,
} from "../../domain/storeys/heights.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
export type RenameStorey = { projectId: string; storeyId: string; name: string };
function assertContext(
  base: Project,
  current: Project,
  request: { projectId: string; storeyId: string },
) {
  if (
    base !== current ||
    current.id !== request.projectId ||
    !current.storeys.some((s) => s.id === request.storeyId)
  )
    throw new Error("Der Geschosskontext wurde geändert. Vorgang erneut beginnen.");
}
export function renameStorey(base: Project, current: Project, request: RenameStorey): Project {
  assertContext(base, current, request);
  const name = request.name.trim();
  if (!name || name.length > 120)
    throw new Error("Geschossname: Bitte 1 bis 120 Zeichen eingeben.");
  const target = current.storeys.find((s) => s.id === request.storeyId)!;
  if (target.name === name) return current;
  return validateProject({
    ...current,
    storeys: current.storeys.map((s) => (s === target ? { ...s, name } : s)),
  });
}
export type SetStoreyHeight = { projectId: string; storeyId: string; height: number };
export function setStoreyHeight(
  base: Project,
  current: Project,
  request: SetStoreyHeight,
): Project {
  assertContext(base, current, request);
  const storeys = changeStoreyHeight(
    current.storeys,
    current.groundStoreyId,
    request.storeyId,
    request.height,
  );
  if (storeys === current.storeys) return current;
  return validateProject({ ...current, storeys });
}
export type AddStorey = {
  projectId: string;
  storeyId: string;
  side: "above" | "below";
  id: string;
  height: number;
};
/** One insertion transaction; names follow floor position without renaming existing floors. */
export function addStorey(base: Project, current: Project, request: AddStorey): Project {
  assertContext(base, current, request);
  const anchor = current.storeys.findIndex((s) => s.id === request.storeyId);
  const ground = current.storeys.findIndex((s) => s.id === current.groundStoreyId);
  const index = anchor + (request.side === "above" ? 1 : 0);
  const number = index > ground ? index - ground : index - ground - 1;
  const stem = number > 0 ? `${number}. Obergeschoss` : `${number}. Kellergeschoss`;
  let name = stem,
    suffix = 2;
  while (current.storeys.some((s) => s.name === name)) name = `${stem} (${suffix++})`;
  const added = {
    id: request.id,
    name,
    height: request.height,
    walls: [],
    windows: [],
    lines: [],
    hatches: [],
    references: [],
    wallJoins: [],
    wallTJunctions: [],
  };
  const storeys = insertStorey(
    current.storeys,
    current.groundStoreyId,
    request.storeyId,
    request.side,
    added,
  );
  return validateProject({ ...current, storeys });
}
export type SetGroundDatum = { projectId: string; storeyId: string; elevation: number };
/** Height reference of local EG zero; does not translate local geometry. */
export function setGroundDatum(base: Project, current: Project, request: SetGroundDatum): Project {
  assertContext(base, current, request);
  if (request.storeyId !== current.groundStoreyId)
    throw new Error("Der EG-Bezug muss am Erdgeschoss gesetzt werden.");
  if (!Number.isFinite(request.elevation)) throw new Error("Endliche EG-Kote erforderlich.");
  if (request.elevation === current.groundDatum) return current;
  return validateProject({ ...current, groundDatum: request.elevation });
}

export type BuildingChange =
  | { kind: "insert"; request: AddStorey }
  | { kind: "height"; request: SetStoreyHeight }
  | { kind: "name"; request: RenameStorey }
  | { kind: "elevation"; request: SetGroundDatum };
export function changeBuilding(base: Project, current: Project, change: BuildingChange): Project {
  if (change.kind === "insert") return addStorey(base, current, change.request);
  if (change.kind === "height") return setStoreyHeight(base, current, change.request);
  if (change.kind === "name") return renameStorey(base, current, change.request);
  const request = change.request;
  assertContext(base, current, request);
  if (request.storeyId === current.groundStoreyId) return setGroundDatum(base, current, request);
  if (!Number.isFinite(request.elevation)) throw new Error("Endliche Höhenkote erforderlich.");
  const index = current.storeys.findIndex((s) => s.id === request.storeyId);
  const ground = current.storeys.findIndex((s) => s.id === current.groundStoreyId);
  const levels = resolveStoreyLevels(current.storeys, current.groundStoreyId, current.groundDatum);
  const above = index > ground;
  const reference = levels[index + (above ? -1 : 1)]!.elevation;
  if (reference === null) throw new Error("Zunächst die benachbarte Geschosshöhe festlegen.");
  return setStoreyHeight(base, current, {
    projectId: current.id,
    storeyId: current.storeys[index - (above ? 1 : 0)]!.id,
    height: above ? request.elevation - reference : reference - request.elevation,
  });
}
