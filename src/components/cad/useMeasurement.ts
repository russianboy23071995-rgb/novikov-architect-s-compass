import { emptyAngle, pickAngle } from "@/application/measurement/angle";
import type { AngleMeasurement } from "@/application/measurement/angle";
import { useCallback, useMemo, useState } from "react";
import {
  distanceInteraction,
  emptyMeasurement,
  pointMeasurementInteraction,
} from "@/application/measurement/distance";
import type { DistanceMeasurement } from "@/application/measurement/distance";
import { emptyArea, pickArea, finishArea } from "@/application/measurement/area";
import type { AreaMeasurement } from "@/application/measurement/area";
export type MeasurementMode = "distance" | "area" | "angle";
/** All measurement modes share a transient, viewport-bound lifecycle. Zoom retains it. */
export function useMeasurement(
  enabled: boolean,
  context: object,
  mode: MeasurementMode,
  cancel: () => void,
) {
  const [session, setSession] = useState<{
    context: object;
    mode: MeasurementMode;
    distance: DistanceMeasurement;
    area: AreaMeasurement;
    angle: AngleMeasurement;
    error: string;
  } | null>(null);
  const current = session?.context === context && session.mode === mode ? session : null;
  const value = current?.distance ?? emptyMeasurement;
  const area = current?.area ?? emptyArea;
  const angle = current?.angle ?? emptyAngle;
  const update = useCallback(
    (
      distance: DistanceMeasurement,
      area: AreaMeasurement,
      error = "",
      angle: AngleMeasurement = emptyAngle,
    ) => setSession({ context, mode, distance, area, angle, error }),
    [context, mode],
  );
  const adapter = useMemo(
    () =>
      !enabled
        ? null
        : mode === "distance"
          ? distanceInteraction(value, (next) => update(next, emptyArea), cancel)
          : mode === "angle"
            ? pointMeasurementInteraction(
                angle,
                angle.degrees === null ? angle.points : [],
                (point) => {
                  try {
                    update(emptyMeasurement, emptyArea, "", pickAngle(angle, point));
                  } catch (e) {
                    update(
                      emptyMeasurement,
                      emptyArea,
                      e instanceof Error ? e.message : "Ungültiger Winkel.",
                      angle,
                    );
                  }
                },
                cancel,
              )
            : pointMeasurementInteraction(
                area,
                area.squareMetres === null ? area.points : [],
                (point) => update(emptyMeasurement, pickArea(area, point)),
                cancel,
              ),
    [enabled, mode, value, area, angle, cancel, update],
  );
  const finish = () => {
    if (!enabled || mode !== "area") return;
    try {
      update(emptyMeasurement, finishArea(area));
    } catch (e) {
      update(emptyMeasurement, area, e instanceof Error ? e.message : "Ungültige Messkontur.");
    }
  };
  return {
    value,
    angle,
    area,
    adapter,
    finish,
    error: current?.error ?? "",
    reset: () => setSession(null),
  };
}
