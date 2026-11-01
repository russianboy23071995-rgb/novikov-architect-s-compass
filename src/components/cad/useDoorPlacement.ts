import {
  doorPlacementInteraction,
  parseDoorSettings,
  type DoorSettingsDraft,
} from "@/application/drawing/door-placement";
import { windowPlacementHost } from "@/application/drawing/window-placement";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import { useOpeningPlacement, type OpeningPlacementKind } from "./useOpeningPlacement";

const doorKind: OpeningPlacementKind<DoorSettingsDraft> = {
  idPrefix: "door",
  inactive: "Türplatzierung nicht mehr aktiv. Aktuelle Vorschau verwenden.",
  parse: parseDoorSettings,
  host: windowPlacementHost,
  interaction: doorPlacementInteraction,
  // R1: the second click chooses the side the door opens to.
  side: { applies: () => true, with: (draft, opensTo) => ({ ...draft, opensTo }) },
};

/** Same lifecycle as the window tool; only the door action and settings differ. */
export function useDoorPlacement(
  active: boolean,
  project: Project,
  visibility: LayerVisibilityPolicy,
  commit: (next: Project, id: string) => void,
  cancel: () => void,
  settings: DoorSettingsDraft,
  setSettings: (value: DoorSettingsDraft) => void,
) {
  return useOpeningPlacement(
    doorKind,
    active,
    project,
    visibility,
    commit,
    cancel,
    settings,
    setSettings,
  );
}
