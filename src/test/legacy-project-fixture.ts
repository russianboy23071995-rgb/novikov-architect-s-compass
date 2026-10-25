/** Derive strict historical fixtures from the current canonical storey collection. */
export function legacyProjectFixture<T>(value: T): T {
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    typeof value.schemaVersion !== "number" ||
    value.schemaVersion >= 24
  )
    return value;
  const record = value as Record<string, unknown>;
  const { storeys, groundStoreyId, ...base } = record;
  const storey = (record["storey"] ??
    (storeys as { id: string }[] | undefined)?.find((s) => s.id === groundStoreyId)) as
    Record<string, unknown> | undefined;
  if (!storey) return value;
  if (value.schemaVersion === 23) return { ...base, storey } as T;
  const { groundDatum: _datum, ...legacy } = base;
  if (value.schemaVersion === 22) return { ...legacy, storey } as T;
  const { height: _height, ...named } = storey;
  const { name: _name, ...unnamed } = named;
  return { ...legacy, storey: value.schemaVersion < 21 ? unnamed : named } as T;
}
export const legacyFixtureJSON = (value: unknown) => JSON.stringify(legacyProjectFixture(value));

/** Schema 28 migration numbers existing windows and doors (user decision 25.10.2026). Tests of
 * older migrations compare geometry and identity, so they drop only these new numbers.
 */
export function withoutOpeningMarks<T>(value: T): T {
  const strip = (storey: Record<string, unknown>) => {
    const unmark = (items: unknown) =>
      (items as Record<string, unknown>[]).map(({ mark: _mark, ...item }) => item);
    return {
      ...storey,
      windows: unmark(storey["windows"]),
      ...(storey["doors"] ? { doors: unmark(storey["doors"]) } : {}),
    };
  };
  const record = value as Record<string, unknown>;
  if (Array.isArray(record["storeys"]))
    return {
      ...record,
      storeys: (record["storeys"] as Record<string, unknown>[]).map(strip),
    } as T;
  return strip(record) as T;
}
