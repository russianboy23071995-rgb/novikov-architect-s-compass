import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { setWallAssembly } from "../walls/assembly.ts";
import type { Project } from "../../domain/project/schema.ts";
import { quantityCsv, quantitySchedule, quantityText, type QuantityTable } from "./schedule.ts";

// docs/MENGEN.md, ML1. Values recalculated by hand.
const near = (actual: unknown, expected: number) =>
  assert.ok(
    typeof actual === "number" && Math.abs(actual - expected) < 1e-9,
    `${String(actual)} ≠ ${expected}`,
  );
const cells = (t: QuantityTable, i = 0) => t.groups[0]!.rows[i]!.cells;

/** Example project (wall-1: 3 × 2,8 m, 36 cm, window 1,2 × 1,35 at 0,9) plus a second wall
 * with a window, a door, two columns, a slab. */
function project(): Project {
  const example = createExampleProject();
  const storey = example.storeys[0]!;
  const layerId = storey.walls[0]!.layerId;
  return {
    ...example,
    storeys: [
      {
        ...storey,
        walls: [
          ...storey.walls,
          {
            ...storey.walls[0]!,
            id: "wall-2",
            start: { x: 0, y: 5 },
            end: { x: 4, y: 5 },
            height: 2.5,
            thickness: 0.24,
          },
        ],
        windows: [
          ...storey.windows,
          {
            id: "window-2",
            wallId: "wall-2",
            layerId,
            width: 1,
            height: 1,
            sillHeight: 1,
            position: 0.5,
            mark: "F2",
          },
        ],
        doors: [
          {
            id: "door-1",
            wallId: "wall-2",
            layerId,
            width: 1.01,
            height: 2.135,
            position: 0.2,
            zOffset: 0,
            hinge: "start",
            opensTo: "left",
            mark: "T1",
          },
        ],
        columns: [
          {
            id: "c-1",
            layerId,
            position: { x: 1, y: 1 },
            shape: { kind: "rectangle", width: 0.3, depth: 0.4 },
            rotation: 30,
            baseOffset: 0,
            height: 2.5,
          },
          {
            id: "c-2",
            layerId,
            position: { x: 2, y: 1 },
            shape: { kind: "circle", diameter: 0.3 },
            rotation: 0,
            baseOffset: 0,
            height: 2,
          },
        ],
        slabs: [
          {
            id: "s-1",
            layerId,
            points: [
              { x: 0, y: 0 },
              { x: 4, y: 0 },
              { x: 4, y: 5 },
              { x: 0, y: 5 },
            ],
            thickness: 0.2,
            topOffset: 0,
          },
        ],
      },
    ],
  };
}

test("walls: axis length × height minus the openings", () => {
  const { walls } = quantitySchedule(project());
  const one = cells(walls, 0);
  near(one["length"], 3);
  near(one["gross"], 8.4);
  near(one["openings"], 1.62);
  near(one["net"], 6.78);
  near(one["volume"], 6.78 * 0.36);
  assert.equal(one["renovation"], "Bestand");
  // wall-2: 4 × 2,5 = 10; window 1 × 1; door 1,01 × 2,135.
  const two = cells(walls, 1);
  near(two["openings"], 1 + 1.01 * 2.135);
  near(two["net"], 10 - 1 - 1.01 * 2.135);
  near(walls.groups[0]!.sums["length"]!, 7);
  near(walls.sums["gross"]!, 18.4);
});

test("windows, doors, columns and slabs: one row each, counted and summed", () => {
  const s = quantitySchedule(project());
  assert.equal(s.windows.groups[0]!.rows.length, 2);
  assert.equal(cells(s.windows, 1)["mark"], "F2");
  assert.equal(cells(s.windows, 1)["wall"], "24 cm");
  near(s.windows.sums["area"]!, 1.62 + 1);
  near(s.windows.sums["count"]!, 2);
  assert.equal(cells(s.doors)["mark"], "T1");
  near(cells(s.doors)["area"], 1.01 * 2.135);
  assert.equal(cells(s.columns, 0)["section"], "30 × 40 cm");
  near(cells(s.columns, 0)["volume"], 0.3 * 0.4 * 2.5);
  assert.equal(cells(s.columns, 1)["section"], "Ø 30 cm");
  near(cells(s.columns, 1)["volume"], Math.PI * 0.0225 * 2);
  near(cells(s.slabs)["area"], 20);
  near(cells(s.slabs)["volume"], 4);
  // No roofs or stairs: the list is empty, not a storey with zero rows.
  assert.equal(s.roofs.groups.length, 0);
  assert.equal(s.stairs.groups.length, 0);
});

test("materials: every layer over the net wall area, equal materials added up", () => {
  const built = setWallAssembly(project(), ["wall-1"], "assembly-ks175-wdvs160");
  const s = quantitySchedule(built);
  assert.equal(cells(s.walls, 0)["assembly"], "KS 17,5 + WDVS 16");
  const rows = s.materials.groups[0]!.rows.map((r) => r.cells);
  assert.deepEqual(
    rows.map((r) => r["material"]),
    ["Putz", "Kalksandstein", "Wärmedämmung"],
  );
  const net = 6.78;
  near(rows[0]!["area"], 2 * net);
  near(rows[0]!["volume"], net * (0.01 + 0.015));
  near(rows[2]!["volume"], net * 0.16);
  // Without any build-up there is no material list.
  assert.equal(quantitySchedule(project()).materials.groups.length, 0);
});

test("CSV for Excel: note, header with units, decimal comma, storey and project sums", () => {
  const csv = quantityCsv(quantitySchedule(project()).walls);
  // The note contains a semicolon, so it is quoted.
  assert.ok(csv.startsWith('﻿"Wände: Über die Wandachse'));
  const lines = csv.trimEnd().split("\r\n");
  assert.equal(
    lines[1],
    "Geschoss;Aufbau;Bauzustand;Stärke m;Länge m;Höhe m;Fläche brutto m²;Öffnungen m²;Fläche netto m²;Volumen m³",
  );
  assert.match(lines[2]!, /;Bestand;0,360;3,00;2,80;8,40;1,62;6,78;2,441$/);
  assert.match(lines[4]!, /^Summe .*;;;;7,00;;18,40;/);
  assert.match(lines[5]!, /^Summe Projekt;/);
  assert.equal(quantityText({ key: "x", label: "x", digits: 1 }, null), "");
});
