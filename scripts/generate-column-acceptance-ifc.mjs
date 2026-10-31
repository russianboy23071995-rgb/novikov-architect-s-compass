// node --experimental-strip-types scripts/generate-column-acceptance-ifc.mjs <output-directory>
// Archicad acceptance of columns as IfcColumn (docs/STUETZEN.md, P3): wall ring with four
// columns, exported through the regular IFC export.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { columnAcceptanceProject } from "../benchmarks/column-ifc-acceptance.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const file = join(directory, "NOVIKOV-Stuetzen-Test.ifc");
await writeFile(file, await exportIfc(columnAcceptanceProject(), new Date("2026-10-31T12:00:00Z")));
process.stdout.write(file + "\n");
