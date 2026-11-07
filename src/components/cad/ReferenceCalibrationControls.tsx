import type { useReferenceCalibration } from "./useReferenceCalibration";

const metres = (value: number) =>
  `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} m`;

/**
 * Kalibrieren and An Linie ausrichten of an image underlay in its on-demand menu
 * (docs/BILDUNTERLAGE.md, B3/B4). After two points the length field takes the focus, so a typed
 * digit goes straight in; Enter applies, Esc cancels. A bare number is metres.
 */
export function ReferenceCalibrationControls({
  calibration,
  beforeBegin,
}: {
  calibration: ReturnType<typeof useReferenceCalibration>;
  beforeBegin: () => void;
}) {
  if (!calibration.active)
    return (
      <>
        <button
          onClick={() => {
            beforeBegin();
            calibration.begin("scale");
          }}
        >
          Zweipunkt-Kalibrierung
        </button>
        <button
          onClick={() => {
            beforeBegin();
            calibration.begin("align");
          }}
        >
          An Linie ausrichten
        </button>
      </>
    );
  const align = calibration.mode === "align";
  return (
    <div className="grid gap-2">
      <p>
        {calibration.points === 0
          ? align
            ? "Ersten Punkt einer Linie im Bild wählen"
            : "Ersten Messpunkt wählen"
          : calibration.points === 1
            ? align
              ? "Zweiten Punkt der Linie wählen · das Bild dreht mit"
              : "Zweiten Messpunkt wählen"
            : "Tatsächliche Länge eingeben"}
      </p>
      {calibration.points === 2 && (
        <>
          {calibration.measured !== null && (
            <p className="text-muted-foreground">Im Bild jetzt: {metres(calibration.measured)}</p>
          )}
          <label>
            Länge (m oder mit Einheit)
            <input
              aria-label="Kalibrierlänge"
              autoFocus
              className="w-full rounded border bg-background p-1"
              placeholder="z. B. 8 oder 800 cm"
              value={calibration.length}
              onChange={(e) => calibration.setLength(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") calibration.cancel();
                if (e.key === "Enter") {
                  e.preventDefault();
                  calibration.confirm();
                }
              }}
            />
          </label>
          <button onClick={calibration.confirm}>Kalibrierung übernehmen</button>
        </>
      )}
      <button onClick={calibration.cancel}>
        {align ? "Ausrichten abbrechen" : "Kalibrierung abbrechen"}
      </button>
      {calibration.error && <p role="alert">{calibration.error}</p>}
    </div>
  );
}
