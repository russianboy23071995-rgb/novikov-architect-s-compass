import test from "node:test";
import assert from "node:assert/strict";
import { observeNavigationExit } from "./navigation-exit.ts";
test("browser exits cancel, internal transitions do not, disposal detaches all listeners", () => {
  const windowTarget = new EventTarget();
  const documentTarget = Object.assign(new EventTarget(), { hidden: false });
  let cancellations = 0;
  const dispose = observeNavigationExit(windowTarget, documentTarget, () => cancellations++);
  const out = (relatedTarget: EventTarget | null) => {
    const event = new Event("pointerout");
    Object.defineProperty(event, "relatedTarget", { value: relatedTarget });
    documentTarget.dispatchEvent(event);
  };
  out(new EventTarget());
  documentTarget.dispatchEvent(new Event("visibilitychange"));
  assert.equal(cancellations, 0);
  out(null);
  windowTarget.dispatchEvent(new Event("blur"));
  documentTarget.hidden = true;
  documentTarget.dispatchEvent(new Event("visibilitychange"));
  assert.equal(cancellations, 3);
  dispose();
  out(null);
  windowTarget.dispatchEvent(new Event("blur"));
  documentTarget.dispatchEvent(new Event("visibilitychange"));
  assert.equal(cancellations, 3);
});
