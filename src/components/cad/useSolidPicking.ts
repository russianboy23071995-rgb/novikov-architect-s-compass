import { useEffect, useRef } from "react";
import { createSolidPickingService } from "@/rendering/viewport/solid-picking-service";
import { pickSolidElement } from "@/rendering/viewport/window-selection";
import type { WindowSelectionSurface } from "@/rendering/viewport/window-selection";
import type { DisplaySurfaces } from "@/rendering/viewport/layer-display";
import type { ProjectionState } from "@/rendering/viewport/projection-state";
export function useSolidPicking(
  solid: DisplaySurfaces,
  windows: readonly WindowSelectionSurface[],
  enabled: boolean,
) {
  const service = useRef<ReturnType<typeof createSolidPickingService> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const current = createSolidPickingService(solid, windows);
    service.current = current;
    return () => {
      current.dispose();
      if (service.current === current) service.current = null;
    };
  }, [solid, windows, enabled]);
  return (projection: ProjectionState, x: number, y: number) =>
    enabled && service.current
      ? service.current.pick(solid, windows, projection, x, y)
      : pickSolidElement(solid, windows, projection.project, x, y);
}
