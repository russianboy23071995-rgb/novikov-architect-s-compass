import { useState } from "react";
import type { Layer } from "@/domain/layers/model";
import {
  MASK_EDGES,
  maskCrop,
  maskFromCrop,
  type DrawingMask,
  type MaskEdge,
} from "@/domain/elements/drawing/model";

/** Defaults of the tool „Zeichnung“ (docs/ZEICHNUNG.md, ZW3): the document and layer to place. */
export type DrawingDefaults = { documentId: string | null; layerId: string };
export type DrawingChoice = { id: string; label: string; placeable: boolean };

function LayerSelect({
  label,
  layers,
  value,
  onChange,
}: {
  label: string;
  layers: readonly Layer[];
  value: string;
  onChange: (layerId: string) => void;
}) {
  return (
    <label className="text-xs">
      Ebene
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block rounded border bg-background p-1"
      >
        {layers.map((layer) => (
          <option key={layer.id} value={layer.id}>
            {layer.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Bar and defaults window of the tool: which Abbild a click places, and on which layer. */
export function DrawingToolFields({
  documents,
  layers,
  value,
  onChange,
}: {
  documents: readonly DrawingChoice[];
  layers: readonly Layer[];
  value: DrawingDefaults;
  onChange: (value: DrawingDefaults) => void;
}) {
  return (
    <section className="flex flex-wrap items-end gap-2 text-xs">
      <label className="text-xs">
        Abbild
        <select
          aria-label="Abbild für die Zeichnung"
          className="block rounded border bg-background p-1"
          value={value.documentId ?? ""}
          onChange={(e) => onChange({ ...value, documentId: e.target.value || null })}
        >
          <option value="">Abbild wählen …</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id} disabled={!d.placeable}>
              {d.label}
              {d.placeable ? "" : " (folgt)"}
            </option>
          ))}
        </select>
      </label>
      <LayerSelect
        label="Ebene der Zeichnung"
        layers={layers}
        value={value.layerId}
        onChange={(layerId) => onChange({ ...value, layerId })}
      />
      <span className="pb-1 text-muted-foreground">
        Klick setzt die Mitte des Ausschnitts aufs Papier; die Größe folgt aus dem Maßstab.
      </span>
    </section>
  );
}

const EDGE_LABELS: Record<MaskEdge, string> = {
  left: "Beschnitt links (mm)",
  right: "Beschnitt rechts (mm)",
  bottom: "Beschnitt unten (mm)",
  top: "Beschnitt oben (mm)",
};
const mm = (metres: number) => String(Math.round(metres * 10000) / 10);

/**
 * Window of one placed drawing (ZW3): its Abbild, layer and how far each mask edge is cropped in
 * from the document frame. Every change is one undo step; a refused one shows its reason.
 */
export function DrawingElementFields({
  document,
  layers,
  layerId,
  mask,
  limit,
  onChange,
  inline = false,
}: {
  document: string;
  layers: readonly Layer[];
  layerId: string;
  mask: DrawingMask;
  limit: DrawingMask;
  /** Applies the change; throws with a message when it is refused. */
  onChange: (change: { mask?: DrawingMask; layerId?: string }) => void;
  /** In the one-row tool properties bar (UI1): side by side instead of stacked. */
  inline?: boolean;
}) {
  const crop = maskCrop(mask, limit);
  const [drafts, setDrafts] = useState<Partial<Record<MaskEdge, string>>>({});
  const [error, setError] = useState("");
  const apply = (change: { mask?: DrawingMask; layerId?: string }) => {
    try {
      onChange(change);
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  };
  const commit = (edge: MaskEdge) => {
    const text = drafts[edge];
    if (text === undefined) return;
    setDrafts(({ [edge]: _done, ...rest }) => rest);
    const value = Number(text.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) return setError("Beschnitt in mm ab 0 eingeben.");
    apply({ mask: maskFromCrop(limit, { ...crop, [edge]: value / 1000 }) });
  };
  return (
    <section className={inline ? "flex items-end gap-3 text-xs" : "flex flex-col gap-2 text-xs"}>
      <p>
        Abbild <span className="font-medium">{document}</span>
      </p>
      <LayerSelect
        label="Ebene der Zeichnung"
        layers={layers}
        value={layerId}
        onChange={(next) => apply({ layerId: next })}
      />
      <div className={inline ? "flex items-end gap-2" : "grid grid-cols-2 gap-2"}>
        {MASK_EDGES.map((edge) => (
          <label key={edge}>
            {EDGE_LABELS[edge]}
            <input
              aria-label={EDGE_LABELS[edge]}
              inputMode="decimal"
              className={
                inline
                  ? "block w-20 rounded border bg-background p-1"
                  : "block w-full rounded border bg-background p-1"
              }
              value={drafts[edge] ?? mm(crop[edge])}
              onChange={(e) => setDrafts({ ...drafts, [edge]: e.target.value })}
              onBlur={() => commit(edge)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit(edge);
              }}
            />
          </label>
        ))}
      </div>
      <p className="text-muted-foreground">
        Ausschnitt {mm(mask.x1 - mask.x0)} × {mm(mask.y1 - mask.y0)} mm von{" "}
        {mm(limit.x1 - limit.x0)} × {mm(limit.y1 - limit.y0)} mm. Die Ränder lassen sich auch an den
        Griffen der ausgewählten Zeichnung ziehen.
      </p>
      <button
        type="button"
        className="self-start rounded border px-2 py-1 hover:bg-muted"
        disabled={MASK_EDGES.every((edge) => Math.abs(crop[edge]) < 1e-9)}
        onClick={() => apply({ mask: { ...limit } })}
      >
        Maske zurücksetzen
      </button>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
