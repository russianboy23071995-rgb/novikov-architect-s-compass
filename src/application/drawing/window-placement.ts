import type { Project, Point } from "../../domain/project/schema.ts";
import { addWindow, wallLength } from "../../lib/bim/model.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { projectDirection } from "../../geometry/projections/direction.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import { isLayerVisible } from "../layers/visibility.ts";
import type { ToolInteraction } from "../tools/interaction.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";

export const defaultDrawingWindow = { width: 1.2, height: 1.35, sillHeight: 0.9 } as const;

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
      return position >= 0 && position <= 1 && distance <= wall.thickness / 2 + 1e-9
        ? [{ wall, position, distance }]
        : [];
    })
    .sort((a, b) => a.distance - b.distance || a.wall.id.localeCompare(b.wall.id));
  return hosts[0];
}

/** Host projection is shared by preview and commit; no mutation or UI state. */
export function placeWindow(
  base: Project,
  current: Project,
  visibility: LayerVisibilityPolicy,
  id: string,
  point: Point,
): Project {
  if (base !== current || !visibility.isCurrent(current, visibility.context))
    throw new Error("Fensterplatzierung nicht mehr aktuell. Werkzeug erneut starten.");
  if (![point.x, point.y].every(Number.isFinite)) throw new Error("Ungültige Fensterposition.");
  const host = findWindowHost(current, visibility, point);
  if (!host) throw new Error("Zum Platzieren eine sichtbare Wand anfahren.");
  if (visibility.context.hiddenLayerIds.includes(current.defaultLayerIds.window))
    throw new Error("Die Fensterebene ist ausgeblendet. Bitte zuerst einblenden.");
  return addWindow(current, {
    id,
    wallId: host.wall.id,
    position: host.position,
    ...defaultDrawingWindow,
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
): ToolInteraction {
  const preview = (point: Point) => {
    const now = current();
    if (now.visibility !== visibility)
      throw new Error("Sichtbarkeit geändert. Werkzeug erneut starten.");
    return placeWindow(base, now.project, visibility, id, point);
  };
  return {
    identity: {},
    origin: { x: 0, y: 0 },
    input: null,
    click: "confirm",
    snapping: {
      origin: null,
      sources: (refs) => [...refs],
      resolve: (cursor, context) => {
        const host = findWindowHost(base, visibility, cursor);
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
    preview: () => {
      throw new Error("Fensterposition per Maus wählen.");
    },
    previewProject: preview,
    validate: (point) => {
      preview(point);
    },
    commit: (point) => commit(preview(point), id),
    cancel,
  };
}
