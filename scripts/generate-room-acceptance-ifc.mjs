// node --experimental-strip-types scripts/generate-room-acceptance-ifc.mjs <output-directory>
// Archicad acceptance of rooms as IfcSpace (docs/ROOM_ELEMENT.md, R4): the roof acceptance
// house with one room per storey, exported through the regular IFC export.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { roomAcceptanceProject } from "../benchmarks/room-ifc-acceptance.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const file = join(directory, "NOVIKOV-Raum-Test.ifc");
await writeFile(file, await exportIfc(roomAcceptanceProject(), new Date("2026-10-30T12:00:00Z")));
process.stdout.write(file + "\n");
