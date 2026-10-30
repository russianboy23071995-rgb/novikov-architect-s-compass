// node --experimental-strip-types scripts/generate-trim-acceptance-ifc.mjs <output-directory>
// Archicad acceptance of walls trimmed at a roof (docs/TRIMMEN_L04B.md, L04b), exported
// through the regular IFC export.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { trimAcceptanceProject } from "../benchmarks/trim-ifc-acceptance.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const file = join(directory, "NOVIKOV-Trimm-Test.ifc");
await writeFile(file, await exportIfc(trimAcceptanceProject(), new Date("2026-10-31T12:00:00Z")));
process.stdout.write(file + "\n");
