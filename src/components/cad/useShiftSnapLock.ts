import { useEffect, useMemo, useState } from "react";
import { createShiftSnapLock } from "@/application/tools/shift-lock";
import type { resolveToolSnap } from "@/application/tools/snapping";

/** Keyboard lifecycle is shared by plan and workplane targeting, not by element type. */
export function useShiftSnapLock(session: object, resetKey: number) {
  const lock = useMemo(
    () => ({ session, resetKey, ...createShiftSnapLock() }),
    [session, resetKey],
  );
  const [keyboardShift, setKeyboardShift] = useState<boolean | null>(null);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        const down = event.type === "keydown";
        if (down && !event.repeat) lock.press();
        if (!down) lock.release();
        setKeyboardShift(down);
      }
      if (event.key === "Escape") {
        lock.release();
        setKeyboardShift(false);
      }
    };
    const clear = () => {
      lock.release();
      setKeyboardShift(false);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
      window.removeEventListener("blur", clear);
    };
  }, [lock]);
  return (...args: Parameters<typeof resolveToolSnap>) =>
    lock.resolve(args[0], args[1], args[2], {
      ...args[3],
      shift: keyboardShift ?? args[3].shift,
    });
}
