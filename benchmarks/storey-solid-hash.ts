// node --experimental-strip-types benchmarks/storey-solid-hash.ts <module of buildSolid/buildPreviewSolid>
// Equality check for moving the storey solid (Stage B0, docs/plans/WALLWISE_REBUILD_CHANGE_MAP.md):
// hash of buildSolid/buildPreviewSolid per storey, the building solid and the IFC export of 14 models.
// Before: src/lib/bim/geometry.ts on main; after: src/rendering/viewport/storey-solid.ts.
import { createHash } from "node:crypto";
import { schoolFixture } from "./school-fixture.ts";
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { tAcceptanceProject, tAcceptanceVariants, tVariantProject } from "./t-ifc-acceptance.ts";
import { createExampleProject } from "../src/components/cad/bim-view.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";

const mod = await import(new URL(`../${process.argv[2]}`, import.meta.url).href);
const h = createHash("sha256");
const models = [
  createExampleProject(),
  schoolPlanFixture(),
  schoolPlanFixture({ wings: 3, desksPerRoom: 50 }),
  schoolFixture(20000),
  tAcceptanceProject(),
  ...tAcceptanceVariants().map(tVariantProject),
];
for (const p of models) {
  for (const s of p.storeys) {
    const q = selectWorkingStorey(p, p, s.id);
    h.update(JSON.stringify(mod.buildSolid(q)));
    h.update(JSON.stringify(mod.buildPreviewSolid(q, 0)));
  }
  h.update(JSON.stringify(buildBuildingSolid(p).faces));
  h.update(await exportIfc(p, new Date(0)));
}
console.log(models.length, h.digest("hex"));
