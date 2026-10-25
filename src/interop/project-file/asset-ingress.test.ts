import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { legacyFixtureJSON, legacyProjectFixture } from "../../test/legacy-project-fixture.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addLine,
  updateLine,
  serializeProject,
  validateProject,
} from "../../lib/bim/model.ts";
import { addWall, updateWall } from "../../application/walls/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { loadProjectData } from "./load.ts";
import { createImageAssetHandle } from "../../domain/elements/reference/model.ts";
import { validateProjectV9 } from "../../domain/project/schema.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../../lib/bim/history.ts";
function fixture() {
  const p = addLine(
    addWall(createProject("p", "s"), {
      id: "w",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
    }),
    {
      id: "l",
      kind: "line",
      points: [
        { x: 0, y: 2 },
        { x: 3, y: 2 },
      ],
      ...defaultLineAppearance,
    },
  );
  p.assets.push({
    id: "a",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=",
  });
  storeyOf(p).references.push({
    id: "r",
    kind: "image-reference",
    assetId: "a",
    layerId: p.defaultLayerIds.line,
    origin: { x: 0, y: 0 },
    rotation: 0,
    metresPerPixel: 1,
  });
  return p;
}

test("single asset ingress matches previous full path acceptance and values", () => {
  const assetChanges = [
    {},
    { data: "AA==" },
    { data: "AAA=" },
    { data: "AAAA" },
    { data: "AB==" },
    { data: "AAB=" },
    { data: "AAA" },
    { data: "AA=A" },
    { data: "AA\n=" },
    { data: "!!!!" },
    { data: "" },
    { mimeType: "image/svg+xml" },
    { pixelWidth: 0 },
    { pixelWidth: 16385 },
    { pixelWidth: 4001, pixelHeight: 4000 },
    { pixelWidth: 4000, pixelHeight: 4000 },
    { pixelHeight: 1.5 },
    { trusted: true },
    { id: "  a  " },
  ];
  for (const change of assetChanges) {
    const source = fixture();
    Object.assign(source.assets[0]!, change);
    const input = JSON.parse(legacyFixtureJSON(source));
    let expected;
    try {
      const parsed = validateProject(input);
      expected = { ...parsed, assets: parsed.assets.map(createImageAssetHandle) };
    } catch {
      assert.throws(() => loadProjectData(legacyProjectFixture(input)));
      continue;
    }
    assert.deepEqual(loadProjectData(legacyProjectFixture(input)), expected);
  }
});

test("file boundary owns fresh frozen assets and does not trust IDs or frozen impostors", () => {
  const input = fixture(),
    before = structuredClone(input);
  const loaded = loadProjectData(legacyProjectFixture(input));
  assert.deepEqual(input, before);
  assert.notEqual(loaded.assets[0], input.assets[0]);
  input.assets[0]!.data = "!!!!";
  assert.equal(loaded.assets[0]!.data, before.assets[0]!.data);
  assert.ok(Object.isFrozen(loaded.assets[0]));
  const again = loadProjectData(legacyProjectFixture(loaded));
  assert.notEqual(again.assets[0], loaded.assets[0]);
  const forged = fixture();
  forged.assets[0] = Object.freeze({ ...forged.assets[0]!, data: "!!!!" });
  assert.throws(() => loadProjectData(legacyProjectFixture(forged)));
});

test("validated assets survive version-9 migration while model relationships remain checked", () => {
  const source = fixture();
  const { hatchPatterns: _patterns, ...version9 } = source;
  const old = validateProjectV9(legacyProjectFixture({ ...version9, schemaVersion: 9 }));
  const before = structuredClone(old),
    migrated = loadProjectData(legacyProjectFixture(old));
  assert.deepEqual(old, before);
  assert.equal(migrated.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(migrated.assets, source.assets);
  assert.ok(Object.isFrozen(migrated.assets[0]));
  assert.equal(validateProject(migrated).assets[0], migrated.assets[0]);
  assert.throws(() =>
    loadProjectData(legacyProjectFixture({ ...old, assets: [...old.assets, ...old.assets] })),
  );
  assert.throws(() =>
    loadProjectData(
      legacyProjectFixture({
        ...replaceStorey(old, {
          ...storeyOf(old),
          references: storeyOf(old).references.map((r) => ({ ...r, assetId: "missing" })),
        }),
      }),
    ),
  );
});

test("incoming project byte limit remains enforced before asset preparation", () => {
  const source = fixture();
  source.assets[0]!.data = "AAAA".repeat(33 * 1024 * 1024);
  assert.throws(() => readProjectFile(legacyFixtureJSON(source)), /128 MiB/);
});
test("file ingress renews handles and shares them through wall/line edits and history", () => {
  const source = fixture(),
    loaded = readProjectFile(serializeProject(source)),
    asset = loaded.assets[0]!;
  assert.deepEqual(loaded, source);
  assert.ok(Object.isFrozen(asset));
  assert.notEqual(asset, source.assets[0]);
  let h = createHistory(loaded);
  h = commitProject(h, updateLine(h.present, "l", { color: "#abcdef" }));
  h = commitProject(h, updateWall(h.present, "w", { height: 3 }));
  assert.equal(h.present.assets[0], asset);
  assert.equal(h.past[0]!.assets[0], asset);
  assert.deepEqual(redoProject(undoProject(h)), h);
  assert.deepEqual(undoProject(undoProject(h)).present, loaded);
  const reopened = readProjectFile(serializeProject(h.present));
  assert.deepEqual(reopened, h.present);
  assert.notEqual(reopened.assets[0], asset);
  assert.equal(validateProject(reopened).assets[0], reopened.assets[0]);
  assert.equal(reopened.schemaVersion, PROJECT_SCHEMA_VERSION);
});
test("file ingress rejects corrupt storage, references and geometry before returning handles", () => {
  for (const mutate of [
    (p: ReturnType<typeof fixture>) => {
      p.assets[0]!.data = "!!!!";
    },
    (p: ReturnType<typeof fixture>) => {
      p.assets[0]!.pixelWidth = 20000;
    },
    (p: ReturnType<typeof fixture>) => {
      storeyOf(p).references[0]!.assetId = "missing";
    },
    (p: ReturnType<typeof fixture>) => {
      storeyOf(p).walls[0]!.height = -1;
    },
  ]) {
    const p = fixture();
    mutate(p);
    assert.throws(() => readProjectFile(legacyFixtureJSON(p)));
  }
  assert.throws(() => readProjectFile('{"schemaVersion":9'));
});
