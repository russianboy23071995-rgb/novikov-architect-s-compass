import { createExampleProject } from "../src/components/cad/bim-view.ts";
import { ensureDocumentFolder } from "../src/application/views/documents.ts";
import { validateProject, type Project } from "../src/domain/project/schema.ts";
import { createImageAssetHandle, type ImageAsset } from "../src/domain/elements/reference/model.ts";

export function recoveryFixture(id: string, count: number, image?: ImageAsset): Project {
  const base = ensureDocumentFolder({ ...createExampleProject(), id });
  const layerId = base.storey.walls[0]!.layerId;
  return validateProject({
    ...base,
    assets: image ? [createImageAssetHandle(image)] : [],
    storey: {
      ...base.storey,
      lines: Array.from({ length: count }, (_, i) => ({
        id: `line-${i}`,
        kind: "line" as const,
        layerId,
        color: "#334455",
        penWidth: 0.18,
        style: "solid" as const,
        points: [
          { x: i % 200, y: Math.floor(i / 200) },
          { x: (i % 200) + 0.7, y: Math.floor(i / 200) + 0.4 },
        ],
      })),
      references: image
        ? [
            {
              id: "reference-1",
              kind: "image-reference" as const,
              assetId: image.id,
              layerId,
              origin: { x: 0, y: 0 },
              rotation: 0,
              metresPerPixel: 0.01,
            },
          ]
        : [],
    },
  });
}
export function summary(values: number[]) {
  if (!values.length || values.some((v) => !Number.isFinite(v) || v < 0))
    throw new Error("Invalid measurements");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    median: sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1]!,
  };
}
