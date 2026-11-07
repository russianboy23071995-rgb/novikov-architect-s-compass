import test from "node:test";
import assert from "node:assert/strict";
import { writePdf, type PdfPage } from "../pdf/pdf-writer.ts";
import { livingAreaReport, type LivingReportData } from "./woflv-report.ts";

const room = (number: string) => ({
  number,
  name: "Wohnen",
  useLabel: "Wohnraum",
  result: {
    grossArea: 20,
    livingArea: 14.25,
    steps: [
      { label: "Lichte Höhe ab 2 m", rule: "§ 4 Nr. 1", area: 15, share: 1 },
      { label: "Schornstein", rule: "Eingabe", area: -0.75, share: 1 },
    ],
    notes: ["Ein Teil hat keine Decke."],
  },
});
const data = (rooms: number): LivingReportData => ({
  rules: { name: "WoFlV", version: 1 },
  grossArea: 20 * rooms,
  livingArea: 14.25 * rooms,
  storeys: [
    {
      name: "Erdgeschoss",
      grossArea: 20 * rooms,
      livingArea: 14.25 * rooms,
      rooms: Array.from({ length: rooms }, (_, i) => room(`R-${i + 1}`)),
    },
  ],
});
const texts = (page: PdfPage) => page.commands.flatMap((c) => (c.kind === "text" ? [c.text] : []));

test("the report shows the given values, rule set and the hint", () => {
  const pages = livingAreaReport(data(1), { project: "Haus", date: "07.11.2026" });
  assert.equal(pages.length, 1);
  assert.ok(Math.abs(pages[0]!.width - 595.28) < 0.01);
  const all = texts(pages[0]!);
  for (const value of [
    "Haus",
    "07.11.2026",
    "WoFlV, Version 1",
    "14,25",
    "-0,75",
    "100 %",
    "R-1 Wohnen",
  ])
    assert.ok(all.includes(value), value);
  assert.ok(all.some((t) => t.includes("keine geprüfte")));
  assert.ok(all.includes("Ein Teil hat keine Decke."));
  assert.equal(all.filter((t) => t === "Bauherr").length, 0);
});

test("many rooms: pages with numbers, nothing below the margin, a room stays together", () => {
  const pages = livingAreaReport(data(60), { date: "07.11.2026" });
  assert.ok(pages.length > 3);
  pages.forEach((page, i) => {
    assert.ok(texts(page).includes(`Seite ${i + 1} von ${pages.length}`));
    const body = page.commands.flatMap((c) => (c.kind === "text" && c.size >= 8 ? [c.at.y] : []));
    assert.ok(Math.min(...body) > 50, String(Math.min(...body)));
  });
  for (const page of pages.slice(1, -1)) {
    const all = texts(page);
    assert.equal(
      all.filter((t) => t.startsWith("R-")).length,
      all.filter((t) => t === "Schornstein").length,
    );
  }
  const pdf = new TextDecoder().decode(writePdf(pages));
  assert.ok(pdf.includes(`/Count ${pages.length}`));
});

test("numbers end at the right edge", () => {
  const [page] = livingAreaReport(data(1), { date: "x" });
  const edge = 595.28 - 56.69;
  // The second one is the result column; the first is the area column.
  const value = page!.commands.filter((c) => c.kind === "text" && c.text === "-0,75").at(-1);
  assert.ok(value?.kind === "text");
  // Five characters: 333 + 556 + 278 + 556 + 556 thousandths of 9 pt.
  assert.ok(Math.abs(value.at.x + 2.279 * 9 - edge) < 0.1);
});
