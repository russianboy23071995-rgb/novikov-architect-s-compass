import { useEffect, useRef } from "react";
import type { ReferenceSelectionBinding } from "./useReferenceSelection";
import type { SnapReference } from "@/constraints/snapping/engine";
import { segmentKey } from "@/application/snapping/reference-selection";
export function ReferenceSelectionPanel({
  binding,
  paused,
  label,
}: {
  binding: ReferenceSelectionBinding;
  paused: boolean;
  label: (r: SnapReference) => string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (binding.selecting) panel.current?.focus();
  }, [binding.selecting]);
  useEffect(() => {
    if (!binding.selecting) return;
    const key = (event: KeyboardEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"],[role="alertdialog"]')
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (binding.hits.length) binding.hitsAt([]);
        else binding.cancel();
      } else if (
        event.key === "Enter" &&
        !(event.target instanceof Element && event.target.closest("button"))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        binding.apply();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [binding]);
  const button =
    "rounded border border-border bg-background px-2 py-1 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary";
  return (
    <div
      ref={panel}
      tabIndex={-1}
      data-reference-panel
      role="region"
      aria-label="Referenzlinienauswahl"
      className="rounded border border-border bg-popover/95 p-2 text-xs text-foreground shadow backdrop-blur"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {paused && (
        <p role="status">
          Viele Fangziele – automatische Schnittpunkte pausiert.{" "}
          {binding.selected
            ? "Auswahl reduzieren."
            : "Referenzen auswählen oder Ansicht vergrößern."}
        </p>
      )}
      {!binding.selecting ? (
        <div className="flex gap-2 items-center">
          <button className={button} onClick={binding.begin}>
            {binding.selected ? "Ändern" : "Referenzen auswählen"}
          </button>
          {binding.selected && (
            <>
              <span role="status">{binding.selected.size} Referenzen</span>
              <button className={button} onClick={binding.clear}>
                Aufheben
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <p>Referenzlinien im Canvas anklicken · {binding.state.draft?.length ?? 0} ausgewählt</p>
          <div className="flex gap-2">
            <button
              className={button}
              disabled={!binding.state.draft?.length}
              onClick={binding.apply}
            >
              Referenzen übernehmen
            </button>
            <button className={button} onClick={binding.cancel}>
              Referenzauswahl abbrechen
            </button>
          </div>
          {binding.hits.length > 1 && (
            <div aria-label="Überlappende Referenzlinien" className="mt-2 max-h-36 overflow-auto">
              <p>Welche Linie?</p>
              {binding.hits.map((r) => (
                <button
                  key={segmentKey(r)}
                  className={button + " block w-full text-left"}
                  onMouseEnter={() => binding.highlight(r)}
                  onFocus={() => binding.highlight(r)}
                  onClick={() => binding.toggle(r)}
                >
                  {label(r)} {binding.state.draft?.includes(segmentKey(r)) ? "✓" : ""}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
