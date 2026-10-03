import type { Point2 } from "../../geometry/primitives/point.ts";
export type PrecisionValues = { point: Point2; degrees: number; metres: number };
/** Concrete tool supplies geometry/validation/actions, never keyboard or widget logic. */
export type ToolInteraction = {
  identity: object;
  origin: Point2;
  input: { axisLabel: string | null; degrees: number | null } | null;
  click: "confirm" | "direction";
  preview: (angle: string, length: string, aim: Point2 | null) => PrecisionValues;
  validate: (point: Point2) => void;
  commit: (point: Point2) => void;
  cancel: () => void;
};
export type InteractionPreview = { value: PrecisionValues | null; error: string };
export function evaluateInteraction(
  tool: ToolInteraction | null,
  angle: string,
  length: string,
  aim: Point2 | null,
): InteractionPreview {
  if (!tool?.input || (!angle.trim() && !length.trim() && !aim)) return { value: null, error: "" };
  try {
    return { value: tool.preview(angle, length, aim), error: "" };
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : "Ungültige Eingabe." };
  }
}
/** Both mouse and numeric confirmation revalidate; preview alone never commits. */
export function confirmInteraction(tool: ToolInteraction, point: Point2): void {
  tool.validate(point);
  tool.commit(point);
}
