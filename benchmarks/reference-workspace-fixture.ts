import { storeyOf } from "../src/domain/storeys/access.ts";
import { readFileSync, writeFileSync } from "node:fs";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
const png = readFileSync(process.argv[2]!);
if (png.readUInt32BE(16) !== 1550 || png.readUInt32BE(20) !== 1550)
  throw new Error("Expected generated 1550px PNG");
const project = recoveryFixture("acceptance-large-reference-253", 0, {
  id: "acceptance-image",
  mimeType: "image/png",
  pixelWidth: 1550,
  pixelHeight: 1550,
  data: png.toString("base64"),
});
storeyOf(project).references[0]!.origin = { x: 0, y: 2 };
writeFileSync(process.argv[3]!, serializeProject(project));
console.log(Buffer.byteLength(serializeProject(project)));
