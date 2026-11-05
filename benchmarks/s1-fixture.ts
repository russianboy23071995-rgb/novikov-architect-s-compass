import { translationFixture } from "./translation-content-fixture.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { defaultHatchAppearance } from "../src/domain/elements/hatch/model.ts";
import { changeDrawingDocument } from "../src/application/views/documents.ts";
import { createImageAssetHandle, type ImageAsset } from "../src/domain/elements/reference/model.ts";

/** Synthetic supported-element workload, not an architectural design or capacity guarantee. */
export function s1Fixture(images: ImageAsset[] = []) {
  if (images.length !== 0 && images.length !== 20)
    throw new Error("Expected zero or twenty images");
  let p = translationFixture(5);
  p.id = "s1-building";
  p.storeys = p.storeys.map((s, floor) => {
    const wall = s.walls[0]!;
    const walls = Array.from({ length: 60 }, (_, i) => {
      let start = {
        x: 1 + ((i - 13 + 50) % 10) * 3.8,
        y: 10 + Math.floor(Math.max(0, i - 13) / 10) * 2.5,
      };
      let end = { x: start.x + 2.5, y: start.y };
      if (i === 0) {
        start = { x: 1, y: 5 };
        end = { x: 35, y: 5 };
      } else if (i <= 10) {
        start = { x: 1 + i * 3, y: 1 };
        end = { x: start.x, y: 5 };
      } else if (i === 11) {
        start = { x: 1, y: 23 };
        end = { x: 6, y: 23 };
      } else if (i === 12) {
        start = { x: 6, y: 23 };
        end = { x: 6, y: 19 };
      }
      return { ...wall, id: `${s.id}-w${i}`, start, end };
    });
    return {
      ...s,
      name: floor ? `${floor}. Obergeschoss` : "Erdgeschoss",
      walls,
      windows: Array.from({ length: 40 }, (_, i) => ({
        ...s.windows[0]!,
        id: `${s.id}-win${i}`,
        wallId: walls[i]!.id,
      })),
      wallTJunctions: Array.from({ length: 10 }, (_, i) => ({
        hostWallId: walls[0]!.id,
        incoming: { wallId: walls[i + 1]!.id, endpoint: 1 as const },
      })),
      wallJoins: [
        {
          first: { wallId: walls[11]!.id, endpoint: 1 as const },
          second: { wallId: walls[12]!.id, endpoint: 0 as const },
        },
      ],
      lines: Array.from({ length: 100 }, (_, i) => ({
        id: `${s.id}-l${i}`,
        kind: "line" as const,
        layerId: p.defaultLayerIds.line,
        color: "#334455",
        penWidth: 0.18,
        style: "solid" as const,
        points: [
          { x: (i % 20) * 2, y: 24 },
          { x: (i % 20) * 2 + 1, y: 24.5 },
        ],
      })),
      hatches: Array.from({ length: 10 }, (_, i) => ({
        id: `${s.id}-h${i}`,
        kind: "hatch" as const,
        layerId: p.defaultLayerIds.line,
        fill: { color: "#65b9b4", opacity: 0.25 },
        ...defaultHatchAppearance,
        points: Array.from({ length: 8 }, (_, j) => ({
          x: 2 + i * 3.7 + Math.cos((j * Math.PI) / 4),
          y: 8 + Math.sin((j * Math.PI) / 4),
        })),
      })),
      references: images.slice(floor * 4, floor * 4 + 4).map((asset, i) => ({
        id: `${s.id}-r${i}`,
        kind: "image-reference" as const,
        assetId: asset.id,
        layerId: p.defaultLayerIds.line,
        origin: { x: i * 10, y: 0 },
        rotation: 0,
        metresPerPixel: 0.009,
      })),
    };
  });
  p.assets = images.map(createImageAssetHandle);
  p = validateProject(p);
  for (const s of p.storeys) {
    p = { ...p, workingStoreyId: s.id };
    p = changeDrawingDocument(p, p, {
      kind: "create",
      id: `${s.id}-doc`,
      modelViewId: `${s.id}-view`,
      name: s.name,
      denominator: 100,
    });
  }
  return validateProject({ ...p, workingStoreyId: "s0" });
}
