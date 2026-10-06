import { boundedWindowPosition } from "../../domain/elements/wall/window-range.ts";
import { precisionTarget } from "../input/precision.ts";
import { parseMetres } from "../../core/units/metres.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import { addWindow, wallLength } from "../../lib/bim/model.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { projectDirection } from "../../geometry/projections/direction.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import { isLayerVisible } from "../layers/visibility.ts";
import type { ToolInteraction } from "../tools/interaction.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";

export const defaultDrawingWindow = { width: 1.2, height: 1.35, sillHeight: 0.9 } as const;

export type WindowDimensions = { width: number; height: number; sillHeight: number };
export type WindowDimensionDraft = Readonly<Record<keyof WindowDimensions, string>>;
export function parseWindowDimensions(draft: WindowDimensionDraft): WindowDimensions {
  const width = parseMetres(draft.width),
    height = parseMetres(draft.height),
    sillHeight = parseMetres(draft.sillHeight);
  if (!Number.isFinite(width) || width <= 0)
    throw new Error("Breite muss größer als null sein (Meter).");
  if (!Number.isFinite(height) || height <= 0)
    throw new Error("Höhe muss größer als null sein (Meter).");
  if (!Number.isFinite(sillHeight) || sillHeight < 0)
    throw new Error("Brüstungshöhe muss mindestens null sein (Meter).");
  return { width, height, sillHeight };
}

function findWindowHost(project: Project, visibility: LayerVisibilityPolicy, point: Point) {
  const hosts = project.storey.walls
    .filter((w) => isLayerVisible(project, visibility, w.id))
    .flatMap((wall) => {
      const body = wallBody(wall);
      const direction = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
      const projected = projectDirection(point, body.start, direction)!;
      const length = wallLength(wall);
      const position =
        ((projected.x - body.start.x) * direction.x + (projected.y - body.start.y) * direction.y) /
        (length * length);
      const distance = Math.hypot(point.x - projected.x, point.y - projected.y);
      return distance <= wall.thickness / 2 + 1e-9
        ? [
            {
              wall,
              position,
              distance: Math.hypot(distance, Math.max(0, -position, position - 1) * length),
            },
          ]
        : [];
    })
    .sort((a, b) => a.distance - b.distance || a.wall.id.localeCompare(b.wall.id));
  return hosts[0];
}

export function windowPlacementHost(
  project: Project,
  visibility: LayerVisibilityPolicy,
  point: Point,
): string {
  const host = findWindowHost(project, visibility, point);
  if (!host) throw new Error("Eine sichtbare Wand anklicken.");
  return host.wall.id;
}

/** Host projection is shared by preview and commit; no mutation or UI state. */
export function placeWindow(
  base: Project,
  current: Project,
  visibility: LayerVisibilityPolicy,
  id: string,
  point: Point,
  dimensions: WindowDimensions = defaultDrawingWindow,
  hostId?: string,
): Project {
  if (base !== current || !visibility.isCurrent(current, visibility.context))
    throw new Error("Fensterplatzierung nicht mehr aktuell. Werkzeug erneut starten.");
  if (![point.x, point.y].every(Number.isFinite)) throw new Error("Ungültige Fensterposition.");
  const wall = hostId
    ? current.storey.walls.find((w) => w.id === hostId && isLayerVisible(current, visibility, w.id))
    : null;
  if (hostId && !wall) throw new Error("Gewählte Wand ist nicht mehr verfügbar.");
  const body = wall ? wallBody(wall) : null;
  const host =
    wall && body
      ? {
          wall,
          position:
            ((point.x - body.start.x) * (wall.end.x - wall.start.x) +
              (point.y - body.start.y) * (wall.end.y - wall.start.y)) /
            wallLength(wall) ** 2,
        }
      : findWindowHost(current, visibility, point);
  if (!host) throw new Error("Zum Platzieren eine sichtbare Wand anfahren.");
  if (visibility.context.hiddenLayerIds.includes(current.defaultLayerIds.window))
    throw new Error("Die Fensterebene ist ausgeblendet. Bitte zuerst einblenden.");
  return addWindow(current, {
    id,
    wallId: host.wall.id,
    position: boundedWindowPosition(current, host.wall, dimensions.width, host.position),
    ...dimensions,
  });
}

/** Unanchored placement: the shared snap engine runs, but no artificial movement
 * origin or polar input is pinned before the host is chosen. */
export function windowPlacementInteraction(
  base: Project,
  visibility: LayerVisibilityPolicy,
  id: string,
  current: () => { project: Project; visibility: LayerVisibilityPolicy },
  commit: (next: Project, id: string) => void,
  cancel: () => void,
  settings?: { draft: WindowDimensionDraft; currentDraft: () => WindowDimensionDraft },
  hostId?: string,
): ToolInteraction {
  const wall = hostId ? base.storey.walls.find((w) => w.id === hostId) : null;
  if (hostId && !wall) throw new Error("Gewählte Wand fehlt.");
  const body = wall ? wallBody(wall) : null;
  const direction = wall ? { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y } : null;
  const degrees = direction
    ? ((Math.atan2(direction.y, direction.x) * 180) / Math.PI + 360) % 360
    : null;
  const preview = (point: Point) => {
    const now = current();
    if (now.visibility !== visibility)
      throw new Error("Sichtbarkeit geändert. Werkzeug erneut starten.");
    if (settings && settings.currentDraft() !== settings.draft)
      throw new Error("Fenstermaße geändert. Aktuelle Vorschau verwenden.");
    const dimensions = settings ? parseWindowDimensions(settings.draft) : defaultDrawingWindow;
    return placeWindow(base, now.project, visibility, id, point, dimensions, hostId);
  };
  return {
    identity: {},
    origin: body?.start ?? { x: 0, y: 0 },
    input: body ? { axisLabel: "Fenstermitte ab Wandanfang", degrees } : null,
    click: "confirm",
    snapping: {
      origin:
        body && direction
          ? {
              entityId: "@window-placement-origin",
              feature: hostId!,
              point: body.start,
              directions: [direction],
            }
          : null,
      sources: (refs) => [...refs],
      resolve: (cursor, context) => {
        const host = wall ? { wall } : findWindowHost(base, visibility, cursor);
        if (!host) return querySnap(cursor, context);
        const body = wallBody(host.wall);
        return querySnap(cursor, {
          ...context,
          fixedAxis: {
            origin: body.start,
            direction: { x: body.end.x - body.start.x, y: body.end.y - body.start.y },
          },
          orthoOrigin: null,
          angleOrigin: null,
        });
      },
    },
    preview: (_angle, length, aim) => {
      if (!body || degrees === null) throw new Error("Fensterposition per Maus wählen.");
      const result = precisionTarget(body.start, aim, String(degrees), length);
      preview(result.point);
      return result;
    },
    previewProject: preview,
    validate: (point) => {
      preview(point);
    },
    commit: (point) => commit(preview(point), id),
    cancel,
  };
}
