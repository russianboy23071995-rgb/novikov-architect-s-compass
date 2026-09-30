import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addWindow, updateWall, updateWindow, wallLength } from "@/lib/bim/model";
import type { Project } from "@/lib/bim/model";
import { endAtLength } from "./bim-view";
import type { Selection } from "./bim-view";

type Props = {
  project: Project;
  selection: Selection;
  onChange: (project: Project, selection: Selection) => void;
};

export function BimInspector({ project, selection, onChange }: Props) {
  const [error, setError] = useState("");
  const wall =
    selection?.kind === "wall"
      ? project.storey.walls.find((item) => item.id === selection.id)
      : undefined;
  const opening =
    selection?.kind === "window"
      ? project.storey.windows.find((item) => item.id === selection.id)
      : undefined;
  if (!wall && !opening)
    return (
      <p className="p-3 text-xs text-muted-foreground">
        Select a wall or window to edit its dimensions. Use the Wall tool and click two points to
        draw.
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
    } catch {
      setError(
        "Cannot apply: use positive dimensions and keep the complete window inside its wall. Position must be between 0 and 1; sill height may be zero.",
      );
    }
  };
  return (
    <section className="border-t border-border p-3" aria-label="Element properties">
      <h2 className="mb-1 text-sm font-semibold">
        {wall ? "Wall properties" : "Window properties"}
      </h2>
      <p className="mb-3 break-all font-mono text-[10px] text-muted-foreground">
        {wall?.id ?? opening?.id}
      </p>
      {opening && (
        <p className="mb-2 break-all text-xs text-muted-foreground">Wall: {opening.wallId}</p>
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
        className="space-y-2"
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
              className="mt-1 h-8"
            />
          </label>
        ))}
        <Button type="submit" size="sm" className="w-full">
          Apply dimensions
        </Button>
      </form>
      {wall && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() =>
            run(() => {
              const id = `window-${crypto.randomUUID()}`;
              onChange(
                addWindow(project, {
                  id,
                  wallId: wall.id,
                  width: 1.2,
                  height: 1.35,
                  sillHeight: 0.9,
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
      <p className="mt-3 text-[10px] text-muted-foreground">
        Dimensions in metres. Use Save project to keep applied changes as JSON.
      </p>
    </section>
  );
}
