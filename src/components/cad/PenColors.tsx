import { ColorPalette } from "./ColorPalette";
import { STANDARD_PALETTE } from "@/application/pens/palette";
import { useColorMemory } from "./color-memory";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { FloatingPanel } from "./FloatingPanel";
import { PropertyCommitContext } from "./property-commit-context";
import type { PenSet } from "@/domain/pens/model";
type Picker = {
  value: string;
  label: string;
  choose: (color: string) => void;
  isCurrent: () => boolean;
};
const PickerContext = createContext<(picker: Picker) => void>(() => {});
export function PenColors({ set, children }: { set: PenSet; children: ReactNode }) {
  const [picker, setPicker] = useState<Picker | null>(null);
  useEffect(() => {
    if (picker && !picker.isCurrent()) setPicker(null);
  }, [picker, children]);
  return (
    <PickerContext.Provider value={setPicker}>
      {children}
      {picker &&
        createPortal(
          <ColorPicker
            key={picker.label}
            picker={picker}
            set={set}
            close={() => setPicker(null)}
          />,
          document.body,
        )}
    </PickerContext.Provider>
  );
}
const HEX = /^#[0-9a-f]{6}$/i;

/** A row of colour buttons; the current colour is ringed. */
function Swatches({
  colors,
  current,
  onChoose,
  size = "h-6 w-6",
  extra,
}: {
  colors: readonly { hex: string; name?: string }[];
  current: string;
  onChoose: (hex: string) => void;
  size?: string;
  extra?: (hex: string) => ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {colors.map(({ hex, name }) => (
        <span key={hex} className="group relative">
          <button
            type="button"
            title={name ? `${name} · ${hex}` : hex}
            aria-label={`${name ?? "Farbe"} ${hex}`}
            aria-pressed={hex.toLowerCase() === current.toLowerCase()}
            className={`${size} block rounded border shadow-sm hover:ring-2 hover:ring-primary aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-1`}
            style={{ backgroundColor: hex }}
            onClick={() => onChoose(hex)}
          />
          {extra?.(hex)}
        </span>
      ))}
    </div>
  );
}

/**
 * The colour window of every colour field (docs/FARBEN.md, F2): standard palette, own and recent
 * colours, the inventory of the pen set, a free colour and HEX. A click takes the colour.
 */
function ColorPicker({ picker, set, close }: { picker: Picker; set: PenSet; close: () => void }) {
  const [hex, setHex] = useState(picker.value);
  const memory = useColorMemory();
  // The window takes the keyboard: Escape closes it at once, a HEX value can be typed.
  const hexField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    hexField.current?.focus();
    hexField.current?.select();
  }, []);
  const valid = HEX.test(hex);
  const choose = (color: string) => {
    memory.used(color);
    picker.choose(color.toLowerCase());
    close();
  };
  const inventory = set.inventory
    .map((id) => set.pens.find((p) => p.id === id))
    .filter((pen) => pen !== undefined)
    .map((pen) => ({ hex: pen.color, name: pen.name }));
  return (
    <FloatingPanel open title={`Farbe · ${picker.label}`} onClose={close} width={420} height={600}>
      <div className="space-y-3 overflow-auto p-4 text-xs">
        <div className="flex items-center gap-3" aria-label="Vorschau">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-8 w-10 rounded-l border"
              style={{ backgroundColor: picker.value }}
              title={`Bisher ${picker.value}`}
            />
            <span
              className="inline-block h-8 w-10 rounded-r border"
              style={{ backgroundColor: valid ? hex : picker.value }}
              title={`Neu ${hex}`}
            />
          </span>
          <span className="text-muted-foreground">
            Bisher {picker.value} · Neu {valid ? hex : "–"}
          </span>
        </div>
        <section aria-label="Standardpalette" className="space-y-1">
          <p className="font-medium">Standardpalette</p>
          {STANDARD_PALETTE.map((row) => (
            <div key={row.name} className="flex items-center gap-2" aria-label={row.name}>
              <Swatches colors={row.colors} current={picker.value} onChoose={choose} />
              <span className="text-muted-foreground">{row.name}</span>
            </div>
          ))}
        </section>
        <section aria-label="Meine Farben" className="space-y-1">
          <p className="flex items-center justify-between font-medium">
            Meine Farben
            <button
              type="button"
              disabled={!valid || memory.own.includes(hex.toLowerCase())}
              className="rounded border px-2 py-0.5 font-normal hover:bg-muted disabled:opacity-40"
              onClick={() => memory.keep(hex)}
            >
              Neue Farbe merken
            </button>
          </p>
          {memory.own.length ? (
            <Swatches
              colors={memory.own.map((c) => ({ hex: c, name: "Eigene Farbe" }))}
              current={picker.value}
              onChoose={choose}
              extra={(c) => (
                <button
                  type="button"
                  aria-label={`Eigene Farbe ${c} entfernen`}
                  title="Entfernen"
                  className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 rounded-full border bg-background text-[9px] leading-none group-hover:block"
                  onClick={() => memory.forget(c)}
                >
                  ×
                </button>
              )}
            />
          ) : (
            <p className="text-muted-foreground">
              Noch keine. Farbe unten mischen oder eingeben, dann „Neue Farbe merken“.
            </p>
          )}
        </section>
        {memory.recent.length > 0 && (
          <section aria-label="Zuletzt verwendet" className="space-y-1">
            <p className="font-medium">Zuletzt verwendet</p>
            <Swatches
              colors={memory.recent.map((c) => ({ hex: c, name: "Zuletzt" }))}
              current={picker.value}
              onChoose={choose}
            />
          </section>
        )}
        <section aria-label="Stifteset" className="space-y-1">
          <p className="font-medium">{set.name} · Inventar</p>
          {inventory.length ? (
            <Swatches colors={inventory} current={picker.value} onChoose={choose} size="h-8 w-8" />
          ) : (
            <p className="text-muted-foreground">
              Noch keine Inventarfarben. Unter Tools → Stifteset hinzufügen.
            </p>
          )}
        </section>
        <ColorPalette value={picker.value} onChoose={choose} onPreview={setHex} />
        <label className="block">
          HEX-Farbwert
          <input
            ref={hexField}
            aria-label="HEX-Farbwert"
            className="ml-2 rounded border bg-background p-2"
            value={hex}
            maxLength={7}
            onChange={(e) => setHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && HEX.test(hex)) {
                e.preventDefault();
                choose(hex);
              }
            }}
          />
          <button
            type="button"
            disabled={!valid}
            className="ml-2 rounded border px-2 py-1 hover:bg-muted disabled:opacity-40"
            onClick={() => choose(hex)}
          >
            Übernehmen
          </button>
        </label>
        <p className="text-muted-foreground">
          Farbe anklicken: direkt verwenden. Escape: schließen, nichts ändert sich.
        </p>
      </div>
    </FloatingPanel>
  );
}
export function ColorField({
  value,
  onChange,
  label,
  disabled = false,
  compact = false,
  title,
  className,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
  disabled?: boolean;
  /** Only the colour, no HEX text: for narrow rows (docs/FARBEN.md, F3). */
  compact?: boolean;
  title?: string | undefined;
  className?: string | undefined;
}) {
  const open = useContext(PickerContext);
  const commit = useContext(PropertyCommitContext);
  const latest = useRef(onChange);
  latest.current = onChange;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={title ?? value}
      className={
        className ??
        (compact
          ? "block h-7 w-10 rounded border bg-background p-0.5 disabled:opacity-40"
          : "block h-8 min-w-20 rounded border bg-background px-2 text-xs disabled:opacity-40")
      }
      onClick={() =>
        open({
          value,
          label,
          isCurrent: () => alive.current,
          choose: (color) => {
            if (alive.current) {
              latest.current(color);
              commit();
            }
          },
        })
      }
    >
      {compact ? (
        <span className="block h-full w-full rounded-sm" style={{ backgroundColor: value }} />
      ) : (
        <>
          <span
            className="mr-2 inline-block h-3 w-4 rounded-sm border align-middle"
            style={{ backgroundColor: value }}
          />
          {value}
        </>
      )}
    </button>
  );
}
