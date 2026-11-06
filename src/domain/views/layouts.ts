import { z } from "zod";

/**
 * Plan layouts (docs/LAYOUTS.md, L13): sheets of paper collected in the navigator tab
 * „Layouts“. A layout normally follows a master layout, which sets its paper and margins and
 * whose drawing every following layout shows (user decision 02.11.2026). Without a master the
 * layout keeps its own paper settings. Folders nest below the fixed folder „Layoutsammlung“.
 * Lengths on paper are millimetres.
 */
const id = z.string().trim().min(1);
const name = z.string().trim().min(1).max(120);

/** DIN EN ISO 216 A sizes, portrait width × height in mm, plus a free size. */
export const PAPER_FORMATS = ["A0", "A1", "A2", "A3", "A4", "A5", "custom"] as const;
export type PaperFormat = (typeof PAPER_FORMATS)[number];
export const PAPER_SIZES: Record<
  Exclude<PaperFormat, "custom">,
  { width: number; height: number }
> = {
  A0: { width: 841, height: 1189 },
  A1: { width: 594, height: 841 },
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
};
export const PAPER_FORMAT_LABELS: Record<PaperFormat, string> = {
  A0: "DIN A0",
  A1: "DIN A1",
  A2: "DIN A2",
  A3: "DIN A3",
  A4: "DIN A4",
  A5: "DIN A5",
  custom: "Frei",
};
export const MIN_SHEET_MM = 50;
export const MAX_SHEET_MM = 5000;
const millimetres = z.number().finite();

export const sheetSchema = z
  .object({
    format: z.enum(PAPER_FORMATS),
    orientation: z.enum(["portrait", "landscape"]),
    /** Free size only: width × height as drawn, already in the chosen orientation. */
    width: millimetres.min(MIN_SHEET_MM).max(MAX_SHEET_MM).optional(),
    height: millimetres.min(MIN_SHEET_MM).max(MAX_SHEET_MM).optional(),
    margins: z
      .object({
        top: millimetres.min(0).max(500),
        right: millimetres.min(0).max(500),
        bottom: millimetres.min(0).max(500),
        left: millimetres.min(0).max(500),
      })
      .strict(),
  })
  .strict()
  .superRefine((sheet, ctx) => {
    const problem = sheetProblem(sheet);
    if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
  });
export type Sheet = z.infer<typeof sheetSchema>;

export const masterLayoutSchema = z.object({ id, name, sheet: sheetSchema }).strict();
/** Schema 48: a master layout may carry a title block (docs/PLANKOPF.md, PK4). */
export const masterLayoutV48Schema = masterLayoutSchema
  .extend({ titleBlockId: id.optional() })
  .strict();
export type MasterLayout = z.infer<typeof masterLayoutV48Schema>;

/** A folder without parent lies directly in „Layoutsammlung“; the collection itself has none. */
export const layoutFolderSchema = z.object({ id, name, parentId: id.optional() }).strict();
export type LayoutFolder = z.infer<typeof layoutFolderSchema>;

/** Exactly one of masterId (follows the master) and sheet (own settings). */
const layoutShape = {
  id,
  name,
  folderId: id,
  masterId: id.optional(),
  sheet: sheetSchema.optional(),
};
const ONE_SHEET =
  "Ein Layout folgt entweder einem Masterlayout oder hat eigene Blatteinstellungen.";
export const layoutSchema = z
  .object(layoutShape)
  .strict()
  .refine((l) => (l.masterId === undefined) !== (l.sheet === undefined), ONE_SHEET);
/**
 * Schema 49: what the title block's automatic texts read from a layout (docs/PLANKOPF.md,
 * AT1): plan number, index and the drawing document it shows until drawings are placed.
 */
export const layoutV49Schema = z
  .object({
    ...layoutShape,
    planNumber: z.string().trim().min(1).max(40).optional(),
    index: z.string().trim().min(1).max(20).optional(),
    documentId: id.optional(),
  })
  .strict()
  .refine((l) => (l.masterId === undefined) !== (l.sheet === undefined), ONE_SHEET);
export type Layout = z.infer<typeof layoutV49Schema>;

/** Project information for title blocks (AT1); every field optional. */
export const projectInfoSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    client: z.string().trim().min(1).max(200).optional(),
    address: z.string().trim().min(1).max(300).optional(),
    author: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
export type ProjectInfo = z.infer<typeof projectInfoSchema>;

export const LAYOUT_COLLECTION_ID = "layout-collection";
export const LAYOUT_COLLECTION_NAME = "Layoutsammlung";
export const DEFAULT_MASTER_ID = "master-standard-a3";
export const DEFAULT_MARGINS = { top: 10, right: 10, bottom: 10, left: 20 } as const;
export const DEFAULT_LAYOUT_FOLDERS: readonly LayoutFolder[] = [
  { id: LAYOUT_COLLECTION_ID, name: LAYOUT_COLLECTION_NAME },
];
export const DEFAULT_MASTER_LAYOUTS: readonly MasterLayout[] = [
  {
    id: DEFAULT_MASTER_ID,
    name: "Standard A3 quer",
    sheet: { format: "A3", orientation: "landscape", margins: { ...DEFAULT_MARGINS } },
  },
];

type LayoutLibrary = {
  layoutFolders?: readonly LayoutFolder[] | undefined;
  layouts?: readonly Layout[] | undefined;
  masterLayouts?: readonly MasterLayout[] | undefined;
};
/** Until the first change a project uses the defaults and its file stays unchanged. */
export const projectLayoutFolders = (p: LayoutLibrary) => p.layoutFolders ?? DEFAULT_LAYOUT_FOLDERS;
export const projectLayouts = (p: LayoutLibrary) => p.layouts ?? [];
export const projectMasterLayouts = (p: LayoutLibrary) => p.masterLayouts ?? DEFAULT_MASTER_LAYOUTS;

/** Paper width × height in mm as laid out (orientation applied). */
export function sheetSize(sheet: Sheet): { width: number; height: number } {
  if (sheet.format === "custom") return { width: sheet.width!, height: sheet.height! };
  const { width, height } = PAPER_SIZES[sheet.format];
  return sheet.orientation === "landscape" ? { width: height, height: width } : { width, height };
}

export function sheetProblem(sheet: {
  format: PaperFormat;
  orientation: "portrait" | "landscape";
  width?: number | undefined;
  height?: number | undefined;
  margins: { top: number; right: number; bottom: number; left: number };
}): string | null {
  if (sheet.format === "custom") {
    if (sheet.width === undefined || sheet.height === undefined)
      return "Ein freies Format braucht Breite und Höhe.";
  } else if (sheet.width !== undefined || sheet.height !== undefined)
    return "Breite und Höhe gibt es nur beim freien Format.";
  const { width, height } = sheetSize(sheet as Sheet);
  const m = sheet.margins;
  if (m.left + m.right >= width || m.top + m.bottom >= height)
    return "Die Ränder lassen auf dem Blatt keinen Platz.";
  return null;
}

/** The sheet a layout uses: its master's while it follows one, else its own. */
export function layoutSheet(project: LayoutLibrary, layout: Layout): Sheet {
  if (layout.sheet) return layout.sheet;
  const master = projectMasterLayouts(project).find((m) => m.id === layout.masterId);
  if (!master) throw new Error("Das Masterlayout des Layouts fehlt.");
  return master.sheet;
}

/** Library rules, checked when a project is validated. Null when everything holds. */
export function layoutLibraryProblem(project: LayoutLibrary): string | null {
  const folders = projectLayoutFolders(project),
    masters = projectMasterLayouts(project);
  const roots = folders.filter((f) => f.parentId === undefined && f.id === LAYOUT_COLLECTION_ID);
  if (roots.length !== 1 || roots[0]!.name !== LAYOUT_COLLECTION_NAME)
    return "Der Ordner „Layoutsammlung“ fehlt.";
  const folderIds = new Set(folders.map((f) => f.id));
  if (folderIds.size !== folders.length) return "Doppelte Layoutordner-ID.";
  for (const folder of folders) {
    if (folder.id === LAYOUT_COLLECTION_ID) continue;
    if (folder.parentId !== undefined && !folderIds.has(folder.parentId))
      return `Layoutordner ${folder.name}: übergeordneter Ordner fehlt.`;
    // Parents never loop back to the folder itself.
    const seen = new Set([folder.id]);
    for (let p = folder.parentId; p !== undefined;) {
      if (seen.has(p)) return `Layoutordner ${folder.name} liegt in sich selbst.`;
      seen.add(p);
      p = folders.find((f) => f.id === p)?.parentId;
    }
  }
  const masterIds = new Set(masters.map((m) => m.id));
  if (masterIds.size !== masters.length) return "Doppelte Masterlayout-ID.";
  if (new Set(masters.map((m) => m.name)).size !== masters.length)
    return "Masterlayouts brauchen eindeutige Namen.";
  for (const layout of projectLayouts(project)) {
    if (!folderIds.has(layout.folderId)) return `Layout ${layout.name}: Ordner fehlt.`;
    if (layout.masterId !== undefined && !masterIds.has(layout.masterId))
      return `Layout ${layout.name}: Masterlayout fehlt.`;
  }
  return null;
}

/** Folders in tree order with their depth below „Layoutsammlung“ (depth 0). */
/** The layouts of a folder and its subfolders, in the order of the navigator. */
export function layoutsInFolder(project: LayoutLibrary, folderId: string): Layout[] {
  const folders = projectLayoutFolders(project);
  const layouts = projectLayouts(project);
  const walk = (id: string): Layout[] => [
    ...folders
      .filter((f) => f.id !== LAYOUT_COLLECTION_ID && (f.parentId ?? LAYOUT_COLLECTION_ID) === id)
      .flatMap((f) => walk(f.id)),
    ...layouts.filter((l) => l.folderId === id),
  ];
  return walk(folderId);
}

export function layoutFolderTree(
  project: LayoutLibrary,
): { folder: LayoutFolder; depth: number }[] {
  const folders = projectLayoutFolders(project);
  const out: { folder: LayoutFolder; depth: number }[] = [];
  const walk = (folder: LayoutFolder, depth: number) => {
    out.push({ folder, depth });
    for (const child of folders)
      if (
        child.id !== LAYOUT_COLLECTION_ID &&
        (child.parentId ?? LAYOUT_COLLECTION_ID) === folder.id
      )
        walk(child, depth + 1);
  };
  walk(
    folders.find((f) => f.id === LAYOUT_COLLECTION_ID)!,
    0,
  );
  return out;
}
