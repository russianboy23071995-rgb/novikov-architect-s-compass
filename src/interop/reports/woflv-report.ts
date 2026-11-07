import { PT_PER_MM, type PdfColor, type PdfCommand, type PdfPage } from "../pdf/pdf-writer.ts";

/** What the report shows; it is handed the finished result and calculates nothing itself. */
export type LivingReportData = {
  rules: { name: string; version: number };
  grossArea: number;
  livingArea: number;
  storeys: readonly {
    name: string;
    grossArea: number;
    livingArea: number;
    rooms: readonly {
      number: string;
      name: string;
      useLabel: string;
      result: {
        grossArea: number;
        livingArea: number;
        steps: readonly { label: string; rule: string; area: number; share: number }[];
        notes: readonly string[];
      };
    }[];
  }[];
};
export type LivingReportHeader = {
  project?: string | undefined;
  client?: string | undefined;
  address?: string | undefined;
  author?: string | undefined;
  date: string;
};

const WIDTH = 210 * PT_PER_MM;
const HEIGHT = 297 * PT_PER_MM;
const LEFT = 20 * PT_PER_MM;
const RIGHT = WIDTH - LEFT;
const TOP = HEIGHT - 20 * PT_PER_MM;
const BOTTOM = 22 * PT_PER_MM;
const SIZE = 9;
const LINE = 12.5;
const RULE_X = LEFT + 250;
const AREA_X = RIGHT - 125;
const SHARE_X = RIGHT - 75;
const BLACK: PdfColor = { r: 0, g: 0, b: 0 };
const GREY: PdfColor = { r: 0.4, g: 0.4, b: 0.4 };
const AMBER: PdfColor = { r: 0.6, g: 0.35, b: 0 };

const m2 = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = (share: number) => `${(share * 100).toLocaleString("de-DE")} %`;
const cut = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length - 1)}…` : text;

/** Helvetica advance widths of what the number columns hold, in thousandths of the size. */
const GLYPHS: Record<string, number> = { ",": 278, ".": 278, "-": 333, " ": 278, "%": 889 };
const numberWidth = (text: string, size: number) =>
  [...text].reduce((sum, char) => sum + (GLYPHS[char] ?? 556), 0) * size * 0.001;

/** Long sentences on lines of about `length` characters. */
function wrapped(text: string, length: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + word.length + 1 > length) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  return line ? [...lines, line] : lines;
}

/**
 * The living area report (docs/WOHNFLAECHE.md, W5): A4 pages with the rule set, a summary and every
 * room with its calculation. A room stays on one page when it fits.
 */
export function livingAreaReport(data: LivingReportData, header: LivingReportHeader): PdfPage[] {
  const pages: PdfCommand[][] = [[]];
  let y = TOP;
  const commands = () => pages.at(-1)!;
  const text = (
    value: string,
    x: number,
    options: { size?: number; bold?: boolean; color?: PdfColor } = {},
  ) =>
    commands().push({
      kind: "text",
      text: value,
      at: { x, y },
      size: options.size ?? SIZE,
      angle: 0,
      color: options.color ?? BLACK,
      alpha: 1,
      ...(options.bold ? { bold: true } : {}),
    });
  const right = (value: string, x: number, bold = false) =>
    text(value, x - numberWidth(value, SIZE) * (bold ? 1.04 : 1), bold ? { bold } : {});
  const rule = () =>
    commands().push({
      kind: "path",
      subpaths: [
        {
          start: { x: LEFT, y: y - 3 },
          segments: [{ kind: "line", to: { x: RIGHT, y: y - 3 } }],
          closed: false,
        },
      ],
      stroke: { color: GREY, alpha: 1, width: 0.5 },
    });
  const newLine = (lines = 1) => {
    y -= LINE * lines;
  };
  const room = (lines: number) => {
    if (y - lines * LINE >= BOTTOM) return;
    pages.push([]);
    y = TOP;
  };
  const columns = () => {
    text("Teilfläche", LEFT, { color: GREY });
    text("Regel", RULE_X, { color: GREY });
    right("m²", AREA_X);
    right("Anteil", SHARE_X);
    right("Wohnfläche m²", RIGHT);
    rule();
    newLine();
  };

  text("Wohnflächenberechnung", LEFT, { size: 16, bold: true });
  newLine(2);
  for (const [label, value] of [
    ["Projekt", header.project],
    ["Bauherr", header.client],
    ["Adresse", header.address],
    ["Verfasser", header.author],
    ["Stand", header.date],
    ["Regelstand", `${data.rules.name}, Version ${data.rules.version}`],
  ] as const) {
    if (!value) continue;
    text(label, LEFT, { color: GREY });
    text(cut(value, 90), LEFT + 70);
    newLine();
  }
  newLine();
  for (const line of wrapped(
    "Berechnet aus dem Gebäudemodell. Das Ergebnis hängt von den Eingaben ab, insbesondere von Raumumrissen, Raumarten und Korrekturen, und ist keine geprüfte Fachaussage. Maßgeblich ist der fertige Bau (WoFlV § 3 Abs. 4). Gerechnet wird exakt, gerundet erst in der Anzeige; gerundete Zeilen können deshalb um 0,01 m² von der Summe abweichen.",
    105,
  )) {
    text(line, LEFT, { color: GREY });
    newLine();
  }
  newLine();
  text("Zusammenfassung", LEFT, { size: 11, bold: true });
  newLine(1.5);
  text("Geschoss", LEFT, { color: GREY });
  right("Grundfläche m²", SHARE_X);
  right("Wohnfläche m²", RIGHT);
  rule();
  newLine();
  for (const storey of data.storeys) {
    room(1);
    text(cut(storey.name, 60), LEFT);
    right(m2(storey.grossArea), SHARE_X);
    right(m2(storey.livingArea), RIGHT);
    newLine();
  }
  room(2);
  // The line closes the rows above; the total sits just under it.
  y += LINE;
  rule();
  y -= LINE + 3;
  text("Wohnfläche gesamt", LEFT, { bold: true });
  right(m2(data.grossArea), SHARE_X, true);
  right(m2(data.livingArea), RIGHT, true);
  newLine(2);

  for (const storey of data.storeys) {
    room(6);
    text(cut(storey.name, 60), LEFT, { size: 11, bold: true });
    newLine(1.5);
    for (const item of storey.rooms) {
      room(item.result.steps.length + item.result.notes.length + 4);
      text(cut(`${item.number} ${item.name}`, 50), LEFT, { bold: true });
      text(cut(item.useLabel, 50), RULE_X, { color: GREY });
      newLine();
      columns();
      for (const step of item.result.steps) {
        text(cut(step.label, 48), LEFT);
        text(step.rule, RULE_X);
        right(m2(step.area), AREA_X);
        right(percent(step.share), SHARE_X);
        right(m2(step.area * step.share), RIGHT);
        newLine();
      }
      text(`Grundfläche ${m2(item.result.grossArea)} m²`, LEFT, { color: GREY });
      right(m2(item.result.livingArea), RIGHT, true);
      newLine();
      for (const note of item.result.notes) {
        text(note, LEFT, { color: AMBER });
        newLine();
      }
      newLine(0.6);
    }
    room(2);
    text(`Summe ${cut(storey.name, 60)}`, LEFT, { bold: true });
    right(m2(storey.livingArea), RIGHT, true);
    newLine(2);
  }

  return pages.map((page, i) => {
    y = 12 * PT_PER_MM;
    const footer: PdfCommand[] = [];
    const label = `Seite ${i + 1} von ${pages.length}`;
    for (const [value, x] of [
      [cut(["Wohnflächenberechnung", header.project].filter(Boolean).join(" · "), 80), LEFT],
      [label, RIGHT - 50],
    ] as const)
      footer.push({
        kind: "text",
        text: value,
        at: { x, y },
        size: 7.5,
        angle: 0,
        color: GREY,
        alpha: 1,
      });
    return { width: WIDTH, height: HEIGHT, commands: [...page, ...footer] };
  });
}
