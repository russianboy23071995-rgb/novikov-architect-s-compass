// node --experimental-strip-types scripts/generate-t-acceptance-ifc.mjs <output-directory>
// Archicad acceptance of T junctions (docs/T_IFC_ACCEPTANCE.md): the regular IFC export of every
// T variant the program creates today, one combined file with all variants 40 m apart, one file
// per variant and the expected values (independent of the wall derivation) as JSON.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import {
  T_ACCEPTANCE_HEIGHT as height,
  T_ACCEPTANCE_WINDOW as window,
  tAcceptanceProject,
  tAcceptanceVariants,
  tVariantProject,
} from "../benchmarks/t-ifc-acceptance.ts";

const directory = process.argv[2];
if (!directory) throw new Error("Output directory required");
await mkdir(directory, { recursive: true });
const timestamp = new Date("2026-10-27T12:00:00Z");
const round = (value) => Math.round(value * 1e4) / 1e4;
const variants = tAcceptanceVariants();
await writeFile(
  join(directory, "NOVIKOV-T-Anschluss-Test.ifc"),
  await exportIfc(tAcceptanceProject(), timestamp),
);
for (const variant of variants)
  await writeFile(
    join(directory, `${variant.name}.ifc`),
    await exportIfc(tVariantProject(variant), timestamp),
  );
await writeFile(
  join(directory, "erwartete-werte.json"),
  JSON.stringify(
    {
      height,
      window,
      variants: variants.map((variant, i) => ({
        name: variant.name,
        label: variant.label,
        // Position in the combined file; wall names there carry the prefix `${name}-`.
        offsetX: i * 40,
        walls: Object.fromEntries(
          Object.entries(variant.expected).map(([id, e]) => [
            id,
            {
              planArea: round(e.area),
              thickness: e.thickness,
              windows: e.windows,
              netVolume: round(
                e.area * height - e.windows * window.width * window.height * e.thickness,
              ),
            },
          ]),
        ),
        contacts: variant.contacts,
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(`Generated ${variants.length} T variants and the combined acceptance file.`);
