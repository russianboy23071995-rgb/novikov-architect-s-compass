import { useMemo, useState } from "react";
import { distanceInteraction, emptyMeasurement } from "@/application/measurement/distance";
import type { DistanceMeasurement } from "@/application/measurement/distance";
/** Context is owned by the viewport; zoom is deliberately not part of its identity. */
export function useDistanceMeasurement(enabled: boolean, context: object, cancel: () => void) {
  const [session, setSession] = useState<{ context: object; value: DistanceMeasurement } | null>(
    null,
  );
  const value = session?.context === context ? session.value : emptyMeasurement;
  const adapter = useMemo(
    () =>
      enabled
        ? distanceInteraction(value, (next) => setSession({ context, value: next }), cancel)
        : null,
    [enabled, context, value, cancel],
  );
  return { value, adapter, reset: () => setSession(null) };
}
