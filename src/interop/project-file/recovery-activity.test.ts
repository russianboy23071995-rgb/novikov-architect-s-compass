import test from "node:test";
import assert from "node:assert/strict";
import { observeRecoveryActivity } from "./recovery-activity.ts";
test("held pointers/keys block maintenance, blur releases, cleanup removes listeners", () => {
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const win = new EventTarget();
  let held = false,
    visible = true,
    activities = 0;
  const stop = observeRecoveryActivity(doc as unknown as Document, win as unknown as Window, {
    activity() {
      activities++;
    },
    hold(_reason, value) {
      held = value;
    },
    visible(value) {
      visible = value;
    },
  });
  const send = (name: string, props: object = {}) =>
    doc.dispatchEvent(Object.assign(new Event(name), props));
  send("pointerdown", { pointerId: 1 });
  assert.equal(held, true);
  send("keydown", { code: "ShiftLeft" });
  send("pointerup", { pointerId: 1 });
  assert.equal(held, true);
  send("keyup", { code: "ShiftLeft" });
  assert.equal(held, false);
  send("pointerdown", { pointerId: 2 });
  win.dispatchEvent(new Event("blur"));
  assert.equal(held, false);
  assert.equal(visible, false);
  win.dispatchEvent(new Event("focus"));
  assert.equal(visible, true);
  doc.hidden = true;
  send("visibilitychange");
  assert.equal(visible, false);
  stop();
  const before = activities;
  send("pointermove");
  assert.equal(activities, before);
});
