/** End a viewport gesture when the browser loses its pointer/focus lifecycle.
 * No model commit: callers only discard transient navigation state.
 */
export function observeNavigationExit(
  windowTarget: EventTarget,
  documentTarget: EventTarget & { readonly hidden: boolean },
  cancel: () => void,
) {
  const out = (event: Event) => {
    if ((event as MouseEvent).relatedTarget === null) cancel();
  };
  const hidden = () => {
    if (documentTarget.hidden) cancel();
  };
  windowTarget.addEventListener("blur", cancel);
  documentTarget.addEventListener("pointerout", out);
  documentTarget.addEventListener("visibilitychange", hidden);
  return () => {
    windowTarget.removeEventListener("blur", cancel);
    documentTarget.removeEventListener("pointerout", out);
    documentTarget.removeEventListener("visibilitychange", hidden);
  };
}
