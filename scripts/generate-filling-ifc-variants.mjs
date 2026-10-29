// node --experimental-strip-types scripts/generate-filling-ifc-variants.mjs <output-directory>
// Archicad trial of window and door sizes (docs/T_IFC_ACCEPTANCE.md, 29.10.2026): the same
// room in three filling variants (thin placeholder body, wall-thick body, type and quantities).
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  FILLING_VARIANTS,
  exportFillingVariant,
  fillingAcceptanceProject,
} from "../benchmarks/filling-ifc-acceptance.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const project = fillingAcceptanceProject();
for (const [name, options] of FILLING_VARIANTS) {
  const file = join(directory, `NOVIKOV-Fenster-${name}.ifc`);
  await writeFile(
    file,
    await exportFillingVariant(project, options, new Date("2026-10-29T12:00:00Z")),
  );
  process.stdout.write(file + "\n");
}
