import type { LucideIcon } from "lucide-react";

export type ToolId =
  | "measure"
  | "window"
  | "door"
  | "select"
  | "wall"
  | "column"
  | "slab"
  | "roof"
  | "room"
  | "line"
  | "hatch"
  | "dimension";
export type ViewMode = "2D" | "3D";
export type ViewportLayout = "single" | "horizontal" | "vertical" | "three" | "four";
export type AiState = "idle" | "listening" | "preview";

export type CadTool = {
  id: ToolId;
  label: string;
  shortcut: string;
  icon: LucideIcon;
};

export type TreeNode = {
  id: string;
  label: string;
  kind: "group" | "item";
  children?: TreeNode[];
};
