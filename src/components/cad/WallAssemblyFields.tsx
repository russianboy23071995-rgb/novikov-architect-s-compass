import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/domain/project/schema";
import {
  MATERIAL_PATTERNS,
  MATERIAL_PATTERN_LABELS,
  assemblyThickness,
  type Material,
  type MaterialPattern,
  type WallAssembly,
} from "@/domain/elements/wall/assembly";
import { assemblyLibrary, assemblyUsage } from "@/application/walls/assembly";

type Library = { materials: Material[]; wallAssemblies: WallAssembly[] };
const cm = (m: number) => Math.round(m * 100000) / 1000;
const cmText = (m: number) => String(cm(m)).replace(".", ",");

/**
 * Reiter „Wandaufbau“ of the wall tool and of a wall element (docs/WANDAUFBAU.md, SA1): choose
 * the build-up of the wall, flip it, and edit the project library of build-ups and materials.
 * Every library change applies at once (one undo step); walls using an assembly follow it.
 */
export function WallAssemblyFields({
  project,
  value,
  onChange,
  flipped,
  onFlip,
  onLibrary,
  hint,
}: {
  project: Project;
  value: string | null;
  onChange: (assemblyId: string | null) => void;
  flipped?: boolean | undefined;
  onFlip?: (() => void) | undefined;
  onLibrary: (library: Library) => void;
  hint: string;
}) {
  const library = assemblyLibrary(project);
  const usage = assemblyUsage(project);
  const [editing, setEditing] = useState<string | null>(
    value ?? library.wallAssemblies[0]?.id ?? null,
  );
  const [tab, setTab] = useState<"assemblies" | "materials">("assemblies");
  const current = library.wallAssemblies.find((a) => a.id === editing) ?? null;
  const materials = new Map(library.materials.map((m) => [m.id, m]));
  const chosen = library.wallAssemblies.find((a) => a.id === value) ?? null;
  const save = (next: Partial<Library>) => onLibrary({ ...library, ...next });
  const saveAssembly = (assembly: WallAssembly) =>
    save({
      wallAssemblies: library.wallAssemblies.map((a) => (a.id === assembly.id ? assembly : a)),
    });
  const setLayer = (index: number, change: Partial<WallAssembly["layers"][number]>) =>
    current &&
    saveAssembly({
      ...current,
      layers: current.layers.map((l, i) => {
        if (i !== index) return l;
        const { core: _core, ...rest } = { ...l, ...change };
        return (change.core ?? l.core) ? { ...rest, core: true } : rest;
      }),
    });
  const freeName = (base: string) => {
    let name = base;
    for (let i = 2; library.wallAssemblies.some((a) => a.name === name); i++)
      name = `${base} (${i})`;
    return name;
  };

  return (
    <section aria-label="Wandaufbau" className="space-y-3 text-xs">
      <div className="flex flex-wrap items-end gap-3">
        <label>
          Aufbau
          <select
            aria-label="Wandaufbau"
            className="block h-8 max-w-64 rounded border bg-background"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
          >
            <option value="">Ohne (einschichtig)</option>
            {library.wallAssemblies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {cmText(assemblyThickness(a))} cm
              </option>
            ))}
          </select>
        </label>
        {onFlip && chosen && (
          <Button size="sm" variant="outline" className="h-8" onClick={onFlip}>
            Aufbau spiegeln{flipped ? " (gespiegelt)" : ""}
          </Button>
        )}
      </div>
      {chosen && <AssemblyStrip assembly={chosen} materials={materials} flipped={!!flipped} />}
      <p className="text-muted-foreground">{hint}</p>

      <div className="flex gap-1 border-t pt-3" role="tablist" aria-label="Bibliothek">
        {(["assemblies", "materials"] as const).map((t) => (
          <Button
            key={t}
            role="tab"
            aria-selected={tab === t}
            size="sm"
            variant={tab === t ? "secondary" : "ghost"}
            className="h-7"
            onClick={() => setTab(t)}
          >
            {t === "assemblies" ? "Wandaufbauten" : "Materialien"}
          </Button>
        ))}
      </div>

      {tab === "assemblies" && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <label>
              Bearbeiten
              <select
                aria-label="Wandaufbau bearbeiten"
                className="block h-8 max-w-64 rounded border bg-background"
                value={editing ?? ""}
                onChange={(e) => setEditing(e.target.value || null)}
              >
                {library.wallAssemblies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {usage.get(a.id) ? ` · ${usage.get(a.id)} Wände` : ""}
                  </option>
                ))}
              </select>
            </label>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => {
                const id = `assembly-${crypto.randomUUID()}`;
                const base = current ?? null;
                save({
                  wallAssemblies: [
                    ...library.wallAssemblies,
                    {
                      id,
                      name: freeName(base ? `${base.name} Kopie` : "Neuer Aufbau"),
                      layers: base
                        ? base.layers.map((l) => ({ ...l }))
                        : [{ materialId: library.materials[0]!.id, thickness: 0.24, core: true }],
                    },
                  ],
                });
                setEditing(id);
              }}
            >
              {current ? "Kopieren" : "Neu"}
            </Button>
            {current && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-destructive"
                disabled={!!usage.get(current.id)}
                title={usage.get(current.id) ? "Wird von Wänden verwendet." : undefined}
                onClick={() => {
                  save({
                    wallAssemblies: library.wallAssemblies.filter((a) => a.id !== current.id),
                  });
                  setEditing(library.wallAssemblies.find((a) => a.id !== current.id)?.id ?? null);
                }}
              >
                Löschen
              </Button>
            )}
          </div>
          {current && (
            <>
              <label className="block">
                Name
                <input
                  key={current.id}
                  aria-label="Name des Wandaufbaus"
                  className="block h-8 w-64 rounded border bg-background px-2"
                  defaultValue={current.name}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name && name !== current.name) saveAssembly({ ...current, name });
                    else e.target.value = current.name;
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </label>
              <table className="w-full" aria-label="Schichten von außen nach innen">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left font-normal">Nr.</th>
                    <th className="text-left font-normal">Material</th>
                    <th className="text-left font-normal">Dicke (cm)</th>
                    <th className="text-left font-normal">Tragend</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {current.layers.map((l, i) => (
                    <tr key={`${current.id}-${i}-${current.layers.length}`}>
                      <td>{i + 1}</td>
                      <td>
                        <select
                          aria-label={`Material Schicht ${i + 1}`}
                          className="h-7 max-w-40 rounded border bg-background"
                          value={l.materialId}
                          onChange={(e) => setLayer(i, { materialId: e.target.value })}
                        >
                          {library.materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label={`Dicke Schicht ${i + 1} (cm)`}
                          type="number"
                          min="0.1"
                          step="0.5"
                          className="h-7 w-20 rounded border bg-background px-1"
                          defaultValue={cm(l.thickness)}
                          onBlur={(e) => {
                            const next = e.target.valueAsNumber / 100;
                            if (Number.isFinite(next) && next >= 0.001 && next !== l.thickness)
                              setLayer(i, { thickness: Math.round(next * 100000) / 100000 });
                            else e.target.value = String(cm(l.thickness));
                          }}
                          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Schicht ${i + 1} tragend`}
                          checked={!!l.core}
                          onChange={(e) => setLayer(i, { core: e.target.checked })}
                        />
                      </td>
                      <td className="whitespace-nowrap">
                        {(
                          [
                            ["↑", "nach außen", i - 1],
                            ["↓", "nach innen", i + 1],
                          ] as const
                        ).map(([sign, label, to]) => (
                          <Button
                            key={sign}
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5"
                            aria-label={`Schicht ${i + 1} ${label}`}
                            disabled={to < 0 || to >= current.layers.length}
                            onClick={() => {
                              const layers = [...current.layers];
                              [layers[i], layers[to]] = [layers[to]!, layers[i]!];
                              saveAssembly({ ...current, layers });
                            }}
                          >
                            {sign}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-destructive"
                          aria-label={`Schicht ${i + 1} entfernen`}
                          disabled={current.layers.length === 1}
                          onClick={() =>
                            saveAssembly({
                              ...current,
                              layers: current.layers.filter((_, j) => j !== i),
                            })
                          }
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={current.layers.length >= 20}
                  onClick={() =>
                    saveAssembly({
                      ...current,
                      layers: [
                        ...current.layers,
                        { materialId: library.materials[0]!.id, thickness: 0.015 },
                      ],
                    })
                  }
                >
                  Schicht hinzufügen
                </Button>
                <span>
                  Gesamt {cmText(assemblyThickness(current))} cm
                  {usage.get(current.id)
                    ? ` · ${usage.get(current.id)} Wände folgen jeder Änderung`
                    : ""}
                </span>
              </div>
              <AssemblyStrip assembly={current} materials={materials} flipped={false} />
            </>
          )}
        </div>
      )}

      {tab === "materials" && (
        <MaterialList
          materials={library.materials}
          used={new Set(library.wallAssemblies.flatMap((a) => a.layers.map((l) => l.materialId)))}
          onChange={(materials) => save({ materials })}
        />
      )}
    </section>
  );
}

/** The layers side by side, outside on the left, to scale. */
function AssemblyStrip({
  assembly,
  materials,
  flipped,
}: {
  assembly: WallAssembly;
  materials: Map<string, Material>;
  flipped: boolean;
}) {
  const layers = flipped ? [...assembly.layers].reverse() : assembly.layers;
  const total = assemblyThickness(assembly);
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{flipped ? "innen" : "außen"}</span>
        <span>{flipped ? "außen" : "innen"}</span>
      </div>
      <div className="flex h-6 overflow-hidden rounded border" aria-hidden>
        {layers.map((l, i) => (
          <div
            key={i}
            title={`${materials.get(l.materialId)?.name ?? "?"} ${cmText(l.thickness)} cm`}
            className="border-r border-foreground/40 last:border-r-0"
            style={{
              width: `${(l.thickness / total) * 100}%`,
              background: materials.get(l.materialId)?.color ?? "#ccc",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MaterialList({
  materials,
  used,
  onChange,
}: {
  materials: Material[];
  used: Set<string>;
  onChange: (materials: Material[]) => void;
}) {
  const set = (id: string, change: Partial<Material>) =>
    onChange(materials.map((m) => (m.id === id ? { ...m, ...change } : m)));
  return (
    <div className="space-y-2">
      <table className="w-full" aria-label="Materialien">
        <thead className="text-muted-foreground">
          <tr>
            <th className="text-left font-normal">Name</th>
            <th className="text-left font-normal">Farbe</th>
            <th className="text-left font-normal">Schraffur</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id}>
              <td>
                <input
                  aria-label={`Name Material ${m.name}`}
                  className="h-7 w-36 rounded border bg-background px-1"
                  defaultValue={m.name}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name && name !== m.name) set(m.id, { name });
                    else e.target.value = m.name;
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </td>
              <td>
                <input
                  type="color"
                  aria-label={`Farbe Material ${m.name}`}
                  className="h-7 w-10"
                  value={m.color}
                  onChange={(e) => set(m.id, { color: e.target.value })}
                />
              </td>
              <td>
                <select
                  aria-label={`Schraffur Material ${m.name}`}
                  className="h-7 rounded border bg-background"
                  value={m.pattern}
                  onChange={(e) => set(m.id, { pattern: e.target.value as MaterialPattern })}
                >
                  {MATERIAL_PATTERNS.map((p) => (
                    <option key={p} value={p}>
                      {MATERIAL_PATTERN_LABELS[p]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-1.5 text-destructive"
                  aria-label={`Material ${m.name} löschen`}
                  disabled={used.has(m.id) || materials.length === 1}
                  title={used.has(m.id) ? "Wird in einem Wandaufbau verwendet." : undefined}
                  onClick={() => onChange(materials.filter((x) => x.id !== m.id))}
                >
                  ×
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        size="sm"
        variant="outline"
        className="h-7"
        disabled={materials.length >= 500}
        onClick={() =>
          onChange([
            ...materials,
            {
              id: `material-${crypto.randomUUID()}`,
              name: "Neues Material",
              color: "#dddddd",
              pattern: "none",
            },
          ])
        }
      >
        Material hinzufügen
      </Button>
    </div>
  );
}
