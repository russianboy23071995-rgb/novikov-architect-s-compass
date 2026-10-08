import { capacityFixture, sourceFile } from "./capacity";
import { importImage, checkedImageUrl } from "../src/interop/images/import";
import { commitCreateReference } from "../src/application/references/actions";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../src/lib/bim/history";
import {
  addWall,
  updateLine,
  updateWall,
  serializeProject,
  validateProject,
} from "../src/lib/bim/model";
const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector<HTMLPreElement>("#report")!;
button.onclick = async () => {
  button.disabled = true;
  try {
    output.textContent = "PNG/JPEG importieren …";
    let h = createHistory(
      addWall(capacityFixture(1000), {
        id: "isolated-wall",
        start: { x: 300, y: 0 },
        end: { x: 303, y: 0 },
        thickness: 0.36,
        height: 2.8,
      }),
    );
    for (let i = 0; i < 3; i++) {
      const asset = await importImage(await sourceFile(i), `asset-${i}`);
      if (!Object.isFrozen(asset)) throw Error("Import not immutable");
      h = commitCreateReference(h, h.present, {
        projectId: h.present.id,
        asset,
        reference: {
          id: `ref-${i}`,
          kind: "image-reference",
          assetId: asset.id,
          layerId: h.present.defaultLayerIds.line,
          origin: { x: i * 60, y: -20 },
          rotation: 0,
          metresPerPixel: 0.1,
        },
      });
      if (h.present.assets[i] !== asset) throw Error("Import identity lost");
    }
    const before = h.present,
      handle = before.assets[0];
    h = commitProject(h, updateLine(h.present, "line-0", { color: "#abcdef" }));
    h = commitProject(h, updateWall(h.present, "isolated-wall", { height: 3 }));
    const expected = JSON.stringify(h.present);
    if (JSON.stringify(undoProject(undoProject(h)).present) !== JSON.stringify(before))
      throw Error("Undo mismatch");
    if (JSON.stringify(redoProject(redoProject(undoProject(undoProject(h)))).present) !== expected)
      throw Error("Redo mismatch");
    const text = serializeProject(h.present),
      loaded = readProjectFile(text);
    if (
      JSON.stringify(loaded) !== expected ||
      loaded.assets[0] === handle ||
      !Object.isFrozen(loaded.assets[0])
    )
      throw Error("Load mismatch");
    if (validateProject(loaded).assets[0] !== loaded.assets[0]) throw Error("Loaded handle lost");
    const corrupt = JSON.parse(text);
    corrupt.assets[0].data = "!!!!";
    let rejected = false;
    try {
      readProjectFile(JSON.stringify(corrupt));
    } catch {
      rejected = true;
    }
    if (!rejected) throw Error("Corrupt file accepted");
    const image = document.querySelector<HTMLImageElement>("#image")!;
    image.src = checkedImageUrl(loaded.assets[0]!)!;
    await image.decode();
    output.textContent = JSON.stringify(
      {
        importedImages: 3,
        lineAndWallEdits: true,
        undoRedo: true,
        roundtrip: true,
        newLoadedIdentity: true,
        sharedAcrossEdits: h.present.assets[0] === handle,
        corruptStorageRejected: true,
        rendered: [image.naturalWidth, image.naturalHeight],
        schemaVersion: loaded.schemaVersion,
        fileBytes: new TextEncoder().encode(text).length,
      },
      null,
      2,
    );
  } catch (e) {
    output.textContent = String(e);
  } finally {
    button.disabled = false;
  }
};
