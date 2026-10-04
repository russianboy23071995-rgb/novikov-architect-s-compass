import { useState } from "react";
import { usePrecisionDraft } from "./usePrecisionDraft";
import { evaluateInteraction, confirmInteraction } from "@/application/tools/interaction";
import type { ToolInteraction } from "@/application/tools/interaction";
import type { Point2 } from "@/geometry/primitives/point";
/** One lifecycle for every adapter: input, preview, click, confirmation and cancellation. */
export function useToolInteraction(adapter: ToolInteraction | null, suspended = false) {
  const draft = usePrecisionDraft(adapter?.identity ?? null);
  const [failure, setFailure] = useState<{ identity: object; message: string } | null>(null);
  const preview = evaluateInteraction(adapter, draft.angle, draft.length, draft.aim);
  const confirm = (point?: Point2) => {
    if (!adapter || suspended) return;
    const target = point ?? preview.value?.point;
    if (!target) return;
    try {
      confirmInteraction(adapter, target);
      setFailure(null);
    } catch (error) {
      setFailure({
        identity: adapter.identity,
        message: error instanceof Error ? error.message : "Ungültige Aktion.",
      });
    }
  };
  const pick = (point: Point2) => {
    if (!adapter) return;
    if (adapter.click === "direction" && !draft.hasInput) draft.fix(adapter.origin, point);
    else confirm(draft.hasInput ? undefined : point);
  };
  return {
    adapter,
    suspended,
    draft: {
      ...draft,
      move: (point: Point2) => {
        if (!suspended) draft.move(point);
      },
    },
    preview,
    target: draft.hasInput ? (preview.value?.point ?? null) : undefined,
    error:
      failure?.identity === adapter?.identity
        ? (failure?.message ?? "")
        : draft.hasInput
          ? preview.error
          : "",
    confirm,
    pick,
    captureDirection: () => {
      if (preview.value) draft.change(String(preview.value.degrees), draft.length);
    },
    cancel: () => {
      setFailure(null);
      adapter?.cancel();
    },
  };
}
