import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/styles.css";
import { BimInspector } from "../src/components/cad/BimInspector";
import { propertyFormKey } from "../src/components/cad/property-form-key";
import { createProject } from "../src/application/projects/create.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { addWall } from "../src/application/walls/actions.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../src/application/history/project-history";
import { addStorey, setStoreyHeight } from "../src/application/storeys/actions";
let initial = createProject("height-ui", "eg");
initial = setStoreyHeight(initial, initial, { projectId: initial.id, storeyId: "eg", height: 3 });
if (!new URLSearchParams(location.search).has("noUpper"))
  initial = addStorey(initial, initial, {
    projectId: initial.id,
    storeyId: "eg",
    side: "above",
    id: "og",
    height: 3,
  });
initial = addWall(initial, {
  id: "wall",
  start: { x: 0, y: 0 },
  end: { x: 3, y: 0 },
  thickness: 0.36,
  height: 2.8,
});
initial = addWindow(initial, {
  id: "window",
  wallId: "wall",
  width: 1.2,
  height: 1.2,
  sillHeight: 0.9,
  position: 0.5,
});
export function TestPage() {
  const [history, setHistory] = useState(() => createHistory(initial));
  const project = history.present;
  const selection = { kind: "wall", id: "wall" } as const;
  return (
    <main className="p-4">
      <h1>Wandhöhen – isolierte UI-Abnahme</h1>
      <p>Testdaten ohne Speicherung. Echtes BimInspector und Modellaktionen.</p>
      <button onClick={() => setHistory(undoProject(history))}>Undo</button>{" "}
      <button onClick={() => setHistory(redoProject(history))}>Redo</button>{" "}
      <button
        onClick={() =>
          setHistory(
            commitProject(
              history,
              setStoreyHeight(project, project, {
                projectId: project.id,
                storeyId: "eg",
                height: 4,
              }),
            ),
          )
        }
      >
        Geschosshöhe 4 m
      </button>
      <section className="glass-panel p-3 mt-4">
        <BimInspector
          key={propertyFormKey(project, selection)}
          project={project}
          selection={selection}
          onChange={(next) => setHistory(commitProject(history, next))}
          onWallOffset={() => {}}
        />
      </section>
      <output aria-label="Modellstatus">
        Höhe {project.storeys[0]!.walls[0]!.height.toFixed(3)} m · Undo {history.past.length}
      </output>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<TestPage />);
