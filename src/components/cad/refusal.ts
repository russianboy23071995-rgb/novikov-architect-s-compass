/** The readable German message of a refused change, also from a schema (Zod) issue list. */
export function refusal(error: unknown): string {
  const fallback = "Nicht übernommen: Werte prüfen.";
  if (!(error instanceof Error)) return fallback;
  if (!error.message.startsWith("[")) return error.message;
  try {
    return (JSON.parse(error.message) as { message?: string }[])[0]?.message ?? fallback;
  } catch {
    return fallback;
  }
}
