import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { fullHeightFixture } from "./bound-height-fixture";
import { connectionGroupFixture } from "./connection-group-fixture";
import "../src/styles.css";
// Separate disposable origin: never replace the user's workspace/recovery on 8080.
if (location.port !== "8087") throw new Error("Höhenabnahme nur isoliert auf Port 8087 öffnen.");
createRoot(document.getElementById("root")!).render(
  <CadWorkspace
    initialProject={
      new URLSearchParams(location.search).has("connectionGroup")
        ? connectionGroupFixture(50, 100)
        : fullHeightFixture()
    }
  />,
);
