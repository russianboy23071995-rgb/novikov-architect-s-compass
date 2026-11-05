import { useState } from "react";
import type { Point2 } from "@/geometry/primitives/point";

/**
 * Position a floating helper (on-demand menu, length/angle input) keeps once the user moved it,
 * also after a reload (user decision 31.10.2026, docs/HILFSFENSTER.md). Until then it is null
 * and the helper follows the cursor. Browser storage only: a missing or failing store just
 * means following the cursor again.
 */
export function useRememberedPosition(key: string) {
  const [pinned, setPinned] = useState<Point2 | null>(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) ?? "null");
      return value && Number.isFinite(value.x) && Number.isFinite(value.y)
        ? { x: value.x, y: value.y }
        : null;
    } catch {
      return null;
    }
  });
  const pin = (point: Point2) => {
    setPinned(point);
    try {
      window.localStorage.setItem(key, JSON.stringify(point));
    } catch {
      // The position then lasts only for this session.
    }
  };
  const unpin = () => {
    setPinned(null);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing stored.
    }
  };
  return { pinned, pin, unpin };
}
