import {
  Armchair,
  DoorOpen,
  PaintBucket,
  MousePointer2,
  PenLine,
  Grid2x2,
  RulerDimensionLine,
  Type,
  Frame,
} from "lucide-react";
import type { CadTool, ToolId } from "./cad-types";
import { RailingIcon, RoofWindowIcon, TerrainIcon } from "./Pictogram";
import {
  ColumnIcon,
  RoofIcon,
  SectionIcon,
  ElevationIcon,
  SlabIcon,
  SlabOpeningIcon,
  StairIcon,
  WallIcon,
  WindowIcon,
} from "./tool-icons";

// Own pictograms where the lucide ones did not fit (WL2): wall, column, stair, window, slab,
// roof, section. The rail shows the pictograms of the package instead (`pictogram`, WL3); the
// icons stay for the places that take a plain tool icon.
// The select tool stays on top; the others follow the user's groups (docs/WERKZEUGLEISTE.md,
// WL1). A double click on any tool opens its settings window (docs/EINSTELLUNGSFENSTER.md).
export const SELECT_TOOL: CadTool = {
  id: "select",
  label: "Select",
  shortcut: "V",
  icon: MousePointer2,
  pictogram: "auswahl",
};
export const RAIL_TOOLS: Partial<Record<ToolId, CadTool>> = {
  wall: { id: "wall", label: "Wall", shortcut: "W", icon: WallIcon, pictogram: "wand" },
  column: { id: "column", label: "Stütze", shortcut: "", icon: ColumnIcon, pictogram: "stuetze" },
  stair: { id: "stair", label: "Treppe", shortcut: "", icon: StairIcon, pictogram: "treppe" },
  window: { id: "window", label: "Fenster", shortcut: "", icon: WindowIcon, pictogram: "fenster" },
  door: { id: "door", label: "Tür", shortcut: "T", icon: DoorOpen, pictogram: "tuer" },
  slab: { id: "slab", label: "Decke", shortcut: "S", icon: SlabIcon, pictogram: "decke" },
  // Opening through a slab (docs/DECKENDURCHBRUCH.md, L40).
  slabOpening: {
    id: "slabOpening",
    label: "Deckendurchbruch",
    shortcut: "",
    icon: SlabOpeningIcon,
    pictogram: "deckendurchbruch",
  },
  // No letter yet: D and Ctrl+D are reserved for rotating (Masterplan §8).
  roof: { id: "roof", label: "Dach", shortcut: "", icon: RoofIcon, pictogram: "dach" },
  room: { id: "room", label: "Raum", shortcut: "", icon: Grid2x2, pictogram: "raum" },
  line: { id: "line", label: "Line", shortcut: "L", icon: PenLine, pictogram: "linie" },
  hatch: {
    id: "hatch",
    label: "Schraffur",
    shortcut: "H",
    icon: PaintBucket,
    pictogram: "schraffur",
  },
  dimension: {
    id: "dimension",
    label: "Maßkette",
    shortcut: "",
    icon: RulerDimensionLine,
    pictogram: "bemassung",
  },
  text: { id: "text", label: "Text", shortcut: "", icon: Type, pictogram: "text" },
  // Places a drawing document on a layout (docs/ZEICHNUNG.md, ZW2).
  drawing: {
    id: "drawing",
    label: "Zeichnung",
    shortcut: "",
    icon: Frame,
    pictogram: "technische-zeichnung",
  },
  section: {
    id: "section",
    label: "Schnitt",
    shortcut: "",
    icon: SectionIcon,
    pictogram: "schnitt",
  },
  // Elevation: the section line object seen from outside (docs/ANSICHTEN.md, A1).
  elevation: {
    id: "elevation",
    label: "Ansicht",
    shortcut: "",
    icon: ElevationIcon,
    pictogram: "ansicht",
  },
  // Planned (docs/WERKZEUGLEISTE.md, WL3): greyed buttons until the tools exist; the railing
  // exists since docs/GELAENDER.md, G2, the roof window since docs/DACHFLAECHENFENSTER.md, D2.
  roofWindow: {
    id: "roofWindow",
    label: "Dachflächenfenster",
    shortcut: "",
    icon: RoofWindowIcon,
    pictogram: "dachflaechenfenster",
  },
  // Places catalogue objects (docs/OBJEKTBIBLIOTHEK.md, M1).
  library: {
    id: "library",
    label: "Bibliothek",
    shortcut: "",
    icon: Armchair,
    pictogram: "bibliothek",
  },
  railing: {
    id: "railing",
    label: "Geländer",
    shortcut: "",
    icon: RailingIcon,
    pictogram: "gelaender",
  },
  terrain: {
    id: "terrain",
    label: "Gelände",
    shortcut: "",
    icon: TerrainIcon,
    pictogram: "gelaende",
  },
};
