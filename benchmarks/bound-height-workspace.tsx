import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { fullHeightFixture } from "./bound-height-fixture";
import { connectionGroupFixture } from "./connection-group-fixture";
import { tPairFixture } from "./t-pair-fixture";
import { storeyOf } from "../src/domain/storeys/access";
import { validateProject } from "../src/lib/bim/model";
import "../src/styles.css";
// Separate disposable origin: never replace the user's workspace/recovery on 8080.
if (location.port !== "8087") throw new Error("Höhenabnahme nur isoliert auf Port 8087 öffnen.");
const params = new URLSearchParams(location.search);
function tTargetFixture() {
  const project = tPairFixture();
  const level = storeyOf(project);
  level.wallTJunctions = [];
  for (const x of [8, 10])
    level.walls.push({
      ...level.walls[0]!,
      id: `host-${x}`,
      start: { x, y: -3 },
      end: { x, y: 3 },
    });
  return validateProject(project);
}
createRoot(document.getElementById("root")!).render(
  <CadWorkspace
    initialProject={
      params.has("tTarget")
        ? tTargetFixture()
        : params.has("connectionGroup")
          ? connectionGroupFixture(50, 100)
          : fullHeightFixture()
    }
  />,
);
