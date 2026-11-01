import {
  BoxSelect,
  Cylinder,
  Footprints,
  DoorOpen,
  PanelsTopLeft,
  PaintBucket,
  MousePointer2,
  PenLine,
  Pentagon,
  Triangle,
  Grid2x2,
  RulerDimensionLine,
  SquareSplitHorizontal,
  Type,
} from "lucide-react";
import type { CadTool, ToolId } from "./cad-types";

// The select tool stays on top; the others follow the user's groups (docs/WERKZEUGLEISTE.md,
// WL1). A double click on any tool opens its settings window (docs/EINSTELLUNGSFENSTER.md).
export const SELECT_TOOL: CadTool = {
  id: "select",
  label: "Select",
  shortcut: "V",
  icon: MousePointer2,
};
export const RAIL_TOOLS: Partial<Record<ToolId, CadTool>> = {
  wall: { id: "wall", label: "Wall", shortcut: "W", icon: BoxSelect },
  column: { id: "column", label: "Stütze", shortcut: "", icon: Cylinder },
  stair: { id: "stair", label: "Treppe", shortcut: "", icon: Footprints },
  window: { id: "window", label: "Fenster", shortcut: "", icon: PanelsTopLeft },
  door: { id: "door", label: "Tür", shortcut: "T", icon: DoorOpen },
  slab: { id: "slab", label: "Decke", shortcut: "S", icon: Pentagon },
  // No letter yet: D and Ctrl+D are reserved for rotating (Masterplan §8).
  roof: { id: "roof", label: "Dach", shortcut: "", icon: Triangle },
  room: { id: "room", label: "Raum", shortcut: "", icon: Grid2x2 },
  line: { id: "line", label: "Line", shortcut: "L", icon: PenLine },
  hatch: { id: "hatch", label: "Schraffur", shortcut: "H", icon: PaintBucket },
  dimension: { id: "dimension", label: "Maßkette", shortcut: "", icon: RulerDimensionLine },
  text: { id: "text", label: "Text", shortcut: "", icon: Type },
  section: { id: "section", label: "Schnitt", shortcut: "", icon: SquareSplitHorizontal },
};
