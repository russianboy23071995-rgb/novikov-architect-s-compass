import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Point, Project } from "../../domain/project/schema.ts";
import {
  ROOF_WINDOW_DEFAULTS,
  roofWindowPlace,
  roofWindowRings,
  type RoofWindow,
} from "../../domain/elements/roof/window.ts";

type RoofWindowCreation = Pick<RoofWindow, "id" | "roofId" | "along" | "slope"> &
  Partial<Omit<RoofWindow, "id" | "roofId" | "along" | "slope">>;

/** The standard Fenster layer; roof windows use it unless a layer is chosen
 * (docs/DACHFLAECHENFENSTER.md). */
export function defaultRoofWindowLayerId(project: Project): string {
  return standardLayerId(project.layers, "window") ?? project.defaultLayerIds.window;
}

/** Shared creation for tool, text and future AI adapters; missing sizes take the tool start
 * values (78 × 118 cm, frame 6 cm). Full validation: it must fit its roof. */
export function addRoofWindow(project: Project, window: RoofWindowCreation): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      roofWindows: [
        ...(storeyOf(project).roofWindows ?? []),
        {
          ...ROOF_WINDOW_DEFAULTS,
          ...window,
          layerId: window.layerId ?? defaultRoofWindowLayerId(project),
        },
      ],
    }),
  });
}

/** A roof window centred on a plan point of the roof's top (the tool's click). */
export function addRoofWindowAt(
  project: Project,
  window: Omit<RoofWindowCreation, "along" | "slope">,
  point: Point,
): Project {
  const roof = storeyOf(project).roofs?.find((r) => r.id === window.roofId);
  if (!roof) throw new Error(`Unbekanntes Dach: ${window.roofId}`);
  return addRoofWindow(project, { ...window, ...roofWindowPlace(roof, point) });
}

/** One checked change of a roof window. */
export function updateRoofWindow(
  project: Project,
  windowId: string,
  changes: Partial<Omit<RoofWindow, "id">>,
): Project {
  const windows = storeyOf(project).roofWindows ?? [];
  if (!windows.some((w) => w.id === windowId))
    throw new Error(`Unbekanntes Dachflächenfenster: ${windowId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      roofWindows: windows.map((w) => (w.id === windowId ? { ...w, ...changes, id: w.id } : w)),
    }),
  });
}

/** Plan centre of a roof window's opening on the roof top (its move handle, D3). */
export function roofWindowCentre(project: Project, windowId: string): Point {
  const window = storeyOf(project).roofWindows?.find((w) => w.id === windowId);
  const roof = window && storeyOf(project).roofs?.find((r) => r.id === window.roofId);
  if (!window || !roof) throw new Error(`Unbekanntes Dachflächenfenster: ${windowId}`);
  const top = roofWindowRings(roof, window).top;
  return {
    x: top.reduce((n, p) => n + p.x, 0) / 4,
    y: top.reduce((n, p) => n + p.y, 0) / 4,
  };
}
