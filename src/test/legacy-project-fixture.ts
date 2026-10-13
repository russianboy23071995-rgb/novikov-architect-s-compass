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
