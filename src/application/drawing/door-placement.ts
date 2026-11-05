import { boundedWindowPosition } from "../../domain/elements/wall/window-range.ts";
import { parseMetres } from "../../core/units/metres.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import { DOOR_DEFAULTS, type Door } from "../../domain/elements/door/model.ts";
import { DOOR_INSERT_DEFAULTS, type DoorInsert } from "../../domain/elements/window/insert.ts";
import { addDoor, defaultDoorLayerId } from "../doors/actions.ts";
import { newOpeningMark } from "../openings/marks.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import type { ToolInteraction } from "../tools/interaction.ts";
import { openingPlacementInteraction, resolveOpeningHost } from "./window-placement.ts";

export type DoorSettings = Pick<Door, "width" | "height" | "zOffset" | "hinge" | "opensTo">;
export type DoorSettingsDraft = Readonly<
  Record<"width" | "height" | "zOffset", string> &
    Pick<Door, "hinge" | "opensTo"> & {
      layerId?: string;
      /** The door element new doors get (FT1); null: opening only; absent: defaults. */
      insert?: DoorInsert | null;
    }
>;

export const defaultDoorDraft: DoorSettingsDraft = {
  width: String(DOOR_DEFAULTS.width),
  height: String(DOOR_DEFAULTS.height),
  zOffset: String(DOOR_DEFAULTS.zOffset),
  hinge: DOOR_DEFAULTS.hinge,
  opensTo: DOOR_DEFAULTS.opensTo,
};

export function parseDoorSettings(draft: DoorSettingsDraft): DoorSettings {
  const width = parseMetres(draft.width),
    height = parseMetres(draft.height),
    zOffset = parseMetres(draft.zOffset);
  if (!Number.isFinite(width) || width <= 0)
    throw new Error("Türbreite muss größer als null sein (Meter).");
  if (!Number.isFinite(height) || height <= 0)
    throw new Error("Türhöhe muss größer als null sein (Meter).");
  if (!Number.isFinite(zOffset)) throw new Error("Z-Versatz muss eine Zahl sein (Meter).");
  return { width, height, zOffset, hinge: draft.hinge, opensTo: draft.opensTo };
}

/** Same host projection as windows; the shared action validates the complete project. */
export function placeDoor(
  base: Project,
  current: Project,
  visibility: LayerVisibilityPolicy,
  id: string,
  point: Point,
  settings: DoorSettings = DOOR_DEFAULTS,
  hostId?: string,
  layerId: string = defaultDoorLayerId(current),
  insert: DoorInsert | null = DOOR_INSERT_DEFAULTS,
): Project {
  if (base !== current || !visibility.isCurrent(current, visibility.context))
    throw new Error("Türplatzierung nicht mehr aktuell. Werkzeug erneut starten.");
  if (![point.x, point.y].every(Number.isFinite)) throw new Error("Ungültige Türposition.");
  const host = resolveOpeningHost(current, visibility, point, hostId);
  if (!current.layers.some((layer) => layer.id === layerId))
    throw new Error("Die Türebene existiert nicht mehr.");
  if (visibility.context.hiddenLayerIds.includes(layerId))
    throw new Error("Die Türebene ist ausgeblendet. Bitte zuerst einblenden.");
  return addDoor(current, {
    id,
    layerId,
    wallId: host.wall.id,
    position: boundedWindowPosition(current, host.wall, settings.width, host.position, "Tür"),
    ...settings,
    mark: newOpeningMark(current, "door"),
    ...(insert ? { insert } : {}),
  });
}

export function doorPlacementInteraction(
  base: Project,
  visibility: LayerVisibilityPolicy,
  id: string,
  current: () => { project: Project; visibility: LayerVisibilityPolicy },
  commit: (next: Project, id: string) => void,
  cancel: () => void,
  settings: { draft: DoorSettingsDraft; currentDraft: () => DoorSettingsDraft },
  hostId?: string,
): ToolInteraction {
  return openingPlacementInteraction(
    base,
    visibility,
    id,
    current,
    (project, point) => {
      if (settings.currentDraft() !== settings.draft)
        throw new Error("Türmaße geändert. Aktuelle Vorschau verwenden.");
      return placeDoor(
        base,
        project,
        visibility,
        id,
        point,
        parseDoorSettings(settings.draft),
        hostId,
        settings.draft.layerId ?? defaultDoorLayerId(project),
        settings.draft.insert === undefined ? DOOR_INSERT_DEFAULTS : settings.draft.insert,
      );
    },
    commit,
    cancel,
    {
      axis: "Türmitte ab Wandanfang",
      mouse: "Türposition per Maus wählen.",
      origin: "@door-placement-origin",
    },
    hostId,
  );
}
