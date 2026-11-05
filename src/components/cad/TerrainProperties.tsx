import { useState } from "react";
import {
  terrainSettings,
  updateTerrain,
  type TerrainDefaults,
} from "@/application/terrain/actions";
import type { Terrain, TerrainPoint } from "@/domain/elements/terrain/model";
import type { Project } from "@/domain/project/schema";
import type { Selection } from "./bim-view";
import { TerrainFields } from "./TerrainFields";

const metres = (value: number) => value.toFixed(2).replace(".", ",");

/** One row of the point list: plan position, editable height, optional removal. */
function PointRow({
  name,
  point,
  onHeight,
  onRemove,
}: {
  name: string;
  point: TerrainPoint;
  onHeight: (z: number) => void;
  onRemove?: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const z = Number(draft.replace(",", "."));
    setDraft(null);
    if (draft.trim() !== "" && Number.isFinite(z) && z !== point.z) onHeight(z);
  };
  return (
    <tr>
      <td className="pr-2">{name}</td>
      <td className="pr-2 text-muted-foreground">
        {metres(point.x)} / {metres(point.y)}
      </td>
      <td className="pr-2">
        <input
          aria-label={`Höhe ${name}`}
          inputMode="decimal"
          value={draft ?? String(point.z)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          className="w-20 rounded border bg-background p-1"
        />
      </td>
      <td>
        {onRemove && (
          <button
            type="button"
            aria-label={`${name} löschen`}
            onClick={onRemove}
            className="rounded px-1 text-destructive hover:bg-muted"
          >
            Löschen
          </button>
        )}
      </td>
    </tr>
  );
}

/** Properties of the terrain (docs/GELAENDE.md, G2): values, corners and height points; every
 * edit is one undo step. The bar shows the values, the element window also the lists. */
export function TerrainProperties({
  project,
  terrain,
  selection,
  onChange,
  compact = false,
}: {
  project: Project;
  terrain: Terrain;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
  compact?: boolean;
}) {
  const [value, setValue] = useState(() => terrainSettings(terrain));
  const [error, setError] = useState("");
  const apply = (changes: Partial<Omit<Terrain, "id">>) => {
    try {
      onChange(updateTerrain(project, changes), selection);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Änderung nicht möglich.");
    }
  };
  const commit = (next: TerrainDefaults) => {
    const { height: _height, ...values } = next;
    const { height: _stored, ...stored } = terrainSettings(terrain);
    if (JSON.stringify(stored) !== JSON.stringify(values)) apply(values);
  };
  const replaced = (list: readonly TerrainPoint[], index: number, z: number) =>
    list.map((p, i) => (i === index ? { ...p, z } : p));
  return (
    <section aria-label="Geländeeigenschaften" className="space-y-2">
      <h2 className="text-sm font-semibold">Gelände</h2>
      <TerrainFields
        label="Gelände bearbeiten"
        value={value}
        onChange={setValue}
        onCommit={commit}
        layers={project.layers}
        fields={["depth", "contourStep"]}
      />
      {!compact && (
        <table className="text-xs">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="pr-2 font-normal">Punkt</th>
              <th className="pr-2 font-normal">x / y (m)</th>
              <th className="pr-2 font-normal">Höhe (m)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {terrain.outline.map((point, i) => (
              <PointRow
                key={`e${i}`}
                name={`Ecke ${i + 1}`}
                point={point}
                onHeight={(z) => apply({ outline: replaced(terrain.outline, i, z) })}
              />
            ))}
            {terrain.points.map((point, i) => (
              <PointRow
                key={`p${i}`}
                name={`Punkt ${i + 1}`}
                point={point}
                onHeight={(z) => apply({ points: replaced(terrain.points, i, z) })}
                onRemove={() => apply({ points: terrain.points.filter((_, k) => k !== i) })}
              />
            ))}
          </tbody>
        </table>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
