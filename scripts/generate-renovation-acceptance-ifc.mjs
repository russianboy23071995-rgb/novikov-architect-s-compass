// node --experimental-strip-types scripts/generate-renovation-acceptance-ifc.mjs <output-directory>
// Archicad acceptance of the wall renovation status (docs/BAUZUSTAND.md, S2): three walls
// Bestand, Neubau, Abbruch, exported through the regular IFC export.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { renovationAcceptanceProject } from "../benchmarks/renovation-ifc-acceptance.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const file = join(directory, "NOVIKOV-Bauzustand-Test.ifc");
await writeFile(
  file,
  await exportIfc(renovationAcceptanceProject(), new Date("2026-10-31T12:00:00Z")),
);
process.stdout.write(file + "\n");
