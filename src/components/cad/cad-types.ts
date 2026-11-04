import type { ComponentType } from "react";

export type ToolId =
  | "measure"
  | "window"
  | "door"
  | "select"
  | "wall"
  | "column"
  | "stair"
  | "section"
  | "elevation"
  | "slab"
  | "slabOpening"
  | "roof"
  | "room"
  | "line"
  | "hatch"
  | "dimension"
  | "text"
  | "drawing"
  // Planned tools, shown greyed in the rail until they exist (docs/WERKZEUGLEISTE.md, WL3):
  // Dachflächenfenster (L41), Geländer (L42), Gelände (L43).
  | "roofWindow"
  | "railing"
  | "terrain";
export type ViewMode = "2D" | "3D";
export type AiState = "idle" | "listening" | "preview";

export type CadTool = {
  id: ToolId;
  label: string;
  shortcut: string;
  /** Lucide icon or an own pictogram (tool-icons.tsx). */
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Pictogram of the package (Pictogram.tsx), inactive and active; replaces the icon in the rail. */
  pictogram?: string;
  /** Not built yet: greyed, cannot be chosen, "kommt später". */
  planned?: boolean;
};

export type TreeNode = {
  id: string;
  label: string;
  kind: "group" | "item";
  children?: TreeNode[];
  /** Navigator pictogram of the package (docs/WERKZEUGLEISTE.md, WL3), active while chosen. */
  pictogram?: "gesamtuebersicht" | "grundriss" | "schnitt" | "ansicht" | "auswertung";
};
