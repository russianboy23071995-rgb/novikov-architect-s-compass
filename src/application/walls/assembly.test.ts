import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import {
  assemblyLibrary,
  assemblyUsage,
  flipWallAssembly,
  saveAssemblyLibrary,
  setWallAssembly,
} from "./assembly.ts";
import { createDrawing } from "../drawing/actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  DEFAULT_MATERIALS,
  DEFAULT_WALL_ASSEMBLIES,
  assemblyLibraryProblem,
  assemblyThickness,
  wallLayers,
} from "../../domain/elements/wall/assembly.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";

// docs/WANDAUFBAU.md, SA1.
const wall = (p: ReturnType<typeof createExampleProject>, id = "wall-1") =>
  p.storeys.flatMap((s) => s.walls).find((w) => w.id === id)!;
const KS = "assembly-ks175-wdvs160";

test("the default library is consistent; assemblies sum their layers", () => {
  assert.equal(assemblyLibraryProblem(DEFAULT_MATERIALS, DEFAULT_WALL_ASSEMBLIES), null);
  assert.equal(DEFAULT_WALL_ASSEMBLIES.length, 10);
  const ks = DEFAULT_WALL_ASSEMBLIES.find((a) => a.id === KS)!;
  assert.equal(assemblyThickness(ks), 0.36);
  assert.equal(
    assemblyThickness(DEFAULT_WALL_ASSEMBLIES.find((a) => a.id === "assembly-tb100")!),
    0.1,
  );
});

test("a wall takes the thickness of its build-up; the axis keeps its relative place", () => {
  const base = createExampleProject();
  const before = wall(base);
  const next = setWallAssembly(base, ["wall-1"], "assembly-mw365");
  const after = wall(next);
  assert.equal(after.assemblyId, "assembly-mw365");
  assert.equal(after.thickness, 0.4);
  assert.ok(
    Math.abs(after.bodyOffset / after.thickness - before.bodyOffset / before.thickness) < 1e-9,
  );
  assert.deepEqual(after.start, before.start);
  assert.equal(wall(base).assemblyId, undefined, "input untouched");
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  // Removing keeps the thickness.
  const plain = setWallAssembly(next, ["wall-1"], null);
  assert.equal(wall(plain).assemblyId, undefined);
  assert.equal(wall(plain).thickness, 0.4);
  assert.throws(() => setWallAssembly(base, ["wall-1"], "nope"), /Unbekannter Wandaufbau/);
  assert.throws(() => setWallAssembly(base, ["nope"], KS), /Unbekannte Wand/);
});

test("flipping turns the layer order around; layers read from the right face", () => {
  const base = setWallAssembly(createExampleProject(), ["wall-1"], KS);
  const layers = wallLayers(wall(base), DEFAULT_WALL_ASSEMBLIES)!;
  assert.equal(layers[0]!.materialId, "material-putz");
  assert.equal(layers[1]!.materialId, "material-daemmung");
  const flipped = flipWallAssembly(base, ["wall-1"]);
  assert.equal(wall(flipped).assemblyFlipped, true);
  assert.equal(
    wallLayers(wall(flipped), DEFAULT_WALL_ASSEMBLIES)![1]!.materialId,
    "material-kalksandstein",
  );
  assert.equal(wall(flipWallAssembly(flipped, ["wall-1"])).assemblyFlipped, undefined);
  assert.throws(() => flipWallAssembly(createExampleProject(), ["wall-1"]), /keinen Wandaufbau/);
});

test("editing the library moves every wall of the assembly; used parts cannot be removed", () => {
  const example = createExampleProject();
  const two = createDrawing(example, example, "wall-2", {
    kind: "wall",
    start: { x: 20, y: 0 },
    end: { x: 24, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  const base = setWallAssembly(two, ["wall-1", "wall-2"], KS);
  assert.equal(assemblyUsage(base).get(KS), 2);
  const library = assemblyLibrary(base);
  const thicker = saveAssemblyLibrary(base, {
    ...library,
    wallAssemblies: library.wallAssemblies.map((a) =>
      a.id === KS
        ? { ...a, layers: a.layers.map((l, i) => (i === 1 ? { ...l, thickness: 0.2 } : l)) }
        : a,
    ),
  });
  assert.equal(wall(thicker).thickness, 0.4);
  assert.equal(wall(thicker, "wall-2").thickness, 0.4);
  assert.equal(thicker.wallAssemblies!.length, 10);
  assert.throws(
    () =>
      saveAssemblyLibrary(base, {
        ...library,
        wallAssemblies: library.wallAssemblies.filter((a) => a.id !== KS),
      }),
    /von 2 Wänden verwendet/,
  );
  assert.throws(
    () =>
      saveAssemblyLibrary(base, {
        ...library,
        materials: library.materials.filter((m) => m.id !== "material-putz"),
      }),
    /unbekanntes Material/,
  );
  assert.throws(
    () =>
      saveAssemblyLibrary(base, {
        ...library,
        wallAssemblies: library.wallAssemblies.map((a, i) =>
          i === 1 ? { ...a, name: library.wallAssemblies[0]!.name } : a,
        ),
      }),
    /Name schon vergeben/,
  );
});

test("the file refuses a thickness that does not match, unknown build-ups and v42 smuggling", () => {
  const base = setWallAssembly(createExampleProject(), ["wall-1"], KS);
  const stored = JSON.parse(serializeProject(base));
  const tamper = (change: (w: Record<string, unknown>) => void) => {
    const copy = structuredClone(stored);
    change(
      copy.storeys
        .flatMap((s: { walls: unknown[] }) => s.walls)
        .find((w: { id: string }) => w.id === "wall-1"),
    );
    return copy;
  };
  assert.throws(
    () => validateProject(tamper((w) => (w["thickness"] = 0.3))),
    /passt nicht zum Aufbau/,
  );
  assert.throws(
    () => validateProject(tamper((w) => (w["assemblyId"] = "x"))),
    /unbekannter Wandaufbau/,
  );
  assert.throws(
    () =>
      validateProject(
        tamper((w) => {
          delete w["assemblyId"];
          w["assemblyFlipped"] = true;
        }),
      ),
    /gespiegelt ohne Wandaufbau/,
  );
  const plain = JSON.parse(serializeProject(createExampleProject()));
  const loaded = loadProjectData({ ...plain, schemaVersion: 42 });
  assert.equal(loaded.schemaVersion, 43);
  assert.throws(() => loadProjectData({ ...stored, schemaVersion: 42 }));
});

test("drawn walls carry the build-up of the tool defaults", () => {
  const base = createExampleProject();
  const next = createDrawing(base, base, "wall-new", {
    kind: "wall",
    start: { x: 20, y: 0 },
    end: { x: 24, y: 0 },
    thickness: 0.36,
    height: 2.8,
    assemblyId: KS,
  });
  assert.equal(storeyOf(next).walls.find((w) => w.id === "wall-new")!.assemblyId, KS);
  assert.throws(() =>
    createDrawing(base, base, "wall-bad", {
      kind: "wall",
      start: { x: 20, y: 0 },
      end: { x: 24, y: 0 },
      thickness: 0.3,
      height: 2.8,
      assemblyId: KS,
    }),
  );
});
