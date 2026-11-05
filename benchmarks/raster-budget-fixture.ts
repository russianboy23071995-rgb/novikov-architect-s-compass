import { deflateSync } from "node:zlib";
import { createProject } from "../src/application/projects/create.ts";
import { validateProject } from "../src/domain/project/schema.ts";
/** Real RGB PNGs with distinct solid colours: compression does not reduce decoded pixels. */
export function rasterFixture(count: number, duplicate = false) {
  const crc = (data: Buffer) => {
    let n = 0xffffffff;
    for (const byte of data) {
      n ^= byte;
      for (let i = 0; i < 8; i++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
    }
    return (n ^ 0xffffffff) >>> 0;
  };
  const chunk = (kind: string, data: Buffer) => {
    const head = Buffer.from(kind),
      size = Buffer.alloc(4),
      check = Buffer.alloc(4);
    size.writeUInt32BE(data.length);
    check.writeUInt32BE(crc(Buffer.concat([head, data])));
    return Buffer.concat([size, head, data, check]);
  };
  const png = (shade: number) => {
    const row = Buffer.alloc(12001, shade);
    row[0] = 0;
    const raw = Buffer.alloc(row.length * 4000);
    for (let i = 0; i < 4000; i++) row.copy(raw, i * row.length);
    const header = Buffer.alloc(13);
    header.writeUInt32BE(4000);
    header.writeUInt32BE(4000, 4);
    header[8] = 8;
    header[9] = 2;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]).toString("base64");
  };
  const p = createProject("pixel-ü", "eg"),
    same = duplicate ? png(240) : "";
  const assets = Array.from({ length: count }, (_, i) => ({
    id: `a${i}`,
    mimeType: "image/png" as const,
    pixelWidth: 4000,
    pixelHeight: 4000,
    data: duplicate ? same : png(240 - i),
  }));
  return validateProject({
    ...p,
    assets,
    storeys: p.storeys.map((s) => ({
      ...s,
      references: assets.map((a, i) => ({
        id: `r${i}`,
        kind: "image-reference",
        assetId: a.id,
        layerId: p.layers[0]!.id,
        origin: { x: i * 5, y: 0 },
        rotation: 0,
        metresPerPixel: 0.001,
      })),
    })),
  });
}
