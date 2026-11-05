import test from "node:test";
import assert from "node:assert/strict";
import { doorDinHand, doorHingeForDinHand, type Door } from "./model.ts";
import { doorPlanSymbol } from "../../../rendering/viewport/door-symbol.ts";
import { doorOperationType } from "../../../interop/ifc/writer.ts";

const combos = [
  ["start", "left"],
  ["end", "left"],
  ["start", "right"],
  ["end", "right"],
] as const;

test("DIN 107: seen from the swing side, hinges on the left make a DIN links door", () => {
  for (const [hinge, opensTo] of combos) {
    // Viewer stands on the swing side and faces the wall (wall-local plan coordinates).
    const s = doorPlanSymbol(
      { width: 1, position: 0.5, hinge, opensTo },
      { length: 4, thickness: 0.2 },
    );
    const facing = opensTo === "left" ? { x: 0, y: -1 } : { x: 0, y: 1 };
    const viewerLeft = { x: -facing.y, y: facing.x };
    const hingeOnLeft = (s.hinge.x - s.closed.x) * viewerLeft.x > 0;
    assert.equal(
      doorDinHand({ hinge, opensTo }),
      hingeOnLeft ? "links" : "rechts",
      `${hinge}/${opensTo}`,
    );
  }
  assert.deepEqual(
    combos.map(([hinge, opensTo]) => doorDinHand({ hinge, opensTo })),
    ["rechts", "links", "links", "rechts"],
  );
});

test("setting DIN keeps the swing side, moves only the hinge and round-trips", () => {
  for (const [hinge, opensTo] of combos)
    for (const hand of ["links", "rechts"] as const) {
      const next: Pick<Door, "hinge" | "opensTo"> = {
        hinge: doorHingeForDinHand({ opensTo }, hand),
        opensTo,
      };
      assert.equal(doorDinHand(next), hand);
      // The current handing maps back to the current hinge.
      assert.equal(doorHingeForDinHand({ opensTo }, doorDinHand({ hinge, opensTo })), hinge);
    }
});

test("IFC operation type is seen from the opposite side: IFC left is DIN rechts", () => {
  for (const [hinge, opensTo] of combos)
    assert.equal(
      doorOperationType({ hinge, opensTo }) === "SINGLE_SWING_LEFT",
      doorDinHand({ hinge, opensTo }) === "rechts",
      `${hinge}/${opensTo}`,
    );
});
