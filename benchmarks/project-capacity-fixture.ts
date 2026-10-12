/** Reuse the generated 1550px PNG; emit three portable assets above the old 10-MiB limit. */
import { readFileSync, writeFileSync } from "node:fs";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
const png = readFileSync(process.argv[2]!);
if (png.readUInt32BE(16) !== 1550 || png.readUInt32BE(20) !== 1550)
  throw new Error("Expected generated 1550px PNG");
const p = recoveryFixture("capacity32-browser", 0, {
  id: "large-0",
  mimeType: "image/png",
  pixelWidth: 1550,
  pixelHeight: 1550,
  data: png.toString("base64"),
});
const asset = p.assets[0]!;
const ref = p.storey.references[0]!;
p.assets = Array.from({ length: 3 }, (_, i) => ({ ...asset, id: `large-${i}` }));
p.storey.references = Array.from({ length: 3 }, (_, i) => ({
  ...ref,
  id: `ref-${i}`,
  assetId: `large-${i}`,
  origin: { x: i * 5, y: 2 },
}));
const json = serializeProject(p);
writeFileSync(process.argv[3]!, json);
console.log(Buffer.byteLength(json));
