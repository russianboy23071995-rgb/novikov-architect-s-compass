import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import {
  PAPER_FORMATS,
  PAPER_FORMAT_LABELS,
  PAPER_SIZES,
  projectLayouts,
  projectMasterLayouts,
  sheetProblem,
  sheetSize,
  type LayoutFolder,
  type PaperFormat,
  type Sheet,
} from "@/domain/views/layouts";
import type { LayoutAction } from "@/application/views/layouts";
import { FloatingPanel } from "./FloatingPanel";

/** What the window edits: a new or existing layout, or a new or existing master layout. */
export type LayoutDraftTarget =
  | { kind: "layout"; id?: string; folderId: string; name: string }
  | { kind: "master"; id?: string; name: string };

type SheetFields = {
  format: PaperFormat;
  orientation: Sheet["orientation"];
  width: string;
  height: string;
  top: string;
  right: string;
  bottom: string;
  left: string;
};
const text = (v: number) => String(v).replace(".", ",");
const fieldsOf = (sheet: Sheet): SheetFields => {
  const size = sheetSize(sheet);
  return {
    format: sheet.format,
    orientation: sheet.orientation,
    width: text(size.width),
    height: text(size.height),
    top: text(sheet.margins.top),
    right: text(sheet.margins.right),
    bottom: text(sheet.margins.bottom),
    left: text(sheet.margins.left),
  };
};
function millimetres(value: string, label: string): number {
  const n = Number(value.trim().replace(",", "."));
  if (!value.trim() || !Number.isFinite(n)) throw new Error(`${label}: bitte eine Zahl in mm.`);
  return n;
}
function sheetOf(f: SheetFields): Sheet {
  const margins = {
    top: millimetres(f.top, "Rand oben"),
    right: millimetres(f.right, "Rand rechts"),
    bottom: millimetres(f.bottom, "Rand unten"),
    left: millimetres(f.left, "Rand links"),
  };
  const sheet: Sheet =
    f.format === "custom"
      ? {
          format: "custom",
          orientation: f.orientation,
          width: millimetres(f.width, "Breite"),
          height: millimetres(f.height, "Höhe"),
          margins,
        }
      : { format: f.format, orientation: f.orientation, margins };
  const problem = sheetProblem(sheet);
  if (problem) throw new Error(problem);
  return sheet;
}

/**
 * Window „Neues Layout“ / „Layouteinstellungen“ and the same for master layouts
 * (docs/LAYOUTS.md, LA3). A layout normally follows a master layout: its paper and margins are
 * shown from the master and locked. Without the tick it keeps its own sheet, starting from the
 * master's values.
 */
export function LayoutSettingsWindow({
  project,
  target,
  folders,
  onApply,
  onClose,
}: {
  project: Project;
  target: LayoutDraftTarget;
  /** Folders in tree order with depth, for the folder choice. */
  folders: readonly { folder: LayoutFolder; depth: number }[];
  /** Applies the action; throws with a message when it is refused. */
  onApply: (action: LayoutAction) => void;
  onClose: () => void;
}) {
  const masters = projectMasterLayouts(project);
  const existing =
    target.kind === "layout" && target.id
      ? projectLayouts(project).find((l) => l.id === target.id)
      : undefined;
  const existingMaster =
    target.kind === "master" && target.id ? masters.find((m) => m.id === target.id) : undefined;
  const [name, setName] = useState(target.name);
  const [folderId, setFolderId] = useState(target.kind === "layout" ? target.folderId : "");
  const [follow, setFollow] = useState(target.kind === "layout" && !existing?.sheet);
  const [masterId, setMasterId] = useState(existing?.masterId ?? masters[0]?.id ?? "");
  const master = masters.find((m) => m.id === masterId);
  const [own, setOwn] = useState<SheetFields>(() =>
    fieldsOf(existing?.sheet ?? existingMaster?.sheet ?? master?.sheet ?? masters[0]!.sheet),
  );
  const [error, setError] = useState("");
  // Title block of a master layout (docs/PLANKOPF.md, PK4); "" is none.
  const [blockId, setBlockId] = useState(existingMaster?.titleBlockId ?? "");
  // What the automatic texts read from a layout (AT2).
  const [planNumber, setPlanNumber] = useState(existing?.planNumber ?? "");
  const [index, setIndex] = useState(existing?.index ?? "");
  const [documentId, setDocumentId] = useState(existing?.documentId ?? "");
  const documents = project.drawingDocuments ?? [];
  const blocks = project.titleBlocks ?? [];
  const locked = target.kind === "layout" && follow;
  const shown = locked && master ? fieldsOf(master.sheet) : own;
  const set = (patch: Partial<SheetFields>) => setOwn((f) => ({ ...f, ...patch }));
  const setFormat = (format: PaperFormat) => {
    if (format === "custom") return set({ format });
    const { width, height } = PAPER_SIZES[format];
    const landscape = own.orientation === "landscape";
    set({
      format,
      width: text(landscape ? height : width),
      height: text(landscape ? width : height),
    });
  };
  const setOrientation = (orientation: Sheet["orientation"]) => {
    if (orientation === own.orientation) return;
    // Turning the sheet swaps width and height, also for a free size.
    set({ orientation, width: own.height, height: own.width });
  };
  const submit = () => {
    try {
      const id = target.id ?? crypto.randomUUID();
      let action: LayoutAction;
      if (target.kind === "master") {
        const sheet = sheetOf(own);
        const titleBlockId = blockId || null;
        action = target.id
          ? { kind: "master-settings", id, name, sheet, titleBlockId }
          : { kind: "create-master", id, name, sheet, titleBlockId };
      } else {
        const body =
          follow && master ? { masterId: master.id } : { masterId: null, sheet: sheetOf(own) };
        if (follow && !master) throw new Error("Bitte ein Masterlayout wählen.");
        const texts = { planNumber, index, documentId: documentId || null };
        action = target.id
          ? { kind: "layout-settings", id, name, folderId, ...body, ...texts }
          : { kind: "create-layout", id, name, folderId, ...body, ...texts };
      }
      onApply(action);
      onClose();
    } catch (cause) {
      setError((cause as Error).message);
    }
  };
  const title =
    target.kind === "master"
      ? target.id
        ? "Masterlayout-Einstellungen"
        : "Neues Masterlayout"
      : target.id
        ? "Layouteinstellungen"
        : "Neues Layout";
  const input = "w-full rounded border bg-popover p-1 disabled:opacity-60";
  const size = (() => {
    try {
      return sheetSize(sheetOf(shown));
    } catch {
      return null;
    }
  })();
  return (
    <FloatingPanel centered open title={title} width={460} height={860} onClose={onClose}>
      <form
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label>
          Name
          <input
            aria-label="Name"
            autoFocus
            maxLength={120}
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {target.kind === "master" && (
          <label>
            Plankopf
            <select
              aria-label="Plankopf"
              className={input}
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
            >
              <option value="">Ohne</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">
              Sitzt rechts unten im Randrahmen und erscheint auf jedem Layout dieses Masterlayouts.
            </span>
          </label>
        )}
        {target.kind === "layout" && (
          <>
            <label>
              Ordner
              <select
                aria-label="Ordner"
                className={input}
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              >
                {folders.map(({ folder, depth }) => (
                  <option key={folder.id} value={folder.id}>
                    {" ".repeat(depth * 3) + folder.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="space-y-2 rounded border p-2">
              <legend className="px-1 font-semibold">Plankopf-Angaben</legend>
              <div className="flex gap-2">
                <label className="flex-1">
                  Plannummer
                  <input
                    aria-label="Plannummer"
                    maxLength={40}
                    className={input}
                    value={planNumber}
                    onChange={(e) => setPlanNumber(e.target.value)}
                  />
                </label>
                <label className="w-20">
                  Index
                  <input
                    aria-label="Index"
                    maxLength={20}
                    className={input}
                    value={index}
                    onChange={(e) => setIndex(e.target.value)}
                  />
                </label>
              </div>
              <label>
                Abbild (Zeichnungsname und Maßstab)
                <select
                  aria-label="Abbild"
                  className={input}
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                >
                  <option value="">Ohne</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · 1:{d.denominator}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
            <fieldset className="space-y-2 rounded border p-2">
              <legend className="px-1 font-semibold">Masterlayout</legend>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  aria-label="Einstellungen vom Masterlayout übernehmen"
                  checked={follow}
                  onChange={(e) => {
                    // Switching off starts the own sheet from the master's values.
                    if (!e.target.checked && master) setOwn(fieldsOf(master.sheet));
                    setFollow(e.target.checked);
                  }}
                />
                Einstellungen vom Masterlayout übernehmen
              </label>
              <select
                aria-label="Masterlayout"
                className={input}
                disabled={!follow}
                value={masterId}
                onChange={(e) => setMasterId(e.target.value)}
              >
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground">
                {follow
                  ? "Größe, Format und Ränder kommen aus dem Masterlayout; was dort gezeichnet ist, erscheint auch in diesem Layout."
                  : "Das Layout hat eigene Blatteinstellungen und zeigt nichts aus einem Masterlayout."}
              </p>
            </fieldset>
          </>
        )}
        <fieldset className="space-y-2 rounded border p-2" disabled={locked}>
          <legend className="px-1 font-semibold">Blatt</legend>
          <div className="flex gap-2">
            <label className="flex-1">
              Größe
              <select
                aria-label="Größe"
                className={input}
                value={shown.format}
                onChange={(e) => setFormat(e.target.value as PaperFormat)}
              >
                {PAPER_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {PAPER_FORMAT_LABELS[f]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1">
              Format
              <select
                aria-label="Format"
                className={input}
                value={shown.orientation}
                onChange={(e) => setOrientation(e.target.value as Sheet["orientation"])}
              >
                <option value="portrait">Hochformat</option>
                <option value="landscape">Querformat</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            {(["width", "height"] as const).map((key) => (
              <label key={key} className="flex-1">
                {key === "width" ? "Breite (mm)" : "Höhe (mm)"}
                <input
                  aria-label={key === "width" ? "Breite (mm)" : "Höhe (mm)"}
                  inputMode="decimal"
                  className={input}
                  disabled={shown.format !== "custom"}
                  value={shown[key]}
                  onChange={(e) => set({ [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <p className="font-semibold">Randabstand (mm)</p>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                ["top", "oben"],
                ["right", "rechts"],
                ["bottom", "unten"],
                ["left", "links"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  aria-label={`Rand ${label} (mm)`}
                  inputMode="decimal"
                  className={input}
                  value={shown[key]}
                  onChange={(e) => set({ [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </fieldset>
        {size && <SheetPreview fields={shown} width={size.width} height={size.height} />}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <div className="mt-auto flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-1" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="submit"
            className="rounded border bg-primary px-3 py-1 text-primary-foreground"
          >
            {target.id ? "Übernehmen" : "Anlegen"}
          </button>
        </div>
      </form>
    </FloatingPanel>
  );
}

/** Small sketch of the sheet with its margin frame, to scale. */
function SheetPreview({
  fields,
  width,
  height,
}: {
  fields: SheetFields;
  width: number;
  height: number;
}) {
  const scale = 120 / Math.max(width, height);
  const m = (v: string) => Number(v.replace(",", ".")) * scale;
  return (
    <figure className="flex items-center gap-3 text-muted-foreground">
      <svg
        aria-label="Blattvorschau"
        width={width * scale + 2}
        height={height * scale + 2}
        className="shrink-0"
      >
        <rect
          x={1}
          y={1}
          width={width * scale}
          height={height * scale}
          fill="white"
          stroke="currentColor"
        />
        <rect
          x={1 + m(fields.left)}
          y={1 + m(fields.top)}
          width={Math.max(0, width * scale - m(fields.left) - m(fields.right))}
          height={Math.max(0, height * scale - m(fields.top) - m(fields.bottom))}
          fill="none"
          stroke="currentColor"
          strokeDasharray="3 2"
        />
      </svg>
      <figcaption>
        {text(width)} × {text(height)} mm
      </figcaption>
    </figure>
  );
}
