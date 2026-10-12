import type { useReferenceCalibration } from "./useReferenceCalibration";

export function ReferenceCalibrationControls({
  calibration,
  beforeBegin,
}: {
  calibration: ReturnType<typeof useReferenceCalibration>;
  beforeBegin: () => void;
}) {
  return calibration.active ? (
    <div className="grid gap-2">
      <p>
        {calibration.points === 0
          ? "Ersten Messpunkt wählen"
          : calibration.points === 1
            ? "Zweiten Messpunkt wählen"
            : "Tatsächliche Länge eingeben"}
      </p>
      {calibration.points === 2 && (
        <>
          <label>
            Länge mit Einheit
            <input
              aria-label="Kalibrierlänge"
              className="w-full rounded border bg-background p-1"
              placeholder="z. B. 5 m"
              value={calibration.length}
              onChange={(e) => calibration.setLength(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") calibration.cancel();
              }}
            />
          </label>
          <button onClick={calibration.confirm}>Kalibrierung übernehmen</button>
        </>
      )}
      <button onClick={calibration.cancel}>Kalibrierung abbrechen</button>
      {calibration.error && <p role="alert">{calibration.error}</p>}
    </div>
  ) : (
    <button
      onClick={() => {
        beforeBegin();
        calibration.begin();
      }}
    >
      Zweipunkt-Kalibrierung
    </button>
  );
}
