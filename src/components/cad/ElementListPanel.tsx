import { useMemo, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { ElementTarget } from "@/application/selection/target";
import {
  QUANTITY_KINDS,
  quantityCsv,
  quantitySchedule,
  quantityText,
  type QuantityColumn,
  type QuantityKind,
  type QuantityTable,
} from "@/application/quantities/schedule";
import { browserTextDownload } from "@/interop/project-file/browser-download";
import { FloatingPanel } from "./FloatingPanel";

/** Element kind selected by a row click; the material list has no element rows. */
const TARGET_KIND: Record<Exclude<QuantityKind, "materials">, ElementTarget["kind"]> = {
  walls: "wall",
  windows: "window",
  doors: "door",
  columns: "column",
  slabs: "slab",
  roofs: "roof",
  stairs: "stair",
};
const FILE_NAMES: Record<QuantityKind, string> = {
  walls: "waende",
  windows: "fenster",
  doors: "tueren",
  columns: "stuetzen",
  slabs: "decken",
  roofs: "daecher",
  stairs: "treppen",
  materials: "materialien",
};

const cellText = (column: QuantityColumn, value: Parameters<typeof quantityText>[1]) => {
  const text = quantityText(column, value);
  return text && column.unit ? `${text} ${column.unit}` : text;
};
const numeric = (column: QuantityColumn) => column.digits !== undefined || !!column.unit;

/**
 * Element list of the whole project (docs/MENGEN.md, ML2/ML3): one tab per element kind plus
 * the material list, grouped by storey with sums. A row click selects the element (switching
 * to its storey); every tab saves its own CSV file. The list never changes the model.
 */
export function ElementListPanel({
  open,
  onOpenChange,
  project,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSelect: (target: ElementTarget) => void;
}) {
  const [kind, setKind] = useState<QuantityKind>("walls");
  const schedule = useMemo(() => (open ? quantitySchedule(project) : null), [open, project]);
  const table = schedule?.[kind];
  return (
    <FloatingPanel
      open={open}
      title="Bauteilliste"
      onClose={() => onOpenChange(false)}
      width={960}
      height={480}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 text-xs">
        <div role="tablist" aria-label="Bauteilart" className="flex flex-wrap gap-1 border-b pb-2">
          {QUANTITY_KINDS.map((k) => {
            const rows = schedule?.[k].groups.reduce((n, g) => n + g.rows.length, 0) ?? 0;
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={k === kind}
                onClick={() => setKind(k)}
                className={`rounded px-2 py-1 ${k === kind ? "bg-accent font-semibold" : "hover:bg-muted"}`}
              >
                {schedule?.[k].title}
                {k !== "materials" && <span className="text-muted-foreground"> ({rows})</span>}
              </button>
            );
          })}
        </div>
        {table && (
          <div className="flex items-start justify-between gap-2">
            <p className="text-muted-foreground">{table.note}</p>
            <button
              type="button"
              disabled={!table.groups.length}
              onClick={() =>
                browserTextDownload(
                  quantityCsv(table),
                  `novikov-${FILE_NAMES[table.kind]}.csv`,
                  "text/csv;charset=utf-8",
                )
              }
              className="shrink-0 rounded border px-2 py-1 hover:bg-muted disabled:opacity-50"
            >
              Als CSV speichern
            </button>
          </div>
        )}
        {table && table.groups.length === 0 && (
          <p className="text-muted-foreground">
            {table.kind === "materials"
              ? "Keine Wand hat einen Wandaufbau."
              : `Im Projekt gibt es keine ${table.title}.`}
          </p>
        )}
        {table && table.groups.length > 0 && <ListTable table={table} onSelect={onSelect} />}
      </div>
    </FloatingPanel>
  );
}

function ListTable({
  table,
  onSelect,
}: {
  table: QuantityTable;
  onSelect: (target: ElementTarget) => void;
}) {
  const grouped = table.groups.some((g) => g.storeyId !== null);
  // Grouped lists get a leading number column, which also carries the sum labels.
  const sumCells = (sums: Record<string, number>) =>
    table.columns.map((c) => (
      <td key={c.key} className={`px-2 ${numeric(c) ? "text-right" : ""}`}>
        {c.sum ? cellText(c, sums[c.key] ?? 0) : ""}
      </td>
    ));
  const select = (elementId: string | null) => {
    if (elementId && table.kind !== "materials")
      onSelect({ kind: TARGET_KIND[table.kind], id: elementId } as ElementTarget);
  };
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse" aria-label={table.title}>
        <thead className="sticky top-0 bg-background text-left text-muted-foreground">
          <tr>
            {grouped && <th className="px-1 font-normal">Nr.</th>}
            {table.columns.map((c) => (
              <th key={c.key} className={`px-2 font-normal ${numeric(c) ? "text-right" : ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        {table.groups.map((group) => (
          <tbody key={group.storeyId ?? "project"}>
            {grouped && (
              <tr>
                <th
                  colSpan={table.columns.length + 1}
                  className="border-b px-1 pt-2 text-left font-semibold"
                >
                  {group.name}
                </th>
              </tr>
            )}
            {group.rows.map((row, i) => (
              <tr
                key={row.elementId ?? i}
                tabIndex={row.elementId ? 0 : undefined}
                onClick={() => select(row.elementId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") select(row.elementId);
                }}
                className={
                  row.elementId
                    ? "cursor-pointer hover:bg-muted focus:bg-muted focus:outline-none"
                    : undefined
                }
              >
                {grouped && <td className="px-1 text-muted-foreground">{i + 1}</td>}
                {table.columns.map((c) => (
                  <td key={c.key} className={`px-2 ${numeric(c) ? "text-right" : ""}`}>
                    {cellText(c, row.cells[c.key]) || (numeric(c) ? "–" : "")}
                  </td>
                ))}
              </tr>
            ))}
            {grouped && (
              <tr className="text-muted-foreground">
                <td className="whitespace-nowrap px-1">Summe {group.name}</td>
                {sumCells(group.sums)}
              </tr>
            )}
          </tbody>
        ))}
        {grouped && (
          <tfoot>
            <tr className="border-t font-semibold">
              <td className="whitespace-nowrap px-1">Summe Projekt</td>
              {sumCells(table.sums)}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
