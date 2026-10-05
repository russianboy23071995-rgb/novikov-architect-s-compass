import { z } from "zod";
import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";

const scopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("bim-project") }).strict(),
  z.object({ kind: z.literal("drawing-document"), documentId: z.string().trim().min(1) }).strict(),
]);
export type LayerVisibilityScope = Readonly<z.infer<typeof scopeSchema>>;
export type LayerVisibilityContext = Readonly<{
  scope: LayerVisibilityScope;
  hiddenLayerIds: readonly string[];
}>;
export type LayerEligibility =
  | { eligible: true; reason: "visible" }
  | {
      eligible: false;
      reason:
        "stale-project" | "stale-context" | "unknown-element" | "hidden-layer" | "hidden-host";
    };

/** One read-only policy for future display/picking/snap consumers, never an export filter.
 * Project snapshots must be immutable, as with the existing Application actions.
 * Document existence is the future binding adapter's responsibility: schema 2 has no documents.
 */
export function createLayerVisibilityPolicy(base: Project, input: LayerVisibilityContext) {
  const project = validateProject(base);
  const scope = Object.freeze(scopeSchema.parse(input.scope));
  const layerIds = new Set(project.layers.map((layer) => layer.id));
  const hidden = new Set(input.hiddenLayerIds);
  for (const id of hidden)
    if (!layerIds.has(id)) throw new Error(`Unknown visibility layer: ${id}`);
  const context: LayerVisibilityContext = Object.freeze({
    scope,
    hiddenLayerIds: Object.freeze([...hidden]),
  });
  // Build once per snapshot/context, not by scanning all elements on every pointer move.
  const elements = new Map(
    [...project.storey.walls, ...project.storey.windows, ...(project.storey.lines ?? [])].map(
      (element) => [element.id, element] as const,
    ),
  );
  const walls = new Map(project.storey.walls.map((wall) => [wall.id, wall]));
  return Object.freeze({
    context,
    evaluate(
      current: Project,
      currentContext: LayerVisibilityContext,
      elementId: string,
    ): LayerEligibility {
      if (current !== base) return { eligible: false, reason: "stale-project" };
      if (currentContext !== context) return { eligible: false, reason: "stale-context" };
      const element = elements.get(elementId);
      if (!element) return { eligible: false, reason: "unknown-element" };
      if (hidden.has(element.layerId)) return { eligible: false, reason: "hidden-layer" };
      if ("wallId" in element && hidden.has(walls.get(element.wallId)!.layerId))
        return { eligible: false, reason: "hidden-host" };
      return { eligible: true, reason: "visible" };
    },
  });
}
