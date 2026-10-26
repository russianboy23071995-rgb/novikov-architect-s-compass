/** User-facing reason for a rejected element command: the actual rule, never a generic guess.
 * Opening fit errors of the model validation are English; they get their German wording.
 */
export function commandFailure(error: unknown): Error {
  const message = error instanceof Error ? error.message : "";
  if (!message || message === "Missing target")
    return new Error("Änderung nicht möglich: Bauteil muss vorhanden sein.");
  if (/must fit within its wall/.test(message))
    return new Error("Änderung nicht möglich: Das Fenster muss vollständig in die Wand passen.");
  return new Error(`Änderung nicht möglich: ${message}`);
}
