/** Minimal domain input; height is OK raw floor to the next raw floor, in metres.
 * null represents an unknown legacy height, never a zero-height storey.
 * The sequence runs from the lowest storey to the highest; IDs remain stable.
 */
export type StoreyHeight = Readonly<{ id: string; height: number | null }>;
export type StoreyLevel = Readonly<{
  storeyId: string;
  elevation: number | null;
  upperElevation: number | null;
}>;

function assertHeight(height: number | null) {
  if (height !== null && (!Number.isFinite(height) || height <= 0))
    throw new Error("Geschosshöhe muss endlich und größer als null sein.");
}
function validateSequence(storeys: readonly StoreyHeight[], groundStoreyId: string) {
  const ids = new Set<string>();
  for (const storey of storeys) {
    if (!storey.id?.trim() || storey.id !== storey.id.trim() || ids.has(storey.id))
      throw new Error("Geschosse benötigen eindeutige, gültige IDs.");
    ids.add(storey.id);
    assertHeight(storey.height);
  }
  const ground = storeys.findIndex((storey) => storey.id === groundStoreyId);
  if (ground < 0) throw new Error("Das Bezugsgeschoss Erdgeschoss fehlt.");
  return ground;
}
function step(base: number | null, height: number | null, direction: 1 | -1) {
  if (base === null || height === null) return null;
  const result = base + direction * height;
  if (!Number.isFinite(result) || (direction === 1 ? result <= base : result >= base))
    throw new Error("Geschossbezüge sind numerisch nicht eindeutig darstellbar.");
  return result;
}

/** One derivation for rendering/export/actions; never stores a second editable elevation. */
export function resolveStoreyLevels(
  storeys: readonly StoreyHeight[],
  groundStoreyId: string,
): readonly StoreyLevel[] {
  const ground = validateSequence(storeys, groundStoreyId);
  const elevations: (number | null)[] = Array(storeys.length).fill(null);
  elevations[ground] = 0;
  for (let i = ground + 1; i < storeys.length; i++)
    elevations[i] = step(elevations[i - 1] ?? null, storeys[i - 1]!.height, 1);
  for (let i = ground - 1; i >= 0; i--)
    elevations[i] = step(elevations[i + 1] ?? null, storeys[i]!.height, -1);
  return Object.freeze(
    storeys.map((storey, i) =>
      Object.freeze({
        storeyId: storey.id,
        elevation: elevations[i] ?? null,
        // A basement top can be known even when its own floor is unknown.
        upperElevation:
          i + 1 < storeys.length
            ? (elevations[i + 1] ?? null)
            : step(elevations[i] ?? null, storey.height, 1),
      }),
    ),
  );
}

/** Preserve metadata and stable identities; application commits the result atomically. */
export function changeStoreyHeight<T extends StoreyHeight>(
  storeys: readonly T[],
  groundStoreyId: string,
  storeyId: string,
  height: number,
): readonly (Omit<T, "height"> & StoreyHeight)[] {
  resolveStoreyLevels(storeys, groundStoreyId);
  if (height === null) throw new Error("Eine neue Geschosshöhe ist erforderlich.");
  assertHeight(height);
  const index = storeys.findIndex((storey) => storey.id === storeyId);
  if (index < 0) throw new Error("Das gewählte Geschoss fehlt.");
  if (storeys[index]!.height === height) return storeys;
  const next = storeys.map((storey, i) => (i === index ? { ...storey, height } : storey));
  resolveStoreyLevels(next, groundStoreyId);
  return next;
}

/** Insertion adds the supplied interval; it never splits an existing height. */
export function insertStorey<T extends StoreyHeight>(
  storeys: readonly T[],
  groundStoreyId: string,
  anchorId: string,
  side: "above" | "below",
  added: T,
): readonly T[] {
  resolveStoreyLevels(storeys, groundStoreyId);
  if (side !== "above" && side !== "below") throw new Error("Ungültige Einfügerichtung.");
  if (added.height === null) throw new Error("Die Höhe des neuen Geschosses fehlt.");
  const anchor = storeys.findIndex((storey) => storey.id === anchorId);
  if (anchor < 0) throw new Error("Das gewählte Geschoss fehlt.");
  const index = anchor + (side === "above" ? 1 : 0);
  const next = [...storeys.slice(0, index), added, ...storeys.slice(index)];
  const levels = resolveStoreyLevels(next, groundStoreyId);
  if (levels.some((level) => level.elevation === null))
    throw new Error("Vor dem Einfügen müssen die benötigten Geschosshöhen festgelegt werden.");
  return next;
}
