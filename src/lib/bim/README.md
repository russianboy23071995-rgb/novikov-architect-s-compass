# Parametric BIM core

`model.ts` is independent of React and the CAD UI. It uses the existing Zod dependency for runtime validation. A version-1 project contains exactly one storey, straight walls in the XY plane, and hosted rectangular windows. All lengths are metres.

Call `createProject(projectId, storeyId)`, then `addWall`, `addWindow`, `updateWall` and `updateWindow`. Supply stable, project-wide unique IDs on creation; updates preserve them. Commands return independent validated snapshots and throw on invalid input without mutating the previous snapshot. Retain the returned project after each command.

Window `position` is the dimensionless centre along the wall, from 0 (start) to 1 (end). A value of 0.5 remains centred when either endpoint changes. `windowCentre` derives its XY coordinates. The full opening must fit horizontally and vertically inside the wall, including its nonnegative sill height. Wall edits revalidate all hosted windows.

```ts
import {
  createProject,
  addWall,
  addWindow,
  updateWall,
  serializeProject,
  deserializeProject,
} from "./model";

let project = createProject("project-1", "storey-1");
project = addWall(project, {
  id: "wall-1",
  start: { x: 0, y: 0 },
  end: { x: 3, y: 0 },
  thickness: 0.36,
  height: 2.8,
});
project = addWindow(project, {
  id: "window-1",
  wallId: "wall-1",
  width: 1.2,
  height: 1.35,
  sillHeight: 0.9,
  position: 0.5,
});
project = updateWall(project, "wall-1", { end: { x: 6, y: 0 } });
const restored = deserializeProject(serializeProject(project));
```

JSON includes `schemaVersion: 1` and `unit: "m"`. Loading validates structure, IDs, references and geometry; unsupported versions/units are rejected. Serialization does not write files or introduce UI persistence. Window overlap checks, multiple storeys, rendering and IFC export are outside this first step.

Run `npm test` with Node >=22.6 (native TypeScript stripping); no additional test dependency is needed. `npm run build` builds the existing application.

The agreed NOVIKOV CAD roadmap is: component model (this step), connection to the existing UI, real 3D geometry with openings, IFC exchange, then AI and voice commands. The reference case is a 3.00 m long, 0.36 m thick, 2.80 m high wall with a centred 1.20 m wide, 1.35 m high window and a 0.90 m sill. The next small step is to connect this model to the wall tool and existing view.
