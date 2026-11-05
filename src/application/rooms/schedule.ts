import type { Project } from "../../domain/project/schema.ts";
import { roomArea } from "../../domain/elements/room/model.ts";
import {
  roomClearHeights,
  roomHeightLineResults,
  storeyCeilingSources,
} from "../../domain/elements/room/heights.ts";
import type { HeightLine } from "../../domain/elements/room/height-line.ts";
import { heightLineText } from "./height-lines.ts";

/** One height line column: the same height with the same references in every room. */
export type ScheduleLineColumn = { key: string; label: string };
export type ScheduleRoom = {
  storeyId: string;
  roomId: string;
  number: string;
  name: string;
  area: number;
  floorBuildUp: number | undefined;
  clearMin: number | null;
  clearMax: number | null;
  openArea: number;
  /** Area reaching each height line of the room and its share, by column key. */
  lines: Record<string, { area: number; share: number }>;
};
export type ScheduleStorey = {
  storeyId: string;
  name: string;
  rooms: ScheduleRoom[];
  area: number;
  openArea: number;
  lines: Record<string, number>;
};
export type RoomSchedule = {
  columns: ScheduleLineColumn[];
  storeys: ScheduleStorey[];
  area: number;
  openArea: number;
  lines: Record<string, number>;
};

const lineKey = (line: Pick<HeightLine, "height" | "lower" | "upper">) =>
  `${line.height}|${line.lower}|${line.upper}`;

/**
 * Room list as a query of the whole project (docs/ROOM_ELEMENT.md, R4): per storey every room
 * with number, name, plan area, floor build-up, clear height range, area and share per height
 * line and the part without height source; sums per storey and project. Each room reads only
 * its own storey (A08). No WoFlV rules (N35). Shared by the room list window, the CSV file and
 * future text/AI queries.
 */
export function roomSchedule(project: Project): RoomSchedule {
  const columns = new Map<string, ScheduleLineColumn & { height: number }>();
  const storeys = project.storeys
    .filter((storey) => storey.rooms?.length)
    .map((storey): ScheduleStorey => {
      const sources = storeyCeilingSources(storey);
      const rooms = [...(storey.rooms ?? [])]
        .sort((a, b) => a.number.localeCompare(b.number, "de", { numeric: true }))
        .map((room): ScheduleRoom => {
          const clear = roomClearHeights(room, sources);
          const lines: ScheduleRoom["lines"] = {};
          for (const result of roomHeightLineResults(room, sources)) {
            const key = lineKey(result.line);
            if (!columns.has(key))
              columns.set(key, {
                key,
                label: `ab ${heightLineText(result.line)}`,
                height: result.line.height,
              });
            lines[key] = { area: result.areaAbove, share: result.share };
          }
          return {
            storeyId: storey.id,
            roomId: room.id,
            number: room.number,
            name: room.name,
            area: roomArea(room),
            floorBuildUp: room.floorBuildUp,
            clearMin: clear.min,
            clearMax: clear.max,
            openArea: clear.openArea,
            lines,
          };
        });
      const lines: Record<string, number> = {};
      for (const room of rooms)
        for (const [key, value] of Object.entries(room.lines))
          lines[key] = (lines[key] ?? 0) + value.area;
      return {
        storeyId: storey.id,
        name: storey.name,
        rooms,
        area: rooms.reduce((sum, r) => sum + r.area, 0),
        openArea: rooms.reduce((sum, r) => sum + r.openArea, 0),
        lines,
      };
    });
  const lines: Record<string, number> = {};
  for (const storey of storeys)
    for (const [key, value] of Object.entries(storey.lines)) lines[key] = (lines[key] ?? 0) + value;
  return {
    columns: [...columns.values()]
      .sort((a, b) => a.height - b.height || a.label.localeCompare(b.label, "de"))
      .map(({ key, label }) => ({ key, label })),
    storeys,
    area: storeys.reduce((sum, s) => sum + s.area, 0),
    openArea: storeys.reduce((sum, s) => sum + s.openArea, 0),
    lines,
  };
}

const decimal = (value: number, digits = 2) =>
  value.toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  });

/** CSV for Excel (decision O): semicolons, decimal comma, UTF-8 with byte order mark, one row
 * per room plus a sum row per storey and for the project. */
export function roomScheduleCsv(schedule: RoomSchedule): string {
  const cell = (value: string) =>
    /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const header = [
    "Geschoss",
    "Nr.",
    "Name",
    "Grundfläche m²",
    "Fußbodenaufbau m",
    "lichte Höhe von m",
    "lichte Höhe bis m",
    ...schedule.columns.flatMap((c) => [`${c.label} m²`, `${c.label} %`]),
    "Höhe offen m²",
  ];
  const rows: string[][] = [header];
  for (const storey of schedule.storeys) {
    for (const room of storey.rooms)
      rows.push([
        storey.name,
        room.number,
        room.name,
        decimal(room.area),
        room.floorBuildUp === undefined ? "" : decimal(room.floorBuildUp),
        room.clearMin === null ? "" : decimal(room.clearMin),
        room.clearMax === null ? "" : decimal(room.clearMax),
        ...schedule.columns.flatMap((c) => {
          const line = room.lines[c.key];
          return line ? [decimal(line.area), decimal(line.share * 100, 1)] : ["", ""];
        }),
        decimal(room.openArea),
      ]);
    rows.push(sumRow(`Summe ${storey.name}`, storey, schedule));
  }
  rows.push(sumRow("Summe Projekt", schedule, schedule));
  return "﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
}

function sumRow(
  label: string,
  sums: { area: number; openArea: number; lines: Record<string, number> },
  schedule: RoomSchedule,
): string[] {
  return [
    label,
    "",
    "",
    decimal(sums.area),
    "",
    "",
    "",
    ...schedule.columns.flatMap((c) =>
      sums.lines[c.key] === undefined ? ["", ""] : [decimal(sums.lines[c.key]!), ""],
    ),
    decimal(sums.openArea),
  ];
}
