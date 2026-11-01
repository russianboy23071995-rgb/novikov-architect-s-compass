import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createProject } from "../../application/projects/create.ts";
import { addWall } from "../../application/walls/actions.ts";
import { addWindow } from "../../application/windows/actions.ts";
import { addDoor } from "../../application/doors/actions.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import {
  DOOR_INSERT_DEFAULTS,
  WINDOW_INSERT_DEFAULTS,
} from "../../domain/elements/window/insert.ts";
import { doorPlanFrame, planRectPath, windowPlanSymbol } from "./opening-plan-symbol.ts";

// docs/FENSTER_TUEREN.md, FT3. Wall along x, 0,24 m thick.
const storey = (insert = true) =>
  storeyOf(
    addDoor(
      addWindow(
        addWall(createProject("p", "eg"), {
          id: "w",
          start: { x: 0, y: 0 },
          end: { x: 6, y: 0 },
          thickness: 0.24,
          height: 2.8,
        }),
        {
          id: "f",
          wallId: "w",
          width: 1.2,
          height: 1.35,
          sillHeight: 0.9,
          position: 0.25,
          ...(insert ? { insert: WINDOW_INSERT_DEFAULTS } : {}),
        },
      ),
      {
        id: "d",
        wallId: "w",
        position: 0.75,
        ...DOOR_DEFAULTS,
        ...(insert ? { insert: DOOR_INSERT_DEFAULTS } : {}),
      },
    ),
  );
const close = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]!) < 1e-9);

test("window in plan: jambs of the frame, the pane between them, boards beyond the wall faces", () => {
  const s = storey();
  const symbol = windowPlanSymbol(s.windows[0]!, s.walls[0]!)!;
  assert.equal(symbol.jambs.length, 2);
  assert.ok(close(symbol.jambs[0]!.x, [0.9, 0.97]));
  assert.ok(close(symbol.jambs[1]!.x, [2.03, 2.1]));
  assert.ok(close(symbol.jambs[0]!.y, [-0.04, 0.04]));
  assert.equal(symbol.glasses.length, 1);
  assert.ok(close(symbol.glasses[0]!.x, [0.97, 2.03]));
  assert.ok(close(symbol.glasses[0]!.y, [-0.012, 0.012]));
  // Outside (right of the wall direction, y < 0) 4 cm beyond the face, inside 2 cm.
  assert.ok(close(symbol.sills[0]!.y, [-0.16, -0.04]));
  assert.ok(close(symbol.sills[1]!.y, [0.04, 0.14]));
  // SVG: y is mirrored like the rest of the plan.
  assert.equal(planRectPath([{ x: [0, 1], y: [0, 2] }]), "M0,0 L1,0 L1,-2 L0,-2 Z");
  assert.equal(windowPlanSymbol(storey(false).windows[0]!, s.walls[0]!), null);
});

test("door in plan: jambs of the frame (Zarge) and the clear width the leaf swings in", () => {
  const s = storey();
  const frame = doorPlanFrame(s.doors![0]!, s.walls[0]!)!;
  assert.equal(frame.jambs.length, 2);
  assert.ok(close([frame.leafWidth], [1.01 - 0.12]));
  assert.ok(close(frame.jambs[0]!.x, [4.5 - 0.505, 4.5 - 0.445]));
  assert.ok(close(frame.jambs[0]!.y, [-0.12, 0.12]));
  assert.equal(doorPlanFrame(storey(false).doors![0]!, s.walls[0]!), null);
});
