import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

// docs/WERKZEUGLEISTE.md, WL3: every pictogram the rail, the constructions and the navigator name
// exists in both states, as plain SVG without scripts, with the masks the active state needs.
const read = (path: string) => readFileSync(path, "utf8");
const named = (path: string, pattern: RegExp) =>
  [...read(path).matchAll(pattern)].map((m) => m[1]!);

test("pictograms: every one in use exists inactive and active, without scripts", () => {
  const tools = named("src/components/cad/rail-tools.ts", /pictogram(?:Icon\()?: ?"([a-z-]+)"/g);
  const constructions = named(
    "src/components/cad/ConstructionPicker.tsx",
    /: "([a-z-]+)",\n/g,
  ).filter((n) => ["polygon", "rechteck", "kreis"].includes(n));
  const navigator = named("src/components/cad/ProjectNavigator.tsx", /pictogram: "([a-z-]+)"/g);
  assert.ok(tools.length >= 20, "rail pictograms");
  assert.deepEqual([...new Set(constructions)].sort(), ["kreis", "polygon", "rechteck"]);
  assert.deepEqual([...new Set(navigator)].sort(), [
    "ansicht",
    "gesamtuebersicht",
    "grundriss",
    "schnitt",
  ]);
  const uses = [
    ...[...tools, ...constructions].map((n) => ["werkzeuge", n] as const),
    ...navigator.map((n) => ["navigator", n] as const),
  ];
  for (const [group, name] of uses)
    for (const state of ["inaktiv", "aktiv"]) {
      const file = `src/assets/piktogramme/${state}/${group}/${name}.svg`;
      assert.ok(existsSync(file), file);
      const svg = read(file);
      assert.match(svg, /^<svg [^>]*viewBox="0 0 24 24" width="24" height="24"/, file);
      assert.doesNotMatch(svg, /<script|on[a-z]+=|javascript:|href="http/i, file);
      // An active mask is referenced by its own id (made unique per instance in Pictogram.tsx).
      for (const [, id] of svg.matchAll(/url\(#([^)]+)\)/g))
        assert.ok(svg.includes(`id="${id}"`), `${file}: ${id}`);
    }
});
