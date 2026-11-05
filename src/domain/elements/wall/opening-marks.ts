/** Position numbers of windows and doors (schema 28, user decision 25.10.2026):
 * "<kind>-<storey>-<nn>", e.g. "T-EG-01", "F-OG1-03", "T-UG1-02". The storey code follows the
 * storey's place relative to the ground storey, not its name. Numbers are stored, so they stay
 * stable when other elements are deleted or storeys are added; they may be edited freely and
 * duplicates are allowed (hint only).
 */
type Marked = { id: string; mark?: string | undefined };
type MarkStorey = { id: string; windows: readonly Marked[]; doors?: readonly Marked[] | undefined };
type MarkProject = { groundStoreyId: string; storeys: readonly MarkStorey[] };
export type OpeningKind = "window" | "door";

const LETTER = { window: "F", door: "T" } as const;

export function storeyCode(project: MarkProject, storeyId: string): string {
  const ground = project.storeys.findIndex((s) => s.id === project.groundStoreyId);
  const index = project.storeys.findIndex((s) => s.id === storeyId);
  if (ground < 0 || index < 0) throw new Error("Unbekanntes Geschoss für die Positionsnummer.");
  const offset = index - ground;
  return offset === 0 ? "EG" : offset > 0 ? `OG${offset}` : `UG${-offset}`;
}

function markPrefix(project: MarkProject, storeyId: string, kind: OpeningKind) {
  return `${LETTER[kind]}-${storeyCode(project, storeyId)}-`;
}

/** Highest used number per prefix across the project; gaps are never refilled. */
function highestNumbers(project: MarkProject): Map<string, number> {
  const highest = new Map<string, number>();
  for (const storey of project.storeys)
    for (const opening of [...storey.windows, ...(storey.doors ?? [])]) {
      const match = /^(.*-)(\d+)$/.exec(opening.mark ?? "");
      if (!match) continue;
      const n = Number(match[2]);
      if (n > (highest.get(match[1]!) ?? 0)) highest.set(match[1]!, n);
    }
  return highest;
}

const format = (prefix: string, n: number) => `${prefix}${String(n).padStart(2, "0")}`;

/** Next free number for a new window or door on the given storey. */
export function nextOpeningMark(project: MarkProject, storeyId: string, kind: OpeningKind): string {
  const prefix = markPrefix(project, storeyId, kind);
  return format(prefix, (highestNumbers(project).get(prefix) ?? 0) + 1);
}

/** Numbers for every window and door without one, per storey in stored order (windows, then
 * doors). Used by the schema 27 → 28 migration; existing numbers are kept.
 */
export function withOpeningMarks<P extends MarkProject>(project: P): P {
  const highest = highestNumbers(project);
  const assign = <T extends Marked>(storeyId: string, kind: OpeningKind, items: readonly T[]) =>
    items.map((item) => {
      if (item.mark !== undefined) return item;
      const prefix = markPrefix(project, storeyId, kind);
      const n = (highest.get(prefix) ?? 0) + 1;
      highest.set(prefix, n);
      return { ...item, mark: format(prefix, n) };
    });
  return {
    ...project,
    storeys: project.storeys.map((s) => ({
      ...s,
      windows: assign(s.id, "window", s.windows),
      ...(s.doors ? { doors: assign(s.id, "door", s.doors) } : {}),
    })),
  };
}

/** Readable name of a window or door: its position number, else its technical ID. */
export function openingLabel(opening: Marked): string {
  return opening.mark ?? opening.id;
}

/** Hint for a number used more than once in the project, or "". */
export function duplicateMarkHint(project: MarkProject, id: string): string {
  const all = project.storeys.flatMap((s) => [...s.windows, ...(s.doors ?? [])]);
  const mark = all.find((o) => o.id === id)?.mark;
  if (mark === undefined) return "";
  const count = all.filter((o) => o.mark === mark).length;
  return count > 1 ? `Hinweis: Nummer ${mark} ist ${count}-mal vergeben` : "";
}
