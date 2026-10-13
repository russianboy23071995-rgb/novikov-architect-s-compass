/** Test-only: remove the field absent from versions 1–20 when deriving old fixtures from current ones. */
export function legacyProjectFixture<T>(value: T): T {
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    typeof value.schemaVersion !== "number" ||
    value.schemaVersion >= 21 ||
    !("storey" in value) ||
    !value.storey ||
    typeof value.storey !== "object"
  )
    return value;
  const { name: _name, ...storey } = value.storey as Record<string, unknown>;
  return { ...value, storey };
}
export const legacyFixtureJSON = (value: unknown) => JSON.stringify(legacyProjectFixture(value));
