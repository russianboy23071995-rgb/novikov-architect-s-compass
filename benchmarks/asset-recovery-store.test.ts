import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../src/lib/bim/model.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { createPreparation, openPilotDatabase } from "./asset-recovery-store.ts";
import { restoreProject } from "./asset-contract.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=";
const asset = () => ({
  id: "a",
  mimeType: "image/png" as const,
  pixelWidth: 1,
  pixelHeight: 1,
  data: png,
});

test("prepared immutable images survive model revisions without rehashing", async () => {
  const p = recoveryFixture("p", 1);
  p.assets.push(createImageAssetHandle(asset()));
  const prep = createPreparation();
  const first = await prep.prepare(p);
  const changed = validateProject({
    ...p,
    storey: { ...p.storey, lines: p.storey.lines!.map((line) => ({ ...line, color: "#998877" })) },
  });
  const second = await prep.prepare(changed);
  assert.equal(prep.hashes, 1);
  assert.equal(second.blobs[second.model.assets[0]!.key], first.blobs[first.model.assets[0]!.key]);
  assert.deepEqual(restoreProject(second), changed);
  assert.equal(first.model.storey.lines![0]!.color, "#334455");
});

test("mutable external asset identity cannot reuse a stale content key", async () => {
  const p = createProject("p", "s"),
    raw = asset();
  p.assets.push(raw);
  const prep = createPreparation(),
    first = await prep.prepare(p);
  raw.data = png.replace("42mP8", "42mP9");
  const second = await prep.prepare(p);
  assert.notEqual(first.model.assets[0]!.key, second.model.assets[0]!.key);
  assert.equal(restoreProject(first).assets[0]!.data, png);
  assert.equal(restoreProject(second).assets[0]!.data, raw.data);
});

test("pilot rejects header mismatches and cannot open production databases", async () => {
  const p = createProject("p", "s");
  p.assets.push({ ...asset(), pixelWidth: 2 });
  await assert.rejects(() => createPreparation().prepare(p));
  assert.throws(() => openPilotDatabase("novikov-production"), /Diagnostic database only/);
});
