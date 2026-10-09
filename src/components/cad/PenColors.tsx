import { ColorPalette } from "./ColorPalette";
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
function ColorPicker({ picker, set, close }: { picker: Picker; set: PenSet; close: () => void }) {
  const [hex, setHex] = useState(picker.value);
  const choose = (color: string) => {
    picker.choose(color);
    close();
  };
  return (
    <FloatingPanel open title={`Farbe · ${picker.label}`} onClose={close} width={380} height={470}>
      <div className="space-y-4 overflow-auto p-4 text-xs">
        <p className="font-medium">{set.name} · Inventar</p>
        <div className="flex flex-wrap gap-2">
          {set.inventory.map((id) => {
            const pen = set.pens.find((p) => p.id === id)!;
            return (
              <button
                type="button"
                key={id}
                title={pen.name}
                aria-label={`${pen.name} ${pen.color}`}
                className="h-10 w-10 rounded-lg border shadow-sm hover:ring-2 hover:ring-primary"
                style={{ backgroundColor: pen.color }}
                onClick={() => choose(pen.color)}
              />
            );
          })}
        </div>
        {!set.inventory.length && (
          <p>Noch keine Inventarfarben. Unter Tools → Stifteset hinzufügen.</p>
        )}
        <ColorPalette value={hex} onChoose={choose} />
        <label className="block">
          HEX-Farbwert
          <input
            aria-label="HEX-Farbwert"
            className="ml-2 rounded border bg-background p-2"
            value={hex}
            maxLength={7}
            onChange={(e) => setHex(e.target.value)}
            onBlur={() => {
              if (/^#[0-9a-f]{6}$/i.test(hex) && hex !== picker.value) choose(hex);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && /^#[0-9a-f]{6}$/i.test(hex)) {
                e.preventDefault();
                choose(hex);
              }
            }}
          />
        </label>
        <p className="text-muted-foreground">
          Farbe anklicken: direkt verwenden. Escape: schließen.
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
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
  disabled?: boolean;
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
      title={value}
      className="block h-8 min-w-20 rounded border bg-background px-2 text-xs disabled:opacity-40"
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
      <span
        className="mr-2 inline-block h-3 w-4 rounded-sm border align-middle"
        style={{ backgroundColor: value }}
      />
      {value}
    </button>
  );
}
