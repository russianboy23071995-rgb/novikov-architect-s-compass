// node --experimental-strip-types scripts/generate-roof-acceptance-ifc.mjs <output-directory>
// Archicad acceptance of the roof (docs/ROOF_ELEMENT.md, D5): the slab acceptance house with a
// single-pitch roof over the OG, exported through the regular IFC export.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { roofAcceptanceProject } from "../benchmarks/roof-ifc-acceptance.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const file = join(directory, "NOVIKOV-Dach-Test.ifc");
await writeFile(file, await exportIfc(roofAcceptanceProject(), new Date("2026-10-29T12:00:00Z")));
process.stdout.write(file + "\n");
