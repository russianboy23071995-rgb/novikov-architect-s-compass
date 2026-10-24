import { drawingPrimitiveCandidate } from "./primitive-cold-candidate.ts";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { createPrimitiveSourceIndex } from "../src/constraints/snapping/local-source-index.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { referenceKey } from "../src/constraints/inference/construction-reference.ts";
function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const x = a as Record<string, unknown>,
    y = b as Record<string, unknown>,
    keys = Object.keys(x);
  return (
    keys.length === Object.keys(y).length &&
    keys.every((k) => Object.hasOwn(y, k) && equal(x[k], y[k]))
  );
}
const yieldTask = () => new Promise((r) => setTimeout(r, 0));
const params = new URLSearchParams(location.search);
async function child() {
  const size = Number(params.get("size")),
    kind = params.get("kind") === "line" ? "line" : "hatch",
    candidate = params.get("path") === "candidate";
  const input = hatchPointFixture(size, 100),
    points = [
      { x: -20, y: 0 },
      { x: -17, y: 1 },
      { x: -17, y: 4 },
      { x: -20, y: 4 },
    ];
  if (kind === "hatch")
    storeyOf(input).hatches.push({ ...storeyOf(input).hatches[0]!, id: "target", points });
  else
    storeyOf(input).lines = [
      {
        id: "target",
        kind: "polyline",
        points: [...points, { ...points[0]! }],
        layerId: input.defaultLayerIds.line,
        color: "#334155",
        penWidth: 0.2,
        style: "solid",
      },
    ];
  const state = createEditingState(input),
    base = state.history.present,
    target = { kind, id: "target" } as const;
  const editing = editingReducer(state, {
    type: "begin",
    target,
    action: "stretch",
    index: 1,
    anchor: points[1]!,
  });
  if (!editing.session) throw Error("No edit session");
  const committed = editingReducer(editing, {
    type: "confirm",
    session: editing.session,
    selection: target,
    point: { x: -16.8, y: 1 },
  });
  if (committed.error) throw Error(committed.error);
  const next = committed.history.present,
    invalid = structuredClone(next);
  for (const e of [...storeyOf(invalid).hatches, ...(storeyOf(invalid).lines ?? [])])
    for (const p of e.points) p.x += 0.123;
  const pilot = drawingPrimitiveCandidate(),
    rows = [];
  const phases = [
    ["cold", base],
    ["changed", next],
    ["invalidated", invalid],
  ] as const;
  const results = [];
  for (const [phase, p] of phases) {
    await yieldTask();
    const begin = performance.now();
    const result = candidate
      ? pilot.build(p)
      : (() => {
          const data = projectSnapPrimitives(p);
          return { data, index: createPrimitiveSourceIndex(data) };
        })();
    rows.push({ phase, ms: performance.now() - begin });
    results.push(result);
  }
  let queries = 0;
  for (let i = 0; i < phases.length; i++) {
    const expected = projectSnapPrimitives(phases[i]![1]),
      actual = results[i]!;
    if (!equal(actual.data, expected)) throw Error("Primitive mismatch");
    const baseline = createPrimitiveSourceIndex(expected);
    for (const cursor of [
      { x: -18, y: 1 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: 300, y: 0 },
    ])
      for (const scale of [2, 200])
        for (const filter of [() => true, (r: { entityId: string }) => r.entityId !== "h0"]) {
          if (
            !equal(
              actual.index.query(cursor, scale, 12, filter),
              baseline.query(cursor, scale, 12, filter),
            )
          )
            throw Error("Query mismatch");
          queries++;
        }
    for (const r of expected.references)
      if (!equal(actual.index.lookup(referenceKey(r)), r)) throw Error("Lookup mismatch");
  }
  return { size, kind, path: candidate ? "candidate" : "production", rows, queries, exact: true };
}
type Result = Awaited<ReturnType<typeof child>> & { trial: number };
if (params.has("child")) {
  document.body.style.display = "none";
  child()
    .then((result) => parent.postMessage({ result }, location.origin))
    .catch((e) => parent.postMessage({ error: String(e) }, location.origin));
} else {
  const run = document.querySelector<HTMLButtonElement>("#run")!,
    save = document.querySelector<HTMLButtonElement>("#save")!,
    status = document.querySelector("#status")!,
    report = document.querySelector("#report")!,
    summary = document.querySelector("#summary")!;
  const results: Result[] = [];
  const payload = () => ({
    basis: "main658d390 / PR438 candidate unchanged",
    runtime: navigator.userAgent,
    method:
      "Fresh iframe JS realm per variant/trial, sequential alternating order. Three complete index phases timed; exact data/lookup/queries afterwards. Retains phase indices symmetrically. No forced GC; no trustworthy isolated heap/process/GPU peak available. Browser CPU, not workspace/frame/native acceptance.",
    results,
  });
  run.onclick = async () => {
    run.disabled = true;
    results.length = 0;
    try {
      for (const size of [100, 1000])
        for (const kind of ["line", "hatch"])
          for (let trial = 0; trial < 4; trial++)
            for (const path of trial % 2
              ? ["candidate", "production"]
              : ["production", "candidate"]) {
              status.textContent = `${size} Konturen · ${kind} · ${trial + 1}/4 · ${path}`;
              const result = await new Promise<Awaited<ReturnType<typeof child>>>(
                (resolve, reject) => {
                  const frame = document.createElement("iframe");
                  const timer = setTimeout(() => {
                    cleanup();
                    reject(Error("Timeout"));
                  }, 180000);
                  function cleanup() {
                    clearTimeout(timer);
                    window.removeEventListener("message", receive);
                    frame.remove();
                  }
                  function receive(event: MessageEvent) {
                    if (event.source !== frame.contentWindow || event.origin !== location.origin)
                      return;
                    cleanup();
                    if (event.data.error) reject(Error(event.data.error));
                    else resolve(event.data.result);
                  }
                  window.addEventListener("message", receive);
                  frame.src = `?child=1&size=${size}&kind=${kind}&path=${path}&trial=${trial}`;
                  document.body.append(frame);
                },
              );
              results.push({ ...result, trial });
            }
      const table = document.createElement("table");
      table.innerHTML =
        "<tr><th>Konturen</th><th>Ziel</th><th>Phase</th><th>Produktion Median ms</th><th>Kandidat Median ms</th></tr>";
      for (const size of [100, 1000])
        for (const kind of ["line", "hatch"])
          for (const phase of ["cold", "changed", "invalidated"]) {
            const med = (path: string) => {
              const a = results
                .filter((r) => r.size === size && r.kind === kind && r.path === path)
                .map((r) => r.rows.find((v) => v.phase === phase)!.ms)
                .sort((a, b) => a - b);
              return ((a[1]! + a[2]!) / 2).toFixed(1);
            };
            const row = document.createElement("tr");
            for (const val of [size, kind, phase, med("production"), med("candidate")]) {
              const td = document.createElement("td");
              td.textContent = String(val);
              row.append(td);
            }
            table.append(row);
          }
      summary.replaceChildren(table);
      report.textContent = JSON.stringify(payload(), null, 2);
      status.textContent = `Bestanden: ${results.length} frische Kontexte, ${results.reduce((n, r) => n + r.queries, 0)} exakte Queries.`;
      save.disabled = false;
    } catch (e) {
      status.textContent = `Fehler: ${String(e)}`;
    } finally {
      run.disabled = false;
    }
  };
  save.onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "primitive-browser-results.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
