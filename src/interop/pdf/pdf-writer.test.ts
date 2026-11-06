import test from "node:test";
import { penFactor, PDF_PENS } from "./pens.ts";
import assert from "node:assert/strict";
import { PT_PER_MM, winAnsiHex, writePdf, type PdfCommand } from "./pdf-writer.ts";

const black = { r: 0, g: 0, b: 0 };
const text = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

/** Every object the cross-reference table names starts exactly at its offset. */
function checkXref(pdf: string) {
  const start = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(pdf)![1]);
  assert.ok(pdf.slice(start).startsWith("xref\n"));
  const entries = [...pdf.slice(start).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
  entries.forEach((offset, i) => assert.ok(pdf.slice(offset).startsWith(`${i + 1} 0 obj\n`)));
  return entries.length;
}

// docs/PDF_EXPORT.md, PDF1.
test("a page in exact paper size; a 100 mm line is 100 mm in the file", () => {
  const width = 420 * PT_PER_MM,
    height = 297 * PT_PER_MM;
  const commands: PdfCommand[] = [
    {
      kind: "path",
      subpaths: [
        {
          start: { x: 10 * PT_PER_MM, y: 20 * PT_PER_MM },
          segments: [{ kind: "line", to: { x: 110 * PT_PER_MM, y: 20 * PT_PER_MM } }],
          closed: false,
        },
      ],
      stroke: { color: black, alpha: 1, width: 0.75, dash: [3, 2] },
    },
  ];
  const pdf = text(writePdf({ width, height, commands }));
  assert.ok(pdf.startsWith("%PDF-1.4\n"));
  assert.match(pdf, /\/MediaBox \[0 0 1190\.551 841\.89\]/);
  const [, x0, , x1] = /([\d.]+) ([\d.]+) m\n([\d.]+) ([\d.]+) l/.exec(pdf)!.map(Number);
  assert.ok(Math.abs((x1! - x0!) / PT_PER_MM - 100) < 0.001);
  assert.match(pdf, /\[3 2\] 0 d/);
  assert.equal(checkXref(pdf), 7);
  // Content length matches the stream.
  const [, length, body] = /4 0 obj\n<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/.exec(
    pdf,
  )!;
  assert.equal(body!.length, Number(length));
});

test("text in WinAnsi, fills with opacity, clipping and tiling patterns", () => {
  assert.equal(winAnsiHex("Maßstab Ä„“€😀"), "<4d61df7374616220c48493803f>");
  const square = {
    start: { x: 0, y: 0 },
    segments: [
      { kind: "line" as const, to: { x: 10, y: 0 } },
      { kind: "line" as const, to: { x: 10, y: 10 } },
    ],
    closed: true,
  };
  const pdf = text(
    writePdf({
      width: 100,
      height: 100,
      commands: [
        { kind: "clip", subpaths: [square] },
        { kind: "path", subpaths: [square], fill: { kind: "color", color: black, alpha: 0.5 } },
        {
          kind: "path",
          subpaths: [square],
          fill: {
            kind: "pattern",
            alpha: 1,
            pattern: {
              box: { x: 0, y: 0, width: 2, height: 2 },
              matrix: [1, 0, 0, 1, 0, 0],
              lines: [{ from: { x: 0, y: 0 }, to: { x: 2, y: 2 } }],
              color: black,
              lineWidth: 0.1,
            },
          },
        },
        { kind: "unclip" },
        {
          kind: "text",
          text: "Grundriss Erdgeschoß",
          at: { x: 5, y: 5 },
          size: 3.5,
          angle: Math.PI / 2,
          color: black,
          alpha: 1,
          bold: true,
        },
      ],
    }),
  );
  assert.match(pdf, /q\n0 0 m\n10 0 l\n10 10 l\nh\nW n/);
  assert.match(pdf, /\/ExtGState << \/ca 0\.5 \/CA 1 >>|\/Type \/ExtGState \/ca 0\.5 \/CA 1/);
  assert.match(pdf, /\/PatternType 1 \/PaintType 1 \/TilingType 1 \/BBox \[0 0 2 2\]/);
  assert.match(pdf, /\/Pattern cs\n\/P1 scn/);
  assert.match(pdf, /\/F2 3\.5 Tf\n0 1 -1 0 5 5 Tm/);
  assert.match(pdf, /\/BaseFont \/Helvetica-Bold/);
  checkXref(pdf);
});

test("pens: one pixel of a pen gives its millimetres on paper, unknown pens stay", () => {
  const mm = (pen: string | null) => (0.75 * penFactor(pen) * 25.4) / 72;
  assert.ok(Math.abs(mm("cut") - PDF_PENS.cut) < 1e-9);
  assert.ok(Math.abs(mm("fine") - 0.13) < 1e-9);
  assert.ok(Math.abs(1.75 * mm("section") - 0.5) < 0.001);
  assert.equal(penFactor(null), 1);
  assert.equal(penFactor("unbekannt"), 1);
});
