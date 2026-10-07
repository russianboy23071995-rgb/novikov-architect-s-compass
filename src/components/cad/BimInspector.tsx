import { defaultDrawingWindow } from "@/application/drawing/window-placement";
import { HatchInspector } from "./HatchControls";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addWindow, updateWall, updateWindow, wallLength } from "@/lib/bim/model";
import type { Project } from "@/lib/bim/model";
import { endAtLength } from "./bim-view";
import type { Selection } from "./bim-view";
import { LineInspector } from "./LineControls";

type Props = {
  project: Project;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
  onWallOffset: (base: Project, wallId: string, offset: number) => void;
};

export function BimInspector({ project, selection, onChange, onWallOffset }: Props) {
  const [error, setError] = useState("");
  const hatch =
    selection?.kind === "hatch"
      ? project.storey.hatches.find((h) => h.id === selection.id)
      : undefined;
  if (hatch) return <HatchInspector project={project} hatch={hatch} onChange={onChange} />;
  const line =
    selection?.kind === "line"
      ? project.storey.lines?.find((item) => item.id === selection.id)
      : undefined;
  if (line) return <LineInspector project={project} line={line} onChange={onChange} />;
  const wall =
    selection?.kind === "wall"
      ? project.storey.walls.find((item) => item.id === selection.id)
      : undefined;
  const opening =
    selection?.kind === "window"
      ? project.storey.windows.find((item) => item.id === selection.id)
      : undefined;
  if (selection?.kind === "reference") {
    const r = project.storey.references.find((r) => r.id === selection.id)!;
    const a = project.assets.find((a) => a.id === r.assetId)!;
    return (
      <p className="p-3 text-xs">
        Bildreferenz · {(a.pixelWidth * r.metresPerPixel).toFixed(3)} ×{" "}
        {(a.pixelHeight * r.metresPerPixel).toFixed(3)} m · Position {r.origin.x.toFixed(3)},{" "}
        {r.origin.y.toFixed(3)} m. Kalibrieren folgt im nächsten Schritt.
      </p>
    );
  }
  if (!wall && !opening)
    return (
      <p className="p-3 text-xs text-muted-foreground">
        Wand, Fenster, Linie oder Schraffur auswählen, um die Eigenschaften hier zu bearbeiten.
      </p>
    );
  const fields = wall
    ? ([
        ["length", "Length (m)", wallLength(wall)],
        ["thickness", "Thickness (m)", wall.thickness],
        ["height", "Height (m)", wall.height],
      ] as const)
    : ([
        ["width", "Width (m)", opening!.width],
        ["height", "Height (m)", opening!.height],
        ["sillHeight", "Sill height (m)", opening!.sillHeight],
        ["position", "Position (0–1)", opening!.position],
      ] as const);
  const run = (command: () => void) => {
    try {
      command();
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name !== "ZodError"
          ? failure.message
          : "Cannot apply: use positive dimensions and keep the complete window inside its wall. Position must be between 0 and 1; sill height may be zero.",
      );
    }
  };
  return (
    <section className="flex flex-wrap items-end gap-x-4 gap-y-2" aria-label="Element properties">
      <h2 className="text-sm font-semibold">{wall ? "Wall properties" : "Window properties"}</h2>
      {wall &&
        project.storey.wallJoins.some(
          (j) => j.first.wallId === wall.id || j.second.wallId === wall.id,
        ) && <span className="text-xs text-muted-foreground">Wandanschluss aktiv</span>}
      <p className="max-w-48 truncate font-mono text-[10px] text-muted-foreground">
        {wall?.id ?? opening?.id}
      </p>
      {opening && (
        <p className="max-w-48 truncate text-xs text-muted-foreground">Wall: {opening.wallId}</p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const number = (name: string) => {
            const raw = data.get(name);
            return typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
          };
          run(() => {
            const changed = wall
              ? updateWall(project, wall.id, {
                  end: endAtLength(wall, number("length")),
                  thickness: number("thickness"),
                  height: number("height"),
                })
              : updateWindow(project, opening!.id, {
                  width: number("width"),
                  height: number("height"),
                  sillHeight: number("sillHeight"),
                  position: number("position"),
                });
            onChange(changed, selection);
          });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        {fields.map(([name, label, value]) => (
          <label key={name} className="block text-xs">
            {label}
            <Input
              name={name}
              type="number"
              step="any"
              required
              defaultValue={value}
              className="mt-1 h-8 w-28"
            />
          </label>
        ))}
        <Button type="submit" size="sm" className="shrink-0">
          Apply dimensions
        </Button>
      </form>
      {wall && (
        <label
          className="text-xs"
          title="Außen oder innen an der Wandkante, alternativ mittig. Die Achse bleibt fest; der Wandkörper folgt."
        >
          Achslage
          <select
            aria-label="Wandachslage"
            className="ml-2 h-8 rounded border bg-background px-2"
            value={
              wall.bodyOffset === wall.thickness / 2
                ? "right"
                : wall.bodyOffset === -wall.thickness / 2
                  ? "left"
                  : wall.bodyOffset === 0
                    ? "centre"
                    : "custom"
            }
            onChange={(event) =>
              onWallOffset(
                project,
                wall.id,
                event.target.value === "right"
                  ? wall.thickness / 2
                  : event.target.value === "left"
                    ? -wall.thickness / 2
                    : 0,
              )
            }
          >
            <option value="right">Außen</option>
            <option value="centre">Mitte</option>
            <option value="left">Innen</option>
            <option value="custom" disabled>
              Individuell
            </option>
          </select>
        </label>
      )}
      {wall && (
        <form
          className="flex items-end gap-2"
          aria-label="Wandkörperversatz"
          onSubmit={(event) => {
            event.preventDefault();
            const raw = String(new FormData(event.currentTarget).get("offset") ?? "")
              .trim()
              .replace(",", ".");
            const offset = raw === "" ? NaN : Number(raw);
            if (!Number.isFinite(offset)) {
              setError("Bitte einen endlichen Wandversatz in Metern eingeben.");
              return;
            }
            setError("");
            onWallOffset(project, wall.id, offset);
          }}
        >
          <label
            className="text-xs"
            title="Positiv links in Richtung vom Achsanfang zum Achsende. Die Zeichenachse bleibt fest."
          >
            Körperversatz (±{wall.thickness / 2} m)
            <Input
              aria-label="Wandkörperversatz (m)"
              name="offset"
              inputMode="decimal"
              required
              defaultValue={wall.bodyOffset}
              className="mt-1 h-8 w-24"
            />
          </label>
          <Button type="submit" size="sm">
            Versatz übernehmen
          </Button>
          <Button type="reset" variant="ghost" size="sm" onClick={() => setError("")}>
            Verwerfen
          </Button>
        </form>
      )}
      {wall && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() =>
            run(() => {
              const id = `window-${crypto.randomUUID()}`;
              onChange(
                addWindow(project, {
                  id,
                  wallId: wall.id,
                  ...defaultDrawingWindow,
                  position: 0.5,
                }),
                { kind: "window", id },
              );
            })
          }
        >
          Add centred window
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        Dimensions in metres. Use Save project to keep applied changes as JSON.
      </p>
    </section>
  );
}
