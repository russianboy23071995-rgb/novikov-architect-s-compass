import { PrecisionInput } from "./PrecisionInput";
import type { useToolInteraction } from "./useToolInteraction";
import type { Point2 } from "@/geometry/primitives/point";
export function InteractionInput({
  interaction,
  position,
  onPosition,
}: {
  interaction: ReturnType<typeof useToolInteraction>;
  position: Point2;
  onPosition: (point: Point2) => void;
}) {
  const { adapter, draft, preview } = interaction;
  if (!adapter) return null;
  if (!adapter.input)
    return (
      <div
        role="status"
        className="absolute left-3 top-20 z-30 rounded bg-popover px-3 py-2 text-xs shadow"
      >
        Vorschau · Zielpunkt anklicken · Esc bricht ab{" "}
        <button onClick={interaction.cancel}>Abbrechen</button>
        {interaction.error && <p role="alert">{interaction.error}</p>}
      </div>
    );
  const degrees = adapter.input.degrees ?? preview.value?.degrees;
  return (
    <PrecisionInput
      focusLengthToken={draft.focus}
      position={position}
      onPosition={onPosition}
      angle={draft.angle}
      length={draft.length}
      angleHint={degrees === undefined ? "Maus" : String(Number(degrees.toFixed(2)))}
      lengthHint={preview.value ? String(Number(preview.value.metres.toFixed(3))) : "Maus"}
      axisLabel={adapter.input.axisLabel}
      mouseHint={
        adapter.click === "direction"
          ? "Mausrichtung · Tab: Länge ↔ Winkel"
          : "Mausziel · Tab: Länge ↔ Winkel"
      }
      error={interaction.error}
      canConfirm={!!preview.value}
      onChange={draft.change}
      onCaptureDirection={interaction.captureDirection}
      onConfirm={() => interaction.confirm()}
      onCancel={interaction.cancel}
    />
  );
}
