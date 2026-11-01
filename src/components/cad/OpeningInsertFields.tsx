import { useState } from "react";
import {
  DOOR_INSERT_DEFAULTS,
  SASH_DEFAULTS,
  SASH_OPERATION_LABELS,
  SASH_OPERATIONS,
  withDivision,
  WINDOW_DIVISION_LABELS,
  WINDOW_DIVISIONS,
  WINDOW_INSERT_DEFAULTS,
  WINDOW_LOCATION_LABELS,
  WINDOW_LOCATIONS,
  type DoorInsert,
  type WindowInsert,
} from "@/domain/elements/window/insert";

const cm = (m: number) => String(Math.round(m * 1000) / 10).replace(".", ",");

/** A length in cm, reported in metres on blur or Enter. */
function CentimetreField({
  label,
  value,
  onCommit,
  disabled = false,
}: {
  label: string;
  value: number;
  onCommit: (metres: number) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(",", "."));
    setDraft(null);
    if (Number.isFinite(parsed) && parsed >= 0 && Math.abs(parsed / 100 - value) > 1e-9)
      onCommit(parsed / 100);
  };
  return (
    <label className="text-xs">
      {label}
      <input
        inputMode="decimal"
        disabled={disabled}
        value={draft ?? cm(value)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => event.key === "Enter" && commit()}
        className="block w-20 rounded border bg-background p-1 disabled:opacity-50"
      />
    </label>
  );
}

const select = "block rounded border bg-background p-1";

/**
 * The element in a window or door opening (docs/FENSTER_TUEREN.md, FT1), for the tool defaults
 * and for one opening alike. Off: opening only. A change that does not fit is refused by the
 * caller and its reason is shown here.
 */
export function OpeningInsertFields(
  props:
    | {
        kind: "window";
        value: WindowInsert | null;
        onChange: (value: WindowInsert | null) => void;
        hint: string;
        /** Tool defaults: the outside comes from the second click (R1), so no field. */
        clickedExterior?: boolean;
      }
    | {
        kind: "door";
        value: DoorInsert | null;
        onChange: (value: DoorInsert | null) => void;
        hint: string;
      },
) {
  const [error, setError] = useState("");
  const run = (apply: () => void) => {
    try {
      apply();
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Nicht möglich.");
    }
  };
  const noun = props.kind === "window" ? "Fensterelement" : "Türelement";
  return (
    <section aria-label={noun} className="grid gap-3 p-1 text-xs">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={props.value !== null}
          onChange={(event) =>
            run(() =>
              props.kind === "window"
                ? props.onChange(event.target.checked ? WINDOW_INSERT_DEFAULTS : null)
                : props.onChange(event.target.checked ? DOOR_INSERT_DEFAULTS : null),
            )
          }
        />
        {noun} einsetzen (aus: nur Öffnung)
      </label>
      {props.kind === "window" && props.value && (
        <WindowInsertFields
          value={props.value}
          onChange={(v) => run(() => props.onChange(v))}
          clickedExterior={props.clickedExterior ?? false}
        />
      )}
      {props.kind === "door" && props.value && (
        <DoorInsertFields value={props.value} onChange={(v) => run(() => props.onChange(v))} />
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <p className="text-muted-foreground">{props.hint}</p>
    </section>
  );
}

function WindowInsertFields({
  value,
  onChange,
  clickedExterior,
}: {
  value: WindowInsert;
  onChange: (value: WindowInsert) => void;
  clickedExterior: boolean;
}) {
  const sill = (key: "sillInside" | "sillOutside", label: string) => (
    <div className="flex items-end gap-2">
      <label className="flex items-center gap-1 pb-1">
        <input
          type="checkbox"
          checked={!!value[key]}
          onChange={(event) => {
            const { [key]: _, ...rest } = value;
            onChange(
              event.target.checked
                ? { ...rest, [key]: WINDOW_INSERT_DEFAULTS[key] ?? { projection: 0.03 } }
                : rest,
            );
          }}
        />
        {label}
      </label>
      {value[key] && (
        <CentimetreField
          label="Überstand (cm)"
          value={value[key]!.projection}
          onCommit={(projection) => onChange({ ...value, [key]: { projection } })}
        />
      )}
    </div>
  );
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs">
          Teilung
          <select
            value={value.division}
            onChange={(event) =>
              onChange(withDivision(value, event.target.value as WindowInsert["division"]))
            }
            className={select}
          >
            {WINDOW_DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {WINDOW_DIVISION_LABELS[d]}
              </option>
            ))}
          </select>
        </label>
        <CentimetreField
          label="Rahmenbreite (cm)"
          value={value.frameWidth}
          onCommit={(frameWidth) => onChange({ ...value, frameWidth })}
        />
        <CentimetreField
          label="Rahmentiefe (cm)"
          value={value.frameDepth}
          onCommit={(frameDepth) => onChange({ ...value, frameDepth })}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs">
          Lage in der Wand
          <select
            value={value.location}
            onChange={(event) =>
              onChange({ ...value, location: event.target.value as WindowInsert["location"] })
            }
            className={select}
          >
            {WINDOW_LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {WINDOW_LOCATION_LABELS[l]}
              </option>
            ))}
          </select>
        </label>
        <CentimetreField
          label="Abstand zur Wandseite (cm)"
          value={value.offset}
          disabled={value.location === "centre"}
          onCommit={(offset) => onChange({ ...value, offset })}
        />
        {clickedExterior ? (
          <p className="pb-1 text-muted-foreground">Außenseite: per Klick beim Platzieren</p>
        ) : (
          <label className="text-xs">
            Außenseite
            <select
              value={value.exterior}
              onChange={(event) =>
                onChange({ ...value, exterior: event.target.value as WindowInsert["exterior"] })
              }
              className={select}
              title="Wände kennen ihre Außenseite noch nicht; deshalb wird sie je Fenster gewählt, gesehen vom Wandanfang zum Wandende."
            >
              <option value="right">rechts der Wandrichtung</option>
              <option value="left">links der Wandrichtung</option>
            </select>
          </label>
        )}
      </div>
      {value.division !== "fixed" && (
        <div className="flex flex-wrap items-end gap-3">
          <CentimetreField
            label="Flügelrahmen (cm)"
            value={value.sashWidth ?? SASH_DEFAULTS.sashWidth}
            onCommit={(sashWidth) => onChange({ ...value, sashWidth })}
          />
          {(value.division === "double" || value.division === "transom") && (
            <CentimetreField
              label={value.division === "double" ? "Pfosten (cm)" : "Kämpfer (cm)"}
              value={value.mullionWidth ?? SASH_DEFAULTS.mullionWidth}
              onCommit={(mullionWidth) => onChange({ ...value, mullionWidth })}
            />
          )}
          {value.division === "transom" && (
            <CentimetreField
              label="Oberlicht lichte Höhe (cm)"
              value={value.transomHeight ?? SASH_DEFAULTS.transomHeight}
              onCommit={(transomHeight) => onChange({ ...value, transomHeight })}
            />
          )}
        </div>
      )}
      {(value.sashes ?? []).map((sash, index, all) => {
        const set = (changes: Partial<typeof sash>) =>
          onChange({
            ...value,
            sashes: all.map((s, i) => (i === index ? { ...s, ...changes } : s)),
          });
        return (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <p className="pb-1 font-medium">
              {all.length === 2 ? (index === 0 ? "Flügel links" : "Flügel rechts") : "Flügel"}
            </p>
            <label className="text-xs">
              Öffnungsart
              <select
                value={sash.operation}
                onChange={(event) =>
                  set({ operation: event.target.value as typeof sash.operation })
                }
                className={select}
              >
                {SASH_OPERATIONS.map((o) => (
                  <option key={o} value={o}>
                    {SASH_OPERATION_LABELS[o]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Anschlag (von innen)
              <select
                value={sash.hinge}
                disabled={sash.operation === "tilt"}
                onChange={(event) => set({ hinge: event.target.value as typeof sash.hinge })}
                className={`${select} disabled:opacity-50`}
                title="Bandseite, von innen gesehen; ein Kippflügel ist unten angeschlagen."
              >
                <option value="left">links</option>
                <option value="right">rechts</option>
              </select>
            </label>
          </div>
        );
      })}
      <div className="flex flex-wrap items-end gap-4">
        {sill("sillInside", "Fensterbank innen")}
        {sill("sillOutside", "Fensterbank außen")}
      </div>
    </div>
  );
}

function DoorInsertFields({
  value,
  onChange,
}: {
  value: DoorInsert;
  onChange: (value: DoorInsert) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <CentimetreField
        label="Zargenbreite (cm)"
        value={value.frameWidth}
        onCommit={(frameWidth) => onChange({ ...value, frameWidth })}
      />
      <label className="flex items-center gap-1 pb-1">
        <input
          type="checkbox"
          checked={value.frameDepth === undefined}
          onChange={(event) => {
            const { frameDepth: _, ...rest } = value;
            onChange(event.target.checked ? rest : { ...rest, frameDepth: 0.1 });
          }}
        />
        Zargentiefe = Wanddicke
      </label>
      {value.frameDepth !== undefined && (
        <CentimetreField
          label="Zargentiefe (cm)"
          value={value.frameDepth}
          onCommit={(frameDepth) => onChange({ ...value, frameDepth })}
        />
      )}
      <CentimetreField
        label="Blattdicke (cm)"
        value={value.leafThickness}
        onCommit={(leafThickness) => onChange({ ...value, leafThickness })}
      />
    </div>
  );
}
