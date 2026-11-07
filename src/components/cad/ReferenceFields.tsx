import { useState } from "react";
import { updateImageReference, type ReferencePatch } from "@/application/references/actions";
import { MIN_REFERENCE_OPACITY } from "@/domain/elements/reference/model";
import type { Project } from "@/domain/project/schema";
import { storeyOf } from "@/domain/storeys/access";

type Field = "width" | "x" | "y" | "rotation";
const LABELS: Record<Field, string> = {
  width: "Breite (m)",
  x: "Ecke links oben x (m)",
  y: "Ecke links oben y (m)",
  rotation: "Drehung (°)",
};
const round = (value: number, digits: number) =>
  String(Math.round(value * 10 ** digits) / 10 ** digits).replace(".", ",");

/**
 * Fields of one image underlay (docs/BILDUNTERLAGE.md, B2): opacity, grey, lock, size, position
 * and rotation. Every committed change is one undo step; a typed value applies on Enter or when
 * the field is left.
 */
export function ReferenceFields({
  project,
  referenceId,
  onChange,
}: {
  project: Project;
  referenceId: string;
  onChange: (project: Project) => void;
}) {
  const reference = storeyOf(project).references.find((r) => r.id === referenceId);
  const asset = reference && project.assets.find((a) => a.id === reference.assetId);
  const [draft, setDraft] = useState<Partial<Record<Field, string>>>({});
  const [opacity, setOpacity] = useState<number | null>(null);
  const [error, setError] = useState("");
  if (!reference || !asset) return null;
  const apply = (patch: ReferencePatch) => {
    try {
      onChange(updateImageReference(project, referenceId, patch));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Änderung nicht möglich.");
    }
  };
  const width = asset.pixelWidth * reference.metresPerPixel;
  const shown: Record<Field, string> = {
    width: round(width, 3),
    x: round(reference.origin.x, 3),
    y: round(reference.origin.y, 3),
    rotation: round((reference.rotation * 180) / Math.PI, 2),
  };
  const commit = (field: Field) => {
    const raw = draft[field];
    setDraft((d) => ({ ...d, [field]: undefined }));
    if (raw === undefined) return;
    const value = Number(raw.trim().replace(",", "."));
    if (raw.trim() === "" || !Number.isFinite(value))
      return setError(`${LABELS[field]}: Zahl eingeben.`);
    if (field === "width") {
      if (value <= 0) return setError("Breite muss größer als 0 sein.");
      apply({ metresPerPixel: value / asset.pixelWidth });
    } else if (field === "rotation") apply({ rotation: (value * Math.PI) / 180 });
    else apply({ origin: { ...reference.origin, [field]: value } });
  };
  const percent = Math.round((opacity ?? reference.opacity ?? 1) * 100);
  const commitOpacity = () => {
    if (opacity === null) return;
    setOpacity(null);
    apply({ opacity });
  };
  return (
    <section aria-label="Bildunterlage" className="flex flex-wrap items-end gap-3 text-xs">
      <label className="flex flex-col">
        Deckkraft {percent} %
        <input
          type="range"
          aria-label="Deckkraft der Bildunterlage"
          min={MIN_REFERENCE_OPACITY * 100}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          onPointerUp={commitOpacity}
          onKeyUp={commitOpacity}
          onBlur={commitOpacity}
          className="w-32"
        />
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          aria-label="Bildunterlage in Graustufen"
          checked={!!reference.grayscale}
          onChange={(e) => apply({ grayscale: e.target.checked })}
        />
        Graustufen
      </label>
      <label
        className="flex items-center gap-1"
        title="Gesperrt: Klick, Rahmen und Tab greifen durch"
      >
        <input
          type="checkbox"
          aria-label="Bildunterlage gesperrt"
          checked={!!reference.locked}
          onChange={(e) => apply({ locked: e.target.checked })}
        />
        Gesperrt
      </label>
      {(Object.keys(LABELS) as Field[]).map((field) => (
        <label key={field} className="flex flex-col">
          {LABELS[field]}
          <input
            aria-label={`Bildunterlage ${LABELS[field]}`}
            inputMode="decimal"
            value={draft[field] ?? shown[field]}
            onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
            onBlur={() => commit(field)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit(field);
              if (e.key === "Escape") setDraft((d) => ({ ...d, [field]: undefined }));
            }}
            className="w-24 rounded border bg-background p-1"
          />
        </label>
      ))}
      <span className="text-muted-foreground">
        {asset.pixelWidth} × {asset.pixelHeight} px · Höhe{" "}
        {round(asset.pixelHeight * reference.metresPerPixel, 3)} m
      </span>
      {error && (
        <span role="alert" className="text-destructive">
          {error}
        </span>
      )}
    </section>
  );
}
