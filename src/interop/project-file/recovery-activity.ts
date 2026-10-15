/** Browser-only activity adapter. Held input blocks maintenance even without further movement. */
export function observeRecoveryActivity(
  doc: Document,
  win: Window,
  target: {
    activity(): void;
    hold(reason: string, value: boolean): void;
    visible(value: boolean): void;
  },
) {
  const pointers = new Set<number>(),
    keys = new Set<string>();
  const held = () => target.hold("input", pointers.size > 0 || keys.size > 0);
  const activity = () => target.activity();
  const down = (e: PointerEvent) => {
    pointers.add(e.pointerId);
    held();
    activity();
  };
  const up = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    held();
    activity();
  };
  const keydown = (e: KeyboardEvent) => {
    keys.add(e.code);
    held();
    activity();
  };
  const keyup = (e: KeyboardEvent) => {
    keys.delete(e.code);
    held();
    activity();
  };
  const reset = () => {
    pointers.clear();
    keys.clear();
    held();
  };
  const blur = () => {
    reset();
    target.visible(false);
  };
  const visibility = () => {
    if (doc.hidden) reset();
    target.visible(!doc.hidden);
  };
  const focus = () => {
    target.visible(!doc.hidden);
    activity();
  };
  doc.addEventListener("pointerdown", down, { capture: true });
  doc.addEventListener("pointerup", up, { capture: true });
  doc.addEventListener("pointercancel", up, { capture: true });
  doc.addEventListener("pointermove", activity, { capture: true });
  doc.addEventListener("wheel", activity, { capture: true, passive: true });
  doc.addEventListener("keydown", keydown, { capture: true });
  doc.addEventListener("keyup", keyup, { capture: true });
  doc.addEventListener("visibilitychange", visibility);
  win.addEventListener("blur", blur);
  win.addEventListener("focus", focus);
  visibility();
  return () => {
    doc.removeEventListener("pointerdown", down, { capture: true });
    doc.removeEventListener("pointerup", up, { capture: true });
    doc.removeEventListener("pointercancel", up, { capture: true });
    doc.removeEventListener("pointermove", activity, { capture: true });
    doc.removeEventListener("wheel", activity, { capture: true });
    doc.removeEventListener("keydown", keydown, { capture: true });
    doc.removeEventListener("keyup", keyup, { capture: true });
    doc.removeEventListener("visibilitychange", visibility);
    win.removeEventListener("blur", blur);
    win.removeEventListener("focus", focus);
    reset();
  };
}
