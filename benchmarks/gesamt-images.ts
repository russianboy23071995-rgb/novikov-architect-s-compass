import { deflateSync } from "node:zlib";
import { GESAMT_IMAGES, type GesamtImage } from "./gesamt-fixture.ts";

// Node only: the images of the Gesamtnachweis model as real RGB PNGs (benchmarks/gesamt-fixture.ts).
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
/** A real 4000 × 4000 RGB PNG; stripes per shade keep the files distinct. */
function png(shade: number) {
  const row = Buffer.alloc(GESAMT_IMAGES.pixels * 3 + 1, shade);
  row[0] = 0;
  for (let x = 1; x < row.length; x += 97) row[x] = (shade * 7 + x) & 255;
  const raw = Buffer.alloc(row.length * GESAMT_IMAGES.pixels);
  for (let i = 0; i < GESAMT_IMAGES.pixels; i++) row.copy(raw, i * row.length);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(GESAMT_IMAGES.pixels);
  header.writeUInt32BE(GESAMT_IMAGES.pixels, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]).toString("base64");
}

export const gesamtImages = (): GesamtImage[] =>
  Array.from({ length: GESAMT_IMAGES.count }, (_, i) => ({ data: png(230 - i * 9) }));
