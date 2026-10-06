/** Session preferences, independent of model/history and visible background grid. */
export type GridSettings = Readonly<{ enabled: boolean; spacing: number }>;
export const defaultGridSettings: GridSettings = Object.freeze({ enabled: true, spacing: 0.1 });

export function parseGridSpacing(text: string): number {
  const normalized = text.trim().replace(",", ".");
  const value = Number(normalized);
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) || !Number.isFinite(value) || value <= 0)
    throw new Error("Bitte eine positive Schrittweite in Metern eingeben.");
  return value;
}

export function gridSpacing(settings: GridSettings): number | null {
  if (!Number.isFinite(settings.spacing) || settings.spacing <= 0)
    throw new Error("Ungültige Rasterschrittweite.");
  return settings.enabled ? settings.spacing : null;
}
