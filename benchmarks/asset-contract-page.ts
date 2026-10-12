import { capacityFixture, sourceFile } from "./capacity";
import { importImage } from "../src/interop/images/import";
import { validateProject, serializeProject } from "../src/lib/bim/model";
import { splitProject, pack, unpack, restoreProject } from "./asset-contract";
const output = document.querySelector<HTMLPreElement>("#report")!;
const button = document.querySelector<HTMLButtonElement>("#run")!;
button.onclick = async () => {
  button.disabled = true;
  try {
    output.textContent = "Bild-Fixtures importieren …";
    const p = capacityFixture(1000);
    for (let i = 0; i < 3; i++) {
      const asset = await importImage(await sourceFile(i), `asset-${i}`);
      p.assets.push(asset);
      p.storey.references.push({
        id: `ref-${i}`,
        kind: "image-reference",
        layerId: p.defaultLayerIds.line,
        assetId: asset.id,
        origin: { x: i * 60, y: -20 },
        rotation: 0,
        metresPerPixel: 0.1,
      });
    }
    validateProject(p);
    const start = performance.now(),
      doc = await splitProject(p),
      splitMs = performance.now() - start;
    const packStart = performance.now(),
      portable = pack(doc),
      packMs = performance.now() - packStart;
    const loadStart = performance.now(),
      loaded = await unpack(portable),
      unpackMs = performance.now() - loadStart;
    if (JSON.stringify(restoreProject(loaded)) !== JSON.stringify(validateProject(p)))
      throw new Error("Roundtrip mismatch");
    const bytes = (s: string) => new TextEncoder().encode(s).length;
    const snapshots = [1, 10, 50, 100].map((count) => {
      // Serialization work only; these are not product history commits.
      let t = performance.now(),
        oldBytes = 0;
      for (let i = 0; i < count; i++)
        oldBytes += bytes(JSON.stringify({ ...p, name: `State ${i}` }));
      const oldMs = performance.now() - t;
      t = performance.now();
      let modelBytes = 0;
      for (let i = 0; i < count; i++)
        modelBytes += bytes(JSON.stringify({ ...doc.model, name: `State ${i}` }));
      return { count, oldBytes, modelBytes, oldMs, modelMs: performance.now() - t };
    });
    const duplicate = structuredClone(p);
    duplicate.assets.push({ ...p.assets[0]!, id: "duplicate" });
    duplicate.storey.references.push({
      ...p.storey.references[0]!,
      id: "duplicate-ref",
      assetId: "duplicate",
    });
    const dedup = await splitProject(duplicate);
    output.textContent = JSON.stringify(
      {
        userAgent: navigator.userAgent,
        fixture: "K03 capacityFixture(1000) + same three sourceFile PNG/JPEG imports",
        roundtrip: true,
        splitMs,
        packMs,
        unpackMs,
        legacyBytes: bytes(serializeProject(p)),
        packageBytes: bytes(portable),
        manifestBytes: bytes(JSON.stringify(doc.model)),
        payloadChars: Object.values(doc.blobs).reduce((n, p) => n + p.data.length, 0),
        duplicate: {
          logicalAssets: dedup.model.assets.length,
          uniquePayloads: Object.keys(dedup.blobs).length,
          legacyBytes: bytes(serializeProject(duplicate)),
          packageBytes: bytes(pack(dedup)),
        },
        snapshots,
        scope: "Serialization only; no action/commit speedup or physical heap claim",
      },
      null,
      2,
    );
  } catch (error) {
    output.textContent = String(error);
  } finally {
    button.disabled = false;
  }
};
