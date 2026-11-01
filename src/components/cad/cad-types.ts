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
  | "roof"
  | "room"
  | "line"
  | "hatch"
  | "dimension"
  | "text";
export type ViewMode = "2D" | "3D";
export type ViewportLayout = "single" | "horizontal" | "vertical" | "three" | "four";
export type AiState = "idle" | "listening" | "preview";

export type CadTool = {
  id: ToolId;
  label: string;
  shortcut: string;
  /** Lucide icon or an own pictogram (tool-icons.tsx). */
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

export type TreeNode = {
  id: string;
  label: string;
  kind: "group" | "item";
  children?: TreeNode[];
};
