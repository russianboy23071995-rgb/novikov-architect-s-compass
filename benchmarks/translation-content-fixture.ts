import { createProject, validateProject } from "../src/lib/bim/model.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
export function translationFixture(count: number, payloadBytes = 0) {
  const p = createProject("profile", "s0");
  const template = p.storeys[0]!;
  p.storeys = Array.from({ length: count }, (_, i) => ({
    ...template,
    id: `s${i}`,
    name: `Storey ${i}`,
    height: 3,
    walls: [
      {
        id: `w${i}`,
        start: { x: 0, y: 0 },
        end: { x: 4, y: 0 },
        thickness: 0.36,
        bodyOffset: 0.18,
        height: 2.8,
        layerId: p.defaultLayerIds.wall,
      },
    ],
    windows: [
      {
        id: `win${i}`,
        wallId: `w${i}`,
        width: 1.2,
        height: 1.2,
        sillHeight: 0.9,
        position: 0.5,
        layerId: p.defaultLayerIds.window,
      },
    ],
  }));
  if (payloadBytes)
    for (let i = 0; i < 4; i++)
      p.assets.push(
        createImageAssetHandle({
          id: `image${i}`,
          mimeType: "image/png",
          pixelWidth: 1,
          pixelHeight: 1,
          data: "A".repeat(payloadBytes / 4),
        }),
      );
  return validateProject(p);
}
