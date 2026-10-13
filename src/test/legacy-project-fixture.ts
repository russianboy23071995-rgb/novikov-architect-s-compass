/** Test-only: remove the field absent from older versions when deriving old fixtures from current ones. */
export function legacyProjectFixture<T>(value: T): T {
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    typeof value.schemaVersion !== "number" ||
    value.schemaVersion >= 22 ||
    !("storey" in value) ||
    !value.storey ||
    typeof value.storey !== "object"
  )
    return value;
  const { height: _height, ...named } = value.storey as Record<string, unknown>;
  const { name: _name, ...unnamed } = named;
  const storey = value.schemaVersion < 21 ? unnamed : named;
  return { ...value, storey };
}
export const legacyFixtureJSON = (value: unknown) => JSON.stringify(legacyProjectFixture(value));
