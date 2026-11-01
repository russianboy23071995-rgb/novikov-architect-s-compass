// Archicad check of window and door elements (docs/FENSTER_TUEREN.md, FT4): the room of the
// filling trial (6 × 4 m, walls 0,30 m), its two windows and the door now with elements in the
// default values; the large window sits outside with 2 cm offset. Regular export, no variant.
// With --sashes (FL4): the large window 2-flüglig, the small one with a top light.
// Usage: node --experimental-strip-types benchmarks/insert-ifc-acceptance.ts <file.ifc> [--sashes]
import { writeFileSync } from "node:fs";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { setOpeningInsert } from "../src/application/openings/inserts.ts";
import {
  DOOR_INSERT_DEFAULTS,
  WINDOW_INSERT_DEFAULTS,
  withDivision,
} from "../src/domain/elements/window/insert.ts";
import type { Project } from "../src/domain/project/schema.ts";
import { exportFillingVariant, fillingAcceptanceProject } from "./filling-ifc-acceptance.ts";

export function insertAcceptanceProject(sashes = false): Project {
  let p = fillingAcceptanceProject();
  for (const window of storeyOf(p).windows)
    p = setOpeningInsert(p, {
      kind: "window",
      id: window.id,
      insert:
        window.id === "fenster-gross"
          ? withDivision(
              { ...WINDOW_INSERT_DEFAULTS, location: "outside", offset: 0.02 },
              sashes ? "double" : "fixed",
            )
          : withDivision(WINDOW_INSERT_DEFAULTS, sashes ? "transom" : "fixed"),
    });
  return setOpeningInsert(p, { kind: "door", id: "tuer", insert: DOOR_INSERT_DEFAULTS });
}

const target = process.argv[2];
if (target) {
  const ifc = await exportFillingVariant(
    insertAcceptanceProject(process.argv.includes("--sashes")),
    {},
    new Date("2026-11-01T12:00:00Z"),
  );
  writeFileSync(target, ifc);
  console.log(`${target}: ${ifc.split("\n").length} Zeilen`);
}
