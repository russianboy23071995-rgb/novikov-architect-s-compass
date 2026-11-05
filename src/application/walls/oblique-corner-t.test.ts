import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall } from "./actions.ts";
import { previewTConnection } from "./t-connections.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  connectedWallContours,
  connectedWallSolids,
} from "../../domain/elements/wall/connections.ts";
import { validateSimplePolygon } from "../../geometry/polygons/simple-polygon.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import type { Project } from "../../domain/project/schema.ts";

// A T host whose corner partner meets it obliquely (user decision 26.10.2026,
// docs/OBLIQUE_T_JUNCTIONS.md).
function cornerAndT(cornerDegrees: number, tx: number, side: 1 | -1): Project {
  const r = (cornerDegrees * Math.PI) / 180;
  let p = addWall(createProject("p", "s0"), {
    id: "H",
    start: { x: 0, y: 0 },
    end: { x: 10, y: 0 },
    thickness: 0.3,
    height: 3,
  });
  // Corner partner E below H at the given angle to H.
  p = addWall(p, {
    id: "E",
    start: { x: 0, y: 0 },
    end: { x: 4 * Math.cos(r), y: -4 * Math.sin(r) },
    thickness: 0.3,
    height: 3,
  });
  p = addWall(p, {
    id: "N",
    start: { x: tx, y: 4 * side },
    end: { x: tx, y: 0 },
    thickness: 0.24,
    height: 3,
  });
  return previewTConnection(p, p, {
    projectId: "p",
    kind: "connect",
    relation: { hostWallId: "H", incoming: { wallId: "N", endpoint: 1 } },
  });
}

for (const degrees of [45, 60, 120, 135])
  test(`a T on a host with a ${degrees}° corner keeps simple rings and solids`, async () => {
    for (const side of [1, -1] as const) {
      const p = cornerAndT(degrees, 5, side);
      assert.equal(storeyOf(p).wallJoins.length, 1);
      assert.equal(storeyOf(p).wallTJunctions.length, 1);
      const contours = connectedWallContours(p);
      for (const id of ["H", "E", "N"])
        assert.ok(validateSimplePolygon(contours.get(id)!).valid, `${id} at ${degrees}°`);
      assert.ok(connectedWallSolids(p).every((s) => s.volume > 0));
      assert.match(await exportIfc(p), /IFCWALL/);
    }
  });

test("a T touching the corner region or the oblique partner is still rejected (counter-check)", () => {
  // On the partner side (below) close to an acute 45° partner: the incoming wall would cut E.
  assert.throws(() => cornerAndT(45, 1.0, -1), /Eckpartner|Eckbereich/);
  // Directly at the mitre on the far side: the contact reaches the corner region of H.
  assert.throws(() => cornerAndT(135, 0.1, 1), /Eckbereich|Hauptwandende|Kontakt/);
});
