/** Browser-profile preference, separate from projects and model Undo. */
export const AUTOSAVE_PREFERENCE_KEY = "novikov.autosave.enabled.v1";
type StoragePort = Pick<Storage, "getItem" | "setItem">;
export function readAutosavePreference(storage: StoragePort): boolean {
  // Only an explicit stored opt-out disables the default.
  return storage.getItem(AUTOSAVE_PREFERENCE_KEY) !== "false";
}
export function writeAutosavePreference(storage: StoragePort, enabled: boolean): void {
  storage.setItem(AUTOSAVE_PREFERENCE_KEY, String(enabled));
}
