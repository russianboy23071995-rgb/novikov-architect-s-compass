// Archicad check of wall build-ups (docs/WANDAUFBAU.md, SA4): the room of the window trial
// (6 × 4 m, drawn counter-clockwise, so the right face of every wall is outside) with its
// windows, door and elements; the outer walls get „KS 17,5 + WDVS 16“ (36 cm, plaster outside),
// a free-standing inner wall „Trockenbau 10“. Regular export.
// Usage: node --experimental-strip-types benchmarks/assembly-ifc-acceptance.ts <file.ifc>
import { writeFileSync } from "node:fs";
import { addWall } from "../src/application/walls/actions.ts";
import { setWallAssembly } from "../src/application/walls/assembly.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import type { Project } from "../src/domain/project/schema.ts";
import { insertAcceptanceProject } from "./insert-ifc-acceptance.ts";

export function assemblyAcceptanceProject(): Project {
  const outer = setWallAssembly(
    insertAcceptanceProject(),
    ["w1", "w2", "w3", "w4"],
    "assembly-ks175-wdvs160",
  );
  const inner = addWall(outer, {
    id: "w5",
    start: { x: 3, y: 0.6 },
    end: { x: 3, y: 3.4 },
    thickness: 0.1,
    height: 2.8,
  });
  return setWallAssembly(inner, ["w5"], "assembly-tb100");
}

const target = process.argv[2];
if (target) {
  const ifc = await exportIfc(assemblyAcceptanceProject(), new Date("2026-11-01T12:00:00Z"));
  writeFileSync(target, ifc);
  console.log(`${target}: ${ifc.split("\n").length} Zeilen`);
}
