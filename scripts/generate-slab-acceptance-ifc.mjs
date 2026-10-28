// node --experimental-strip-types scripts/generate-slab-acceptance-ifc.mjs <output-directory>
// Archicad acceptance of ceiling slabs (docs/SLAB_ELEMENT.md, Teil B2): the regular IFC export
// of a small two-storey house with one ceiling slab per storey.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { slabAcceptanceProject } from "../benchmarks/slab-ifc-acceptance.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const file = join(directory, "NOVIKOV-Decken-Test.ifc");
await writeFile(file, await exportIfc(slabAcceptanceProject(), new Date("2026-10-28T12:00:00Z")));
process.stdout.write(file + "\n");
