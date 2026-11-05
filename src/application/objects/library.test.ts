import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addObject, defaultObjectLayerId, updateObject } from "./actions.ts";
import { chooseObject, objectSettings, objectToolDefaults, objectValues } from "./defaults.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import {
  OBJECT_CATALOG,
  OBJECT_CATALOG_IDS,
  OBJECT_GENRES,
} from "../../domain/elements/object/catalog.ts";
import { objectRule } from "../../domain/elements/object/rules.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  objectAxonometricPreview,
  objectPlanPreview,
} from "../../rendering/viewport/object-preview.ts";

// docs/OBJEKTBIBLIOTHEK.md, M1.
const project = () => createStandardProject("p", "eg", "og");

test("every catalogue entry has a genre, every genre has entries", () => {
  for (const id of OBJECT_CATALOG_IDS) assert.ok(OBJECT_CATALOG[id].genre in OBJECT_GENRES, id);
  for (const genre of Object.keys(OBJECT_GENRES))
    assert.ok(
      OBJECT_CATALOG_IDS.some((id) => OBJECT_CATALOG[id].genre === genre),
      genre,
    );
});

test("choosing an entry takes its size, turn, status and layer stay", () => {
  const start = { ...objectToolDefaults("ebene"), rotation: 30, renovation: "demolish" as const };
  const wc = chooseObject(start, "wc");
  const { width, depth, height } = OBJECT_CATALOG.wc.size;
  assert.deepEqual(
    [wc.width, wc.depth, wc.height, wc.rotation, wc.renovation, wc.layerId],
    [width, depth, height, 30, "demolish", "ebene"],
  );
  // The same entry again keeps edited sizes.
  const edited = { ...wc, width: 1 };
  assert.equal(chooseObject(edited, "wc"), edited);
});

test("tool values place an object, settings read it back, pipette hands them over", () => {
  let p = project();
  const values = {
    ...chooseObject(objectToolDefaults(defaultObjectLayerId(p)), "sofa"),
    width: 2.4,
    rotation: 90,
    mirrored: true,
  };
  p = addObject(p, { id: "o", position: { x: 1, y: 2 }, ...objectValues(values) });
  const placed = storeyOf(p).objects![0]!;
  assert.deepEqual(objectSettings(placed), values);
  const pickup = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "object",
    id: "o",
  });
  assert.deepEqual(pickup, { tool: "library", values });
  // Unmirrored values store no key; the properties can clear it explicitly.
  assert.equal("mirrored" in objectValues({ ...values, mirrored: false }), false);
  const cleared = updateObject(p, "o", { mirrored: false });
  assert.equal(objectSettings(storeyOf(cleared).objects![0]!).mirrored, false);
});

test("previews: the plan stays in the box, the 3D view has three faces per box", () => {
  for (const id of OBJECT_CATALOG_IDS) {
    const object = { catalogId: id, ...OBJECT_CATALOG[id].size };
    const plan = objectPlanPreview(object);
    assert.ok(plan.lines.length > 0, id);
    // A symbol stays inside the box; the WC, for one, does not fill it.
    assert.ok(plan.bounds.width <= object.width + 1e-9, id);
    assert.ok(plan.bounds.height <= object.depth + 1e-9, id);
    const view = objectAxonometricPreview(object);
    // Build rules (M2) have their own parts; plain boxes show three faces each.
    if (!objectRule(id)) assert.equal(view.faces.length, OBJECT_CATALOG[id].boxes.length * 3, id);
    assert.ok(
      view.faces.flatMap((f) => f.points).every((q) => Number.isFinite(q.x + q.y)),
      id,
    );
  }
  // Wider entries draw wider.
  const narrow = objectPlanPreview({ catalogId: "table", width: 1, depth: 1, height: 0.75 });
  const wide = objectPlanPreview({ catalogId: "table", width: 3, depth: 1, height: 0.75 });
  assert.ok(wide.bounds.width > narrow.bounds.width);
});
