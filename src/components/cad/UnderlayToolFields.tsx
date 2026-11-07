import { updateImageReference } from "@/application/references/actions";
import { MIN_REFERENCE_OPACITY } from "@/domain/elements/reference/model";
import type { Project } from "@/domain/project/schema";
import { storeyOf } from "@/domain/storeys/access";
import { Button } from "@/components/ui/button";
import {
  underlayMetresPerPixel,
  type UnderlayDefaults,
} from "@/application/references/underlay-size";

const metres = (value: number) =>
  value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Defaults of the underlay tool (docs/BILDUNTERLAGE.md, B1), the same set in the tool bar and
 * in the tool window: size from a width or from plan scale and scan resolution, opacity, grey.
 * With an image chosen, the resulting size shows beside the fields.
 */
export function UnderlayToolFields({
  value,
  onChange,
  pixels,
  fileDpi,
  onPick,
}: {
  value: UnderlayDefaults;
  onChange: (value: UnderlayDefaults) => void;
  pixels?: {
    width: number;
    height: number;
    scale: number;
    source: { width: number; height: number };
  } | null;
  fileDpi?: number | null;
  onPick?: (() => void) | undefined;
}) {
  let size = "";
  if (pixels)
    try {
      const m = underlayMetresPerPixel(value, pixels.width, pixels.scale);
      size = `${metres(pixels.width * m)} × ${metres(pixels.height * m)} m`;
      // A large scan was fitted on import (B5): say so, the drawing keeps its scale.
      if (pixels.scale < 1)
        size += ` · verkleinert von ${pixels.source.width} × ${pixels.source.height} auf ${pixels.width} × ${pixels.height} px`;
    } catch (e) {
      size = e instanceof Error ? e.message : "";
    }
  const input = "w-20 rounded border bg-background p-1";
  return (
    <section aria-label="Bildunterlage Vorgaben" className="flex flex-wrap items-end gap-3 text-xs">
      <label className="flex flex-col">
        Größe über
        <select
          aria-label="Größe der Bildunterlage über"
          value={value.size}
          onChange={(e) => onChange({ ...value, size: e.target.value as UnderlayDefaults["size"] })}
          className="rounded border bg-background p-1"
        >
          <option value="width">Breite in Metern</option>
          <option value="scale">Maßstab und dpi (Scan)</option>
        </select>
      </label>
      {value.size === "width" ? (
        <label className="flex flex-col">
          Bildbreite (m)
          <input
            aria-label="Bildbreite (m)"
            inputMode="decimal"
            value={value.width}
            onChange={(e) => onChange({ ...value, width: e.target.value })}
            className={input}
          />
        </label>
      ) : (
        <>
          <label className="flex flex-col">
            Maßstab 1:
            <input
              aria-label="Maßstab des Scans 1:"
              inputMode="decimal"
              value={value.denominator}
              onChange={(e) => onChange({ ...value, denominator: e.target.value })}
              className={input}
            />
          </label>
          <label className="flex flex-col">
            Auflösung (dpi)
            <input
              aria-label="Auflösung des Scans (dpi)"
              inputMode="decimal"
              value={value.dpi}
              onChange={(e) => onChange({ ...value, dpi: e.target.value })}
              className={input}
              title={fileDpi ? `Aus der Datei: ${fileDpi} dpi` : undefined}
            />
          </label>
        </>
      )}
      <label className="flex flex-col">
        Deckkraft {value.opacity} %
        <input
          type="range"
          aria-label="Deckkraft neuer Bildunterlagen"
          min={MIN_REFERENCE_OPACITY * 100}
          max={100}
          step={5}
          value={value.opacity}
          onChange={(e) => onChange({ ...value, opacity: Number(e.target.value) })}
          className="w-28"
        />
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          aria-label="Neue Bildunterlagen in Graustufen"
          checked={value.grayscale}
          onChange={(e) => onChange({ ...value, grayscale: e.target.checked })}
        />
        Graustufen
      </label>
      {onPick && (
        <Button size="sm" variant="outline" onClick={onPick}>
          Bild wählen…
        </Button>
      )}
      {(size || fileDpi) && (
        <span className="text-muted-foreground">
          {size}
          {fileDpi ? ` · Datei: ${fileDpi.toLocaleString("de-DE")} dpi` : ""}
        </span>
      )}
    </section>
  );
}

/**
 * The underlays of the working storey (docs/BILDUNTERLAGE.md, B1), in the tool window: lock and
 * opacity at a glance, also for a locked one that a click does not reach.
 */
export function UnderlayList({
  project,
  onChange,
  onOpen,
}: {
  project: Project;
  onChange: (project: Project) => void;
  onOpen: (id: string) => void;
}) {
  const references = storeyOf(project).references;
  if (!references.length)
    return <p className="text-xs text-muted-foreground">Keine Bildunterlage in diesem Geschoss.</p>;
  return (
    <ul aria-label="Bildunterlagen im Geschoss" className="space-y-1 text-xs">
      {references.map((r, i) => {
        const asset = project.assets.find((a) => a.id === r.assetId);
        const width = asset ? asset.pixelWidth * r.metresPerPixel : 0;
        return (
          <li key={r.id} className="flex items-center gap-3">
            <span className="w-40">
              Unterlage {i + 1} · {metres(width)} m breit
            </span>
            <span className="w-16 text-muted-foreground">
              {Math.round((r.opacity ?? 1) * 100)} %
            </span>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                aria-label={`Unterlage ${i + 1} gesperrt`}
                checked={!!r.locked}
                onChange={(e) =>
                  onChange(updateImageReference(project, r.id, { locked: e.target.checked }))
                }
              />
              Gesperrt
            </label>
            <Button size="sm" variant="ghost" onClick={() => onOpen(r.id)}>
              Einstellungen
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
