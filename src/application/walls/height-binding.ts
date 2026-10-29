import { validateProject, type Project } from "../../domain/project/schema.ts";
export type SetWallHeight = {
  projectId: string;
  storeyId: string;
  wallIds: readonly string[];
  /** Fixed height, or bound to the own storey height plus an extra height (29.10.2026). */
  rule: { kind: "fixed"; height: number } | { kind: "storey"; topOffset: number };
};
/** Explicit shared action: all targets validated and published together, no renderer/AI mutation. */
export function setWallHeightRule(
  base: Project,
  current: Project,
  request: SetWallHeight,
): Project {
  const storey = current.storeys.find((s) => s.id === request.storeyId);
  if (base !== current || current.id !== request.projectId || !storey)
    throw new Error("Der Wandhöhenkontext wurde geändert.");
  const ids = new Set(request.wallIds);
  if (
    !ids.size ||
    ids.size !== request.wallIds.length ||
    [...ids].some((id) => !storey.walls.some((w) => w.id === id))
  )
    throw new Error("Ungültige Wandauswahl für die Höhenbindung.");
  return validateProject({
    ...current,
    storeys: current.storeys.map((s) =>
      s !== storey
        ? s
        : {
            ...s,
            walls: s.walls.map((w) => {
              if (!ids.has(w.id)) return w;
              const { topBinding: _previous, ...fixed } = w;
              const rule = request.rule;
              if (rule.kind === "fixed") return { ...fixed, height: rule.height };
              return { ...fixed, topBinding: { kind: rule.kind, topOffset: rule.topOffset } };
            }),
          },
    ),
  });
}
