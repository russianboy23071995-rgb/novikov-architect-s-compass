import type { Project } from "../../domain/project/schema.ts";
import {
  PAPER_FORMAT_LABELS,
  layoutSheet,
  projectLayouts,
  projectMasterLayouts,
} from "../../domain/views/layouts.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { ProjectInfo } from "../../domain/views/layouts.ts";
import { drawingInfo } from "./drawing-info.ts";

/**
 * Automatic texts of title blocks (docs/PLANKOPF.md, AT1): a text in the Plankopfplaner holds
 * placeholders like „{Maßstab}“; on every sheet they read the values of that layout.
 */
export const AUTO_TEXT_FIELDS = [
  { key: "Zeichnungsname", group: "Zeichnung" },
  { key: "Maßstab", group: "Zeichnung" },
  { key: "Zeichnungsart", group: "Zeichnung" },
  { key: "Layoutname", group: "Layout" },
  { key: "Plannummer", group: "Layout" },
  { key: "Index", group: "Layout" },
  { key: "Blattgröße", group: "Layout" },
  { key: "Projektname", group: "Projekt" },
  { key: "Bauherr", group: "Projekt" },
  { key: "Projektadresse", group: "Projekt" },
  { key: "Planverfasser", group: "Projekt" },
  { key: "Datum", group: "Datum" },
] as const;
export type AutoTextKey = (typeof AUTO_TEXT_FIELDS)[number]["key"];
const KEYS = new Set<string>(AUTO_TEXT_FIELDS.map((f) => f.key));

export const autoTextPlaceholder = (key: AutoTextKey) => `{${key}}`;

/** Date as written on a plan, „02.11.2026“. */
export function planDate(date: Date): string {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(date.getDate())}.${two(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** The values of a layout or master layout; a value it has not is absent. */
export function autoTextValues(
  project: Project,
  sheetId: string,
  today: Date,
): Partial<Record<AutoTextKey, string>> {
  const layout = projectLayouts(project).find((l) => l.id === sheetId);
  const master = projectMasterLayouts(project).find((m) => m.id === sheetId);
  const sheet = layout ? layoutSheet(project, layout) : master?.sheet;
  const info = project.projectInfo ?? {};
  const drawing = layout?.documentId ? drawingInfo(project, layout.documentId) : null;
  const values: Partial<Record<AutoTextKey, string | undefined>> = {
    Zeichnungsname: drawing?.name,
    Maßstab: drawing?.scale,
    Zeichnungsart: drawing?.kindLabel,
    Layoutname: (layout ?? master)?.name,
    Plannummer: layout?.planNumber,
    Index: layout?.index,
    Blattgröße: sheet
      ? sheet.format === "custom"
        ? `${sheet.width} × ${sheet.height} mm`
        : PAPER_FORMAT_LABELS[sheet.format]
      : undefined,
    Projektname: info.name,
    Bauherr: info.client,
    Projektadresse: info.address,
    Planverfasser: info.author,
    Datum: planDate(today),
  };
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined));
}

/**
 * Replaces the known placeholders of a text. A missing value leaves the place empty, or, with
 * `keepMissing` (a master layout), shows the placeholder's name. Unknown braces stay as typed.
 */
export function resolveAutoText(
  content: string,
  values: Partial<Record<AutoTextKey, string>>,
  keepMissing = false,
): string {
  return content.replace(/\{([^{}]+)\}/g, (whole, key: string) =>
    KEYS.has(key) ? (values[key as AutoTextKey] ?? (keepMissing ? whole : "")) : whole,
  );
}

/** Project information for title blocks; empty fields are removed (one undo step). */
export function setProjectInfo(base: Project, current: Project, info: ProjectInfo): Project {
  if (base !== current)
    throw new Error("Das Projekt wurde geändert. Projektinformationen erneut öffnen.");
  const kept = Object.fromEntries(
    Object.entries(info).filter(([, v]) => typeof v === "string" && v.trim()),
  ) as ProjectInfo;
  const { projectInfo: _old, ...without } = current;
  return validateLike(
    current,
    Object.keys(kept).length ? { ...without, projectInfo: kept } : without,
  );
}
