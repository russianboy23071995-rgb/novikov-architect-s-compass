import { storeyOf } from "../src/domain/storeys/access.ts";
import { recoveryFixture } from "./recovery-capacity-fixture";
import { createImageAssetHandle } from "../src/domain/elements/reference/model";
import { serializeProject } from "../src/lib/bim/model";
if (!import.meta.env.DEV || location.port !== "8084") throw new Error("Diagnostic only");
const pause = () => new Promise<void>((r) => setTimeout(r, 0));
document.body.innerHTML =
  '<button id="generate">100-MiB-Fixture erzeugen</button><p id="status">Bereit</p>';
document.getElementById("generate")!.onclick = async () => {
  document.getElementById("status")!.textContent = "Erzeuge synthetische Fixture";
  const p = recoveryFixture("capacity-100", 10000);
  for (let i = 1; i <= 12; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1280;
    const ctx = canvas.getContext("2d")!,
      image = ctx.createImageData(1280, 1280);
    let seed = i;
    for (let j = 0; j < image.data.length; j++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      image.data[j] = seed >>> 24;
    }
    ctx.putImageData(image, 0, 0);
    p.assets.push(
      createImageAssetHandle({
        id: `a${i}`,
        mimeType: "image/png",
        pixelWidth: 1280,
        pixelHeight: 1280,
        data: canvas.toDataURL("image/png").split(",")[1]!,
      }),
    );
    storeyOf(p).references.push({
      id: `r${i}`,
      kind: "image-reference",
      assetId: `a${i}`,
      layerId: p.defaultLayerIds.line,
      origin: { x: i * 10, y: 0 },
      rotation: 0,
      metresPerPixel: 0.01,
    });
    canvas.width = canvas.height = 0;
    await pause();
  }

  const blob = new Blob([serializeProject(p)], { type: "application/json" });
  const link = document.createElement("a");
  link.textContent = "Fixture herunterladen";
  link.href = URL.createObjectURL(blob);
  link.download = "capacity-100.json";
  document.body.append(link);
  document.getElementById("status")!.textContent = `Bereit: ${blob.size} Bytes`;
};
