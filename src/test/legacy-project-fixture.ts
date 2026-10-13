/** Test-only: remove the field absent from older versions when deriving old fixtures from current ones. */
export function legacyProjectFixture<T>(value: T): T {
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    typeof value.schemaVersion !== "number" ||
    value.schemaVersion >= 23 ||
    !("storey" in value) ||
    !value.storey ||
    typeof value.storey !== "object"
  )
    return value;
  const { groundDatum: _datum, ...base } = value as Record<string, unknown>;
  if (value.schemaVersion === 22) return base as T;
  const { height: _height, ...named } = value.storey as Record<string, unknown>;
  const { name: _name, ...unnamed } = named;
  const storey = value.schemaVersion < 21 ? unnamed : named;
  return { ...base, storey } as T;
}
export const legacyFixtureJSON = (value: unknown) => JSON.stringify(legacyProjectFixture(value));
