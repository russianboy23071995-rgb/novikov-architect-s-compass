import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { readProjectFile } from "../src/lib/bim/history.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { prepareZTranslation } from "../src/application/selection/z-translation.ts";

// Run against the baseline, XY (+0.2 m Y on s0-w0/w1), and Z (+0.5 m on
// s4-w0/w1) exports from the isolated S1 GB workspace. Never print payloads or
// assertion object diffs: a failed geometry comparison needs only counts/hashes.
const paths = process.argv.slice(2);
if (paths.length !== 3) throw new Error("Expected baseline, XY, Z export paths");
const base = readProjectFile(readFileSync(paths[0]!, "utf8"));
const solid = buildBuildingSolid(base);
const digest = (faces: typeof solid.faces) =>
  createHash("sha256")
    .update(
      JSON.stringify(
        faces
          .map((face) =>
            JSON.stringify(face, (_key, value) =>
              typeof value === "number" ? Math.round(value * 1e10) / 1e10 : value,
            ),
          )
          .sort(),
      ),
    )
    .digest("hex");
const targets = ["s4-w0", "s4-w1"].map((id) => ({ kind: "wall" as const, id }));
const xy = prepareSelectionTranslation(base, ["s0-w0", "s0-w1"]);
const z = prepareZTranslation(base, targets);
const patches = [xy.evaluate({ x: 0, y: 0.2 }), z.evaluate(base, targets, 0.5)];
let failed = false;
for (const [index, patch] of patches.entries()) {
  // Load one completed export at a time; image bytes are validated by the
  // normal import boundary, but excluded from the geometry comparison/output.
  const full = buildBuildingSolid(readProjectFile(readFileSync(paths[index + 1]!, "utf8")));
  const preview = selectionMoveSurfaces(solid, base, patch);
  const expected = digest(full.faces);
  const actual = digest(preview.faces);
  const pass = preview.faces.length === full.faces.length && actual === expected;
  failed ||= !pass;
  console.log(
    JSON.stringify({
      axis: index === 0 ? "XY" : "Z",
      pass,
      faces: preview.faces.length,
      fullFaces: full.faces.length,
      previewHash: actual,
      fullHash: expected,
      coordinateRounding: 1e-10,
      assets: base.assets.length,
    }),
  );
}
process.exitCode = failed ? 1 : 0;
