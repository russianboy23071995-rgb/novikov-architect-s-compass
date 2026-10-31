import { defaultDoorDraft, type DoorSettingsDraft } from "@/application/drawing/door-placement";
import { defaultDoorLayerId } from "@/application/doors/actions";
import { defaultSlabLayerId } from "@/application/slabs/actions";
import { SLAB_DEFAULTS } from "@/domain/elements/slab/model";
import { defaultRoofLayerId } from "@/application/roofs/actions";
import { ROOF_DEFAULTS, type Roof } from "@/domain/elements/roof/model";
import { defaultRoomLayerId } from "@/application/rooms/actions";
import { defaultColumnLayerId } from "@/application/columns/actions";
import { defaultDimensionLayerId } from "@/application/dimensions/actions";
import type { DimensionDefaults } from "./DimensionToolFields";
import { columnToolDefaults, type ColumnDefaults } from "@/application/columns/defaults";
import { defaultLineAppearance } from "@/lib/bim/lines";
import { useHatchPatterns } from "./useHatchPatterns";
import {
  defaultDrawingWindow,
  type WindowDimensionDraft,
} from "@/application/drawing/window-placement";
import { useMemo, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type {
  HatchDefaults,
  LineDefaults,
  WallDefaults,
  ToolDefaults,
} from "@/application/tools/pickup";
import { defaultHatchFill } from "@/application/drawing/actions";
import { defaultHatchAppearance } from "@/domain/elements/hatch/model";
import { defaultHeightLines, type HeightLine } from "@/domain/elements/room/height-line";

/** Slab tool values in metres; the session draft never enters model history. */
export type SlabDefaults = { thickness: number; topOffset: number; layerId: string };

/** Roof tool values; the rise side is chosen per roof by click (docs/ROOF_ELEMENT.md, D3). */
export type RoofDefaults = Pick<
  Roof,
  "pitch" | "thickness" | "referenceHeight" | "eaveCut" | "topCut" | "layerId"
>;

/** Room tool values (docs/ROOM_ELEMENT.md, R2); the floor build-up is optional. */
export type RoomDefaults = {
  name: string;
  floorBuildUpEnabled: boolean;
  floorBuildUp: number;
  /** Height lines new rooms get (R3); the defaults 1,00/2,00 m are not stored in the room. */
  heightLines: HeightLine[];
  layerId: string;
};

/** Session defaults are not model state and never enter model history. */
export function useToolDefaults(project: Project) {
  const library = useHatchPatterns();
  const [wallState, setWallState] = useState<{ projectId: string; values: WallDefaults } | null>(
    null,
  );
  const wall =
    wallState?.projectId === project.id
      ? wallState.values
      : {
          thickness: 0.36,
          height: 2.8,
          bodyOffset: 0.18,
          layerId: project.defaultLayerIds.wall,
          // New walls are Neubau by default (user decision 31.10.2026, docs/BAUZUSTAND.md).
          renovation: "new" as const,
        };
  const wallDefaults = {
    ...wall,
    layerId: project.layers.some((l) => l.id === wall.layerId)
      ? wall.layerId
      : project.defaultLayerIds.wall,
  };
  const [lineState, setLineState] = useState<{ projectId: string; values: LineDefaults } | null>(
    null,
  );
  const line =
    lineState?.projectId === project.id
      ? lineState.values
      : { ...defaultLineAppearance, layerId: project.defaultLayerIds.line };
  const lineDefaults = {
    ...line,
    layerId: project.layers.some((l) => l.id === line.layerId)
      ? line.layerId
      : project.defaultLayerIds.line,
  };
  const [windowState, setWindowState] = useState<{
    projectId: string;
    values: WindowDimensionDraft;
  } | null>(null);
  const windowDefaults = useMemo(() => {
    const values =
      windowState?.projectId === project.id
        ? windowState.values
        : {
            width: String(defaultDrawingWindow.width),
            height: String(defaultDrawingWindow.height),
            sillHeight: String(defaultDrawingWindow.sillHeight),
            layerId: project.defaultLayerIds.window,
          };
    return {
      ...values,
      layerId: project.layers.some((l) => l.id === values.layerId)
        ? values.layerId!
        : project.defaultLayerIds.window,
    };
  }, [project, windowState]);
  const [doorState, setDoorState] = useState<{
    projectId: string;
    values: DoorSettingsDraft;
  } | null>(null);
  const doorDefaults = useMemo(() => {
    const values = doorState?.projectId === project.id ? doorState.values : defaultDoorDraft;
    return {
      ...values,
      layerId:
        values.layerId && project.layers.some((l) => l.id === values.layerId)
          ? values.layerId
          : defaultDoorLayerId(project),
    };
  }, [project, doorState]);
  const [slabState, setSlabState] = useState<{ projectId: string; values: SlabDefaults } | null>(
    null,
  );
  const slabValues =
    slabState?.projectId === project.id
      ? slabState.values
      : { ...SLAB_DEFAULTS, layerId: defaultSlabLayerId(project) };
  const slabDefaults = {
    ...slabValues,
    layerId: project.layers.some((l) => l.id === slabValues.layerId)
      ? slabValues.layerId
      : defaultSlabLayerId(project),
  };
  const [columnState, setColumnState] = useState<{
    projectId: string;
    values: ColumnDefaults;
  } | null>(null);
  const columnValues =
    columnState?.projectId === project.id
      ? columnState.values
      : columnToolDefaults(defaultColumnLayerId(project));
  const columnDefaults = {
    ...columnValues,
    layerId: project.layers.some((l) => l.id === columnValues.layerId)
      ? columnValues.layerId
      : defaultColumnLayerId(project),
  };
  const [dimensionState, setDimensionState] = useState<{
    projectId: string;
    values: DimensionDefaults;
  } | null>(null);
  const dimensionValues: DimensionDefaults =
    dimensionState?.projectId === project.id
      ? dimensionState.values
      : { orientation: "horizontal", layerId: defaultDimensionLayerId(project) };
  const dimensionDefaults = {
    ...dimensionValues,
    layerId: project.layers.some((l) => l.id === dimensionValues.layerId)
      ? dimensionValues.layerId
      : defaultDimensionLayerId(project),
  };
  const [roofState, setRoofState] = useState<{ projectId: string; values: RoofDefaults } | null>(
    null,
  );
  const roofValues: RoofDefaults =
    roofState?.projectId === project.id
      ? roofState.values
      : {
          pitch: ROOF_DEFAULTS.pitch,
          thickness: ROOF_DEFAULTS.thickness,
          referenceHeight: ROOF_DEFAULTS.referenceHeight,
          eaveCut: ROOF_DEFAULTS.eaveCut,
          topCut: ROOF_DEFAULTS.topCut,
          layerId: defaultRoofLayerId(project),
        };
  const roofDefaults = {
    ...roofValues,
    layerId: project.layers.some((l) => l.id === roofValues.layerId)
      ? roofValues.layerId
      : defaultRoofLayerId(project),
  };
  const [roomState, setRoomState] = useState<{ projectId: string; values: RoomDefaults } | null>(
    null,
  );
  const roomValues: RoomDefaults =
    roomState?.projectId === project.id
      ? roomState.values
      : {
          name: "",
          floorBuildUpEnabled: false,
          floorBuildUp: 0.12,
          heightLines: defaultHeightLines(),
          layerId: defaultRoomLayerId(project),
        };
  const roomDefaults = {
    ...roomValues,
    layerId: project.layers.some((l) => l.id === roomValues.layerId)
      ? roomValues.layerId
      : defaultRoomLayerId(project),
  };
  const [state, setState] = useState<{ projectId: string; hatch: HatchDefaults } | null>(null);
  const hatch =
    state?.projectId === project.id
      ? state.hatch
      : {
          fill: defaultHatchFill,
          ...defaultHatchAppearance,
          layerId: project.defaultLayerIds.line,
        };
  const current = {
    ...hatch,
    patternRotation: hatch.patternDefinition ? hatch.patternRotation : undefined,
    patternSize: hatch.patternDefinition ? hatch.patternSize : undefined,
    // Committed project definitions have already passed the central resolver.
    patternDefinition: hatch.patternDefinition
      ? (project.hatchPatterns.find((p) => p.id === hatch.patternDefinition!.id) ??
        library.patterns.find((p) => p.id === hatch.patternDefinition!.id) ??
        hatch.patternDefinition)
      : hatch.patternDefinition,
    layerId: project.layers.some((l) => l.id === hatch.layerId)
      ? hatch.layerId
      : project.defaultLayerIds.line,
  };
  return {
    hatch: current,
    wall: wallDefaults,
    setWall(values: WallDefaults) {
      setWallState({ projectId: project.id, values });
    },
    line: lineDefaults,
    setLine(values: LineDefaults) {
      setLineState({ projectId: project.id, values });
    },
    window: windowDefaults,
    door: doorDefaults,
    slab: slabDefaults,
    setSlab(values: SlabDefaults) {
      setSlabState({ projectId: project.id, values });
    },
    dimension: dimensionDefaults,
    setDimension(values: DimensionDefaults) {
      setDimensionState({ projectId: project.id, values });
    },
    column: columnDefaults,
    setColumn(values: ColumnDefaults) {
      setColumnState({ projectId: project.id, values });
    },
    room: roomDefaults,
    setRoom(values: RoomDefaults) {
      setRoomState({ projectId: project.id, values });
    },
    roof: roofDefaults,
    setRoof(values: RoofDefaults) {
      setRoofState({ projectId: project.id, values });
    },
    setDoor(values: DoorSettingsDraft) {
      setDoorState({ projectId: project.id, values });
    },
    setWindow(values: WindowDimensionDraft) {
      setWindowState({ projectId: project.id, values });
    },
    setHatch(values: HatchDefaults) {
      setState({ projectId: project.id, hatch: values });
    },
    apply(defaults: ToolDefaults) {
      if (defaults.tool === "hatch") setState({ projectId: project.id, hatch: defaults.values });
      else if (defaults.tool === "wall")
        setWallState({ projectId: project.id, values: defaults.values });
      else if (defaults.tool === "line")
        setLineState({ projectId: project.id, values: defaults.values });
      else if (defaults.tool === "column")
        setColumnState({ projectId: project.id, values: defaults.values });
      else
        setWindowState({
          projectId: project.id,
          values: {
            width: String(defaults.values.width),
            height: String(defaults.values.height),
            sillHeight: String(defaults.values.sillHeight),
            layerId: defaults.values.layerId,
          },
        });
    },
  };
}
