import type { Project } from "../../domain/project/schema.ts";
import { storeyAbove } from "../../domain/storeys/access.ts";
import { storeyCeilingSources } from "../../domain/elements/room/heights.ts";
import {
  AREA_USE_LABELS,
  roomLivingResult,
  storeyAreaBlockers,
  WOFLV_RULES,
  type RoomLivingResult,
} from "./woflv.ts";

export type LivingRoomRow = {
  roomId: string;
  number: string;
  name: string;
  useLabel: string;
  result: RoomLivingResult;
};
export type LivingStorey = {
  storeyId: string;
  name: string;
  rooms: LivingRoomRow[];
  grossArea: number;
  livingArea: number;
};
export type LivingSchedule = {
  rules: { name: string; version: number };
  storeys: LivingStorey[];
  grossArea: number;
  livingArea: number;
};

/**
 * Living area of the whole project (docs/WOHNFLAECHE.md, W4): every room with its calculation, sums
 * per storey and project. Each room reads only its own storey (A08). The list, the CSV file and
 * the report all show this one result; none of them calculates again.
 */
export function livingSchedule(project: Project): LivingSchedule {
  const storeys = project.storeys
    .filter((storey) => storey.rooms?.length)
    .map((storey): LivingStorey => {
      const sources = storeyCeilingSources(storey, storeyAbove(project, storey.id));
      const blockers = storeyAreaBlockers(storey);
      const rooms = [...(storey.rooms ?? [])]
        .sort((a, b) => a.number.localeCompare(b.number, "de", { numeric: true }))
        .map((room): LivingRoomRow => {
          const result = roomLivingResult(room, sources, blockers);
          return {
            roomId: room.id,
            number: room.number,
            name: room.name,
            useLabel: AREA_USE_LABELS[result.use],
            result,
          };
        });
      return {
        storeyId: storey.id,
        name: storey.name,
        rooms,
        grossArea: rooms.reduce((sum, r) => sum + r.result.grossArea, 0),
        livingArea: rooms.reduce((sum, r) => sum + r.result.livingArea, 0),
      };
    });
  return {
    rules: WOFLV_RULES,
    storeys,
    grossArea: storeys.reduce((sum, s) => sum + s.grossArea, 0),
    livingArea: storeys.reduce((sum, s) => sum + s.livingArea, 0),
  };
}

const decimal = (value: number) =>
  value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });

/** CSV for Excel like the room list: one row per step, a sum row per room, storey and project. */
export function livingScheduleCsv(schedule: LivingSchedule): string {
  const cell = (value: string) =>
    /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const rows: string[][] = [
    [
      "Geschoss",
      "Nr.",
      "Name",
      "Raumart",
      "Teilfläche",
      "Regel",
      "Fläche m²",
      "Anteil %",
      "Wohnfläche m²",
    ],
  ];
  for (const storey of schedule.storeys) {
    for (const room of storey.rooms) {
      const head = [storey.name, room.number, room.name, room.useLabel];
      for (const step of room.result.steps)
        rows.push([
          ...head,
          step.label,
          step.rule,
          decimal(step.area),
          decimal(step.share * 100),
          decimal(step.area * step.share),
        ]);
      rows.push([
        ...head,
        "Summe Raum",
        "",
        decimal(room.result.grossArea),
        "",
        decimal(room.result.livingArea),
      ]);
    }
    rows.push([
      `Summe ${storey.name}`,
      "",
      "",
      "",
      "",
      "",
      decimal(storey.grossArea),
      "",
      decimal(storey.livingArea),
    ]);
  }
  rows.push([
    "Summe Projekt",
    "",
    "",
    "",
    "",
    "",
    decimal(schedule.grossArea),
    "",
    decimal(schedule.livingArea),
  ]);
  rows.push([`Regelstand: ${schedule.rules.name}, Version ${schedule.rules.version}`]);
  return "\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
}
