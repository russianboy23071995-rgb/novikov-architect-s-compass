import { useEffect, useRef } from "react";
import type { ReferenceSelectionBinding } from "./useReferenceSelection";
import type { SnapReference } from "@/constraints/snapping/engine";
import { segmentKey } from "@/application/snapping/reference-selection";
export function ReferenceSelectionPanel({
  binding,
  paused,
  label,
  pointPreview,
  onApplyPoints,
  pointsEnabled,
}: {
  binding: ReferenceSelectionBinding;
  paused: boolean;
  label: (r: SnapReference) => string;
  pointPreview: { replaced: readonly SnapReference[] } | null;
  onApplyPoints: () => void;
  pointsEnabled: boolean;
}) {
  const points = binding.mode === "points";
  const canApply = points
    ? pointsEnabled && binding.points.length > 0 && pointPreview !== null
    : Boolean(binding.state.draft?.length);
  const apply = () => {
    if (canApply) {
      if (points) onApplyPoints();
      else binding.apply();
    }
  };
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
        apply();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  });
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
          <div className="flex gap-2 mb-1">
            <button
              className={button}
              aria-pressed={!points}
              onClick={() => binding.setMode("segments")}
            >
              Linien
            </button>
            <button
              className={button}
              aria-pressed={points}
              onClick={() => binding.setMode("points")}
            >
              Punkte
            </button>
          </div>
          <p>
            {points ? "Punkte" : "Referenzlinien"} im Canvas anklicken ·{" "}
            {points ? binding.points.length : (binding.state.draft?.length ?? 0)} ausgewählt
          </p>
          {points && !pointsEnabled && <p role="status">Punktübernahme benötigt aktiven Snap.</p>}
          {points && !pointPreview && (
            <p role="status">Höchstens vier zusätzliche Hilfspunkte auswählen.</p>
          )}
          {points && pointPreview && (
            <p role="status">
              {pointPreview.replaced.length
                ? "Wird ersetzt: " + pointPreview.replaced.map(label).join(", ")
                : "Keine bestehende Hilfsreferenz wird ersetzt."}
            </p>
          )}
          <div className="flex gap-2">
            <button className={button} disabled={!canApply} onClick={apply}>
              Referenzen übernehmen
            </button>
            <button className={button} onClick={binding.cancel}>
              Referenzauswahl abbrechen
            </button>
          </div>
          {binding.hits.length > 1 && (
            <div aria-label="Überlappende Referenzlinien" className="mt-2 max-h-36 overflow-auto">
              <p>{points ? "Welcher Punkt?" : "Welche Linie?"}</p>
              {binding.hits.map((r) => (
                <button
                  key={segmentKey(r)}
                  className={button + " block w-full text-left"}
                  onMouseEnter={() => binding.highlight(r)}
                  onFocus={() => binding.highlight(r)}
                  onClick={() => binding.toggle(r)}
                >
                  {label(r)}{" "}
                  {(
                    points
                      ? binding.points.some((p) => segmentKey(p) === segmentKey(r))
                      : binding.state.draft?.includes(segmentKey(r))
                  )
                    ? "✓"
                    : ""}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
