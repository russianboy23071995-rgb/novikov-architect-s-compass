import { useState } from "react";
import type { ObjectToolDefaults } from "@/application/objects/defaults";
import { objectDefinition } from "@/domain/elements/object/catalog";
import {
  MAX_TABLE_CHAIRS,
  OBJECT_SLOT_LABELS,
  objectRule,
  SOFA_ARM_LABELS,
  SOFA_ARMS,
  sofaSeats,
  TABLE_TOP_LABELS,
  TABLE_TOPS,
  tableChairTotal,
  TV_MOUNT_LABELS,
  TV_MOUNTS,
  type ObjectFinish,
  type ObjectSlot,
} from "@/domain/elements/object/rules";
import { objectSlotColor } from "@/domain/elements/object/model";
import type { Material } from "@/domain/elements/wall/assembly";
import type { Layer } from "@/domain/layers/model";

type NumberField = "width" | "depth" | "height" | "rotation" | "baseOffset";
const LABELS: Record<NumberField, string> = {
  width: "Breite (m)",
  depth: "Tiefe (m)",
  height: "Höhe (m)",
  rotation: "Drehung (°)",
  baseOffset: "Über Boden (m)",
};
const POSITIVE: ReadonlySet<NumberField> = new Set(["width", "depth", "height"]);

/**
 * Object fields (docs/OBJEKTBIBLIOTHEK.md, M1): the same set in the tool bar, the library
 * window, the tool settings window and the element properties. With onCommit (element
 * properties) a change applies when a field is left: one undo step per edit, not per keystroke.
 */
export function ObjectFields({
  value,
  onChange,
  onCommit,
  onCatalog,
  layers,
  materials,
  compact = false,
  label = "Bibliothekswerkzeug",
}: {
  value: ObjectToolDefaults;
  onChange: (value: ObjectToolDefaults) => void;
  onCommit?: (value: ObjectToolDefaults) => void;
  /** Opens the library window; without it the surrounding window names the object. */
  onCatalog?: () => void;
  layers: readonly Layer[];
  materials: readonly Material[];
  /** The tool bar: sizes only; options and finishes live in the windows. */
  compact?: boolean;
  label?: string;
}) {
  const choose = (next: ObjectToolDefaults) => {
    onChange(next);
    onCommit?.(next);
  };
  const [draft, setDraft] = useState<Partial<Record<NumberField, string>>>({});
  const number = (field: NumberField) => (
    <label key={field} className="text-xs">
      {LABELS[field]}
      <input
        aria-label={`Objekt ${LABELS[field]}`}
        inputMode="decimal"
        value={draft[field] ?? String(value[field])}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft((d) => ({ ...d, [field]: raw }));
          const parsed = Number(raw.replace(",", "."));
          if (raw.trim() !== "" && Number.isFinite(parsed) && (!POSITIVE.has(field) || parsed > 0))
            onChange({ ...value, [field]: parsed });
        }}
        onBlur={() => {
          setDraft((d) => ({ ...d, [field]: undefined }));
          onCommit?.(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit?.(value);
        }}
        className="block w-20 rounded border bg-background p-1"
      />
    </label>
  );
  const rule = objectRule(value.catalogId);
  const options = value.options;
  const setOptions = (changes: Partial<ObjectToolDefaults["options"]>) =>
    choose({ ...value, options: { ...options, ...changes } });
  const setFinish = (slot: ObjectSlot, finish: ObjectFinish | null) => {
    const { [slot]: _old, ...rest } = value.finishes;
    return { ...value, finishes: finish ? { ...rest, [slot]: finish } : rest };
  };
  const chairs = options.chairs;
  return (
    <section aria-label={label} className="flex flex-wrap items-end gap-3">
      {onCatalog && (
        <button
          type="button"
          onClick={onCatalog}
          className="rounded border bg-background px-2 py-1 text-xs"
        >
          {objectDefinition(value.catalogId).name} · Katalog …
        </button>
      )}
      {number("width")}
      {number("depth")}
      {number("height")}
      {number("rotation")}
      {number("baseOffset")}
      <label className="flex items-center gap-1 py-1 text-xs">
        <input
          type="checkbox"
          aria-label="Objekt gespiegelt"
          checked={value.mirrored}
          onChange={(e) => choose({ ...value, mirrored: e.target.checked })}
        />
        Gespiegelt
      </label>
      <label className="text-xs">
        Ebene
        <select
          aria-label="Objektebene"
          value={value.layerId}
          onChange={(e) => choose({ ...value, layerId: e.target.value })}
          className="block rounded border bg-background p-1"
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </label>
      {!compact && value.catalogId === "table" && (
        <fieldset className="flex w-full flex-wrap items-end gap-3 border-t pt-2">
          <legend className="sr-only">Tisch</legend>
          <label className="text-xs">
            Platte
            <select
              aria-label="Plattenform"
              value={options.tableTop ?? "rectangle"}
              onChange={(e) =>
                setOptions({ tableTop: e.target.value as (typeof TABLE_TOPS)[number] })
              }
              className="block rounded border bg-background p-1"
            >
              {TABLE_TOPS.map((top) => (
                <option key={top} value={top}>
                  {TABLE_TOP_LABELS[top]}
                </option>
              ))}
            </select>
          </label>
          {options.tableTop === "rounded" && (
            <label className="text-xs">
              Eckradius (m)
              <input
                aria-label="Eckradius"
                type="number"
                min={0.01}
                max={1}
                step={0.01}
                value={options.cornerRadius ?? 0.08}
                onChange={(e) => {
                  const radius = Number(e.target.value);
                  if (radius >= 0.01 && radius <= 1) setOptions({ cornerRadius: radius });
                }}
                className="block w-20 rounded border bg-background p-1"
              />
            </label>
          )}
          <label className="text-xs">
            Stühle
            <select
              aria-label="Stühle"
              value={chairs === "auto" ? "auto" : chairs ? "fixed" : "none"}
              onChange={(e) =>
                setOptions({
                  chairs:
                    e.target.value === "auto"
                      ? "auto"
                      : e.target.value === "none"
                        ? 0
                        : tableChairTotal({
                            ...value,
                            options: { ...options, chairs: "auto" },
                          }) || 4,
                })
              }
              className="block rounded border bg-background p-1"
            >
              <option value="auto">Automatisch nach Länge</option>
              <option value="fixed">Feste Anzahl</option>
              <option value="none">Keine</option>
            </select>
          </label>
          {typeof chairs === "number" && chairs > 0 && (
            <label className="text-xs">
              Anzahl
              <input
                aria-label="Anzahl Stühle"
                type="number"
                min={1}
                max={MAX_TABLE_CHAIRS}
                value={chairs}
                onChange={(e) => {
                  const count = Number(e.target.value);
                  if (Number.isInteger(count) && count >= 1 && count <= MAX_TABLE_CHAIRS)
                    setOptions({ chairs: count });
                }}
                className="block w-16 rounded border bg-background p-1"
              />
            </label>
          )}
          <label className="flex items-center gap-1 py-1 text-xs">
            <input
              type="checkbox"
              aria-label="Stühle an den Kopfenden"
              checked={!!options.headChairs}
              onChange={(e) => setOptions({ headChairs: e.target.checked })}
            />
            Auch an den Kopfenden
          </label>
          <span role="status" className="py-1 text-xs text-muted-foreground">
            {tableChairTotal(value)} Stühle
          </span>
        </fieldset>
      )}
      {!compact && value.catalogId === "sofa" && (
        <fieldset className="flex w-full flex-wrap items-end gap-3 border-t pt-2">
          <legend className="sr-only">Sofa</legend>
          <label className="text-xs">
            Armlehnen
            <select
              aria-label="Armlehnen"
              value={options.sofaArms ?? "both"}
              onChange={(e) =>
                setOptions({ sofaArms: e.target.value as (typeof SOFA_ARMS)[number] })
              }
              className="block rounded border bg-background p-1"
            >
              {SOFA_ARMS.map((arms) => (
                <option key={arms} value={arms}>
                  {SOFA_ARM_LABELS[arms]}
                </option>
              ))}
            </select>
          </label>
          <span role="status" className="py-1 text-xs text-muted-foreground">
            {sofaSeats(value)} Sitze
          </span>
        </fieldset>
      )}
      {!compact && value.catalogId === "television" && (
        <fieldset className="flex w-full flex-wrap items-end gap-3 border-t pt-2">
          <legend className="sr-only">Fernseher</legend>
          <label className="text-xs">
            Aufstellung
            <select
              aria-label="Aufstellung"
              value={options.tvMount ?? "stand"}
              onChange={(e) =>
                setOptions({ tvMount: e.target.value as (typeof TV_MOUNTS)[number] })
              }
              className="block rounded border bg-background p-1"
            >
              {TV_MOUNTS.map((mount) => (
                <option key={mount} value={mount}>
                  {TV_MOUNT_LABELS[mount]}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}
      {!compact && rule && (
        <fieldset className="grid w-full gap-1 border-t pt-2">
          <legend className="sr-only">Material und Farbe</legend>
          {rule.slots.map((slot) => {
            const finish = value.finishes[slot];
            const name = rule.labels?.[slot] ?? OBJECT_SLOT_LABELS[slot];
            return (
              <div key={slot} className="flex items-center gap-2 text-xs">
                <span className="w-16">{name}</span>
                <select
                  aria-label={`Material ${name}`}
                  value={finish ? (finish.materialId ?? "own") : ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const material = materials.find((m) => m.id === id);
                    choose(
                      setFinish(
                        slot,
                        id === ""
                          ? null
                          : material
                            ? { color: material.color, materialId: material.id }
                            : { color: objectSlotColor(value, slot) },
                      ),
                    );
                  }}
                  className="min-w-0 flex-1 rounded border bg-background p-1"
                >
                  <option value="">Standard</option>
                  <option value="own">Eigene Farbe</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
                <input
                  type="color"
                  aria-label={`Farbe ${name}`}
                  value={objectSlotColor(value, slot)}
                  onChange={(e) => onChange(setFinish(slot, { color: e.target.value }))}
                  onBlur={() => onCommit?.(value)}
                  className="h-7 w-8 rounded border bg-background p-0.5"
                />
              </div>
            );
          })}
        </fieldset>
      )}
    </section>
  );
}
