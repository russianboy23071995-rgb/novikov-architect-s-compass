// @ts-expect-error Diagnostic virtual module resolves to archived TypeScript via Vite.
import { buildBuildingSolid as candidate } from "./archived-wall-resource";
import { buildBuildingSolid as production } from "../src/rendering/viewport/building-solid.ts";
import type { Solid } from "../src/rendering/viewport/storey-solid.ts";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { updateWindow } from "../src/application/windows/actions.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { setStoreyHeight } from "../src/application/storeys/actions.ts";
function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left),
    other = Object.keys(right);
  return (
    keys.length === other.length &&
    keys.every((k) => Object.hasOwn(right, k) && equal(left[k], right[k]))
  );
}
const run = document.querySelector<HTMLButtonElement>("#run")!,
  save = document.querySelector<HTMLButtonElement>("#save")!,
  status = document.querySelector("#status")!,
  report = document.querySelector("#report")!,
  summary = document.querySelector("#summary")!;
type Row = {
  extra: number;
  kind: string;
  trial: number;
  order: string[];
  coldProductionMs: number;
  coldCandidateMs: number;
  productionMs: number;
  candidateMs: number;
};
const runs: { run: number; rows: Row[] }[] = [];
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
};
const payload = () => ({
  basis: "PR419 93579ae; unchanged production main 5d0ca31",
  runtime: navigator.userAgent,
  method:
    "Fresh static build. Exact recursive Object.is geometry equality after timed phases. Cold and changed order alternate, inverted on second run; unique project ID per scene. 84 cold + 84 changed comparisons per run. Actions/snapshots/equality outside measurement; yield per case. Browser CPU only, no workspace interaction/GPU/frame/native/memory guarantee. JIT/GC/lower cache effects remain.",
  runs,
});
run.onclick = async () => {
  run.disabled = true;
  save.disabled = true;
  const number = runs.length + 1,
    rows: Row[] = [];
  try {
    for (const extra of [0, 100, 1000])
      for (const kind of ["free-wall", "free-window", "connected-window", "storey-height"])
        for (let trial = 0; trial < 7; trial++) {
          status.textContent = `Lauf ${number}: ${extra} Restwände · ${kind} · ${trial + 1}/7`;
          const input = structuredClone(boundHeightFixture());
          input.id = `browser-${number}-${extra}-${kind}-${trial}`;
          const eg = input.storeys[0]!;
          for (let i = 0; i <= extra; i++) {
            eg.walls.push({
              ...eg.walls[0]!,
              id: `free-${i}`,
              start: { x: 20 + i * 5, y: 10 },
              end: { x: 23 + i * 5, y: 10 + (trial % 3) },
              baseOffset: trial % 2 ? -0.2 : 0.15,
            });
            eg.windows.push({ ...eg.windows[0]!, id: `free-window-${i}`, wallId: `free-${i}` });
          }
          eg.walls[0]!.thickness += trial * 0.0001;
          eg.walls[1]!.thickness = eg.walls[0]!.thickness;
          const base = createProjectSnapshot(input),
            order =
              (trial + number) % 2 ? ["production", "candidate"] : ["candidate", "production"];
          const times: Record<string, number> = {},
            solids: Record<string, Solid> = {};
          for (const path of order) {
            const start = performance.now();
            solids[path] = (path === "production" ? production : candidate)(base);
            times[path] = performance.now() - start;
          }
          if (!equal(solids["production"], solids["candidate"]))
            throw Error("Cold geometry mismatch");
          let changed;
          if (kind === "free-wall")
            changed = updateWall(base, "free-0", { end: { x: 23.2, y: 10 + (trial % 3) } });
          else if (kind === "free-window")
            changed = updateWindow(base, "free-window-0", { width: 1.4 });
          else if (kind === "connected-window")
            changed = updateWindow(base, "eg-window", { width: 1.4 });
          else
            changed = setStoreyHeight(base, base, {
              projectId: base.id,
              storeyId: "eg",
              height: 3.5,
            });
          const next = createProjectSnapshot(changed),
            changedTimes: Record<string, number> = {};
          for (const path of order) {
            const start = performance.now();
            solids[path] = (path === "production" ? production : candidate)(next);
            changedTimes[path] = performance.now() - start;
          }
          if (!equal(solids["production"], solids["candidate"]))
            throw Error("Changed geometry mismatch");
          rows.push({
            extra,
            kind,
            trial,
            order,
            coldProductionMs: times["production"]!,
            coldCandidateMs: times["candidate"]!,
            productionMs: changedTimes["production"]!,
            candidateMs: changedTimes["candidate"]!,
          });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
    runs.push({ run: number, rows });
    const table = document.createElement("table");
    table.innerHTML =
      "<tr><th>Lauf</th><th>Restwände</th><th>Fall</th><th>Produktion ms</th><th>Kandidat ms</th></tr>";
    for (const current of runs)
      for (const extra of [0, 100, 1000])
        for (const kind of [
          "cold",
          "free-wall",
          "free-window",
          "connected-window",
          "storey-height",
        ]) {
          const group = current.rows.filter(
            (r) => r.extra === extra && (kind === "cold" || r.kind === kind),
          );
          const tr = document.createElement("tr");
          for (const value of [
            current.run,
            extra,
            kind,
            median(
              group.map((r) => (kind === "cold" ? r.coldProductionMs : r.productionMs)),
            ).toFixed(3),
            median(group.map((r) => (kind === "cold" ? r.coldCandidateMs : r.candidateMs))).toFixed(
              3,
            ),
          ]) {
            const td = document.createElement("td");
            td.textContent = String(value);
            tr.append(td);
          }
          table.append(tr);
        }
    summary.replaceChildren(table);
    report.textContent = JSON.stringify(payload(), null, 2);
    status.textContent = `Lauf ${number} bestanden: 84 Kalt- und 84 Änderungsvergleiche exakt gleich.`;
    save.disabled = false;
  } catch (error) {
    status.textContent = `Fehler: ${String(error)}`;
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
  a.download = "wall-resource-browser-results.json";
  a.click();
  URL.revokeObjectURL(url);
};
