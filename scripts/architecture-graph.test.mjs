import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { audit, buildGraph, cyclicEdges, forbidden } from "./architecture-graph.mjs";

const none = { boundaries: [], cycles: [] };

test("aliases to the same target cannot erase an earlier runtime dependency", () => {
  fixture(
    {
      "src/domain/a.ts":
        'import {b} from "./b"; import type {B} from "@/domain/b"; export const a=()=>b; export type A=B;',
      "src/domain/b.ts": 'import "./a"; export const b=1; export type B=number;',
    },
    (g) => assert.equal(cyclicEdges(g).length, 2),
  );
});
function fixture(files, run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "novikov-architecture-"));
  try {
    fs.writeFileSync(
      path.join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          module: "ESNext",
          moduleResolution: "Bundler",
          target: "ES2022",
          paths: { "@/*": ["./src/*"] },
        },
      }),
    );
    for (const [name, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
      fs.writeFileSync(path.join(root, name), text);
    }
    run(buildGraph(root));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("allowed layering resolves aliases, extensionless index and explicit ts imports", () => {
  fixture(
    {
      "src/domain/model.ts": "export const value = 1;",
      "src/application/action/index.ts": 'export {value} from "../../domain/model.ts";',
      "src/components/view.tsx":
        'import {value} from "@/application/action"; export const output=value;',
    },
    (g) => {
      assert.deepEqual(audit(g, none), []);
      assert.equal(g.edges.length, 2);
    },
  );
});

test("negative probes reject core -> UI, React, Application -> storage, new legacy dependency", () => {
  for (const [from, to, internal] of [
    ["domain", "src/components/view.ts", true],
    ["geometry", "react", false],
    ["application", "src/interop/storage.ts", true],
    ["application", "src/lib/bim/model.ts", true],
    ["interop", "src/application/action.ts", true],
  ])
    assert.equal(forbidden({ from: `src/${from}/bad.ts`, to, internal, runtime: true }), true);
  fixture(
    {
      "src/domain/bad.ts": 'export {view} from "@/components/view";',
      "src/components/view.ts": "export const view = 1;",
    },
    (g) => assert.match(audit(g, none).join(), /New boundaries: src\/domain\/bad.ts/),
  );
});

test("type imports obey layer rules but do not create runtime cycles", () => {
  fixture(
    {
      "src/domain/a.ts": 'import type {B} from "./b"; export type A={b:B};',
      "src/domain/b.ts": 'import {type A} from "./a"; export type B={a:A};',
      "src/interop/port.ts":
        'import type {Port} from "@/application/port"; export type Adapter=Port;',
      "src/application/port.ts": "export type Port={id:string};",
    },
    (g) => {
      assert.deepEqual(cyclicEdges(g), []);
      assert.deepEqual(audit(g, none), []);
    },
  );
  fixture(
    {
      "src/domain/bad.ts": 'export type {View} from "../components/view";',
      "src/components/view.ts": "export type View={id:string};",
    },
    (g) => assert.equal(g.edges.filter(forbidden).length, 1),
  );
});

test("mixed and side-effect imports retain actual runtime cycles", () => {
  fixture(
    {
      "src/domain/a.ts": 'import {type B,b} from "./b"; export const a=()=>b; export type A=B;',
      "src/domain/b.ts": 'import "./a"; export const b=1; export type B=number;',
    },
    (g) => {
      assert.equal(cyclicEdges(g).length, 2);
      assert.equal(audit(g, none).length, 2);
    },
  );
});

test("literal dynamic imports, require and re-exports participate; computed imports fail closed", () => {
  fixture(
    {
      "src/domain/a.ts": 'export const a=()=>import("./b");',
      "src/domain/b.ts": 'export {a} from "./a"; export const c=require("./c");',
      "src/domain/c.ts": 'export const c=1; import("./" + c);',
    },
    (g) => {
      assert.equal(cyclicEdges(g).length, 2);
      assert.match(g.issues.join(), /non-literal/);
    },
  );
});

test("unresolved local aliases and imports into excluded tests fail closed", () => {
  fixture(
    {
      "src/domain/a.ts": 'import "@/missing"; import "./hidden.test";',
      "src/domain/hidden.test.ts": "export const test=1;",
    },
    (g) => {
      assert.equal(g.issues.length, 2);
      assert.match(g.issues.join(), /excluded source/);
    },
  );
});

test("exceptions require metadata, exact edges, stale removal and no cycle widening", () => {
  const edges = [
    { from: "src/domain/a.ts", to: "src/domain/b.ts", internal: true, runtime: true },
    { from: "src/domain/b.ts", to: "src/domain/a.ts", internal: true, runtime: true },
  ];
  const g = { files: ["src/domain/a.ts", "src/domain/b.ts"], edges, issues: [] };
  const allowed = {
    boundaries: [],
    cycles: [
      {
        owner: "Application/direct-edit",
        reason: "Existing debt",
        removal: "Next bounded PR",
        edges: cyclicEdges(g),
      },
    ],
  };
  assert.deepEqual(audit(g, allowed), []);
  assert.match(audit({ ...g, edges: [] }, allowed).join(), /stale/);
  assert.match(
    audit({ ...g, edges: [...edges, { ...edges[0], to: edges[0].from }] }, allowed).join(),
    /New cycles/,
  );
  assert.match(audit(g, { cycles: [{ edges: cyclicEdges(g) }] }).join(), /metadata/);
});

test("broken UTF-8 in production texts fails closed; tests and correct umlauts pass", () => {
  // Built from code points so this file itself stays plain ASCII.
  const broken = "Projekt wurde ge" + String.fromCharCode(0xc3, 0xa4) + "ndert";
  const ellipsis =
    "Bild wird gepr" + String.fromCharCode(0xfc) + "ft" + String.fromCharCode(0xe2, 0x20ac, 0xa6);
  const correct =
    "Projekt wurde ge" + String.fromCharCode(0xe4) + "ndert " + String.fromCharCode(0x2026);
  fixture(
    {
      "src/domain/a.ts": `export const a = ${JSON.stringify(broken)};`,
      "src/components/b.tsx": `export const b = ${JSON.stringify(ellipsis)};`,
      "src/domain/c.ts": `export const c = ${JSON.stringify(correct)};`,
      "src/domain/a.test.ts": `export const probe = ${JSON.stringify(broken)};`,
    },
    (g) =>
      assert.deepEqual(
        audit(g, none).filter((p) => p.includes("mojibake")),
        [
          "src/components/b.tsx:1: broken UTF-8 text (mojibake)",
          "src/domain/a.ts:1: broken UTF-8 text (mojibake)",
        ],
      ),
  );
});
