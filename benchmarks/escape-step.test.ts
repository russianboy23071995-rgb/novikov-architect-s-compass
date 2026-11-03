import test from "node:test";
import assert from "node:assert/strict";
import { escapeStep } from "../src/components/cad/escape-step.ts";

// docs/AUSWAHL_ESCAPE.md: Escape first ends what runs, then clears the selection; a press
// another part used does nothing more.
test("escape: first ends what runs and keeps the selection, then clears the selection", () => {
  assert.equal(escapeStep({ consumed: false, running: true, selected: true }), "cancel");
  assert.equal(escapeStep({ consumed: false, running: false, selected: true }), "deselect");
  assert.equal(escapeStep({ consumed: false, running: true, selected: false }), "cancel");
  assert.equal(escapeStep({ consumed: false, running: false, selected: false }), "none");
  // A marquee, a mask drag or the overlap menu used the press.
  assert.equal(escapeStep({ consumed: true, running: true, selected: true }), "none");
  assert.equal(escapeStep({ consumed: true, running: false, selected: true }), "none");
});
