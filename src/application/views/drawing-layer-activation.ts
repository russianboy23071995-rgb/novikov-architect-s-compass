import type { Project } from "../../domain/project/schema.ts";

export function activateDrawnLayers(before: Project, after: Project, documentId: string) {
  const document = after.drawingDocuments?.find((d) => d.id === documentId);
  if (!document || before.id !== after.id) throw new Error("Das Abbild ist nicht mehr verfügbar.");
  const elements = (p: Project) =>
    Object.values(p.storey)
      .flatMap<unknown>((value) => (Array.isArray(value) ? value : []))
      .filter(
        (value): value is { id: string; layerId: string } =>
          !!value && typeof value === "object" && "layerId" in value && "id" in value,
      );
  const ids = new Set(elements(before).map((e) => e.id));
  const layerIds = [
    ...new Set(
      elements(after)
        .filter((e) => !ids.has(e.id) && document.hiddenLayerIds.includes(e.layerId))
        .map((e) => e.layerId),
    ),
  ];
  if (!layerIds.length) return { project: after, layerIds };
  return {
    project: {
      ...after,
      drawingDocuments: after.drawingDocuments!.map((d) =>
        d.id === documentId
          ? { ...d, hiddenLayerIds: d.hiddenLayerIds.filter((id) => !layerIds.includes(id)) }
          : d,
      ),
    },
    layerIds,
  };
}
