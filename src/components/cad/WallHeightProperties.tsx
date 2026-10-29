import { useMemo, useState } from "react";
import type { Project, Wall } from "@/domain/project/schema";
import { setWallHeightRule } from "@/application/walls/height-binding";
import { resolveStoreyLevels } from "@/domain/storeys/heights";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "./PropertyForm";

const metres = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 3 });
const parse = (form: HTMLFormElement, name: string) => {
  const raw = String(new FormData(form).get(name) ?? "")
    .trim()
    .replace(",", ".");
  return raw === "" ? NaN : Number(raw);
};

/** Presentation adapter only; every edit uses the shared validated height action.
 * Bound walls end at OK raw floor above their own storey plus an extra height; a typed
 * wall height releases the binding (user decision 29.10.2026).
 */
export function WallHeightProperties({
  project,
  wall,
  onChange,
}: {
  project: Project;
  wall: Wall;
  onChange: (project: Project) => void;
}) {
  const [error, setError] = useState("");
  const { storey, upperElevation } = useMemo(() => {
    const index = project.storeys.findIndex((s) => s.walls.some((w) => w.id === wall.id));
    const level = resolveStoreyLevels(project.storeys, project.groundStoreyId)[index];
    return {
      storey: project.storeys[index]!,
      upperElevation: level?.elevation != null ? level.upperElevation : null,
    };
  }, [project, wall.id]);
  const canBind = upperElevation != null;
  const binding = wall.topBinding;
  const apply = (rule: Parameters<typeof setWallHeightRule>[2]["rule"]) => {
    try {
      const next = setWallHeightRule(project, project, {
        projectId: project.id,
        storeyId: storey.id,
        wallIds: [wall.id],
        rule,
      });
      setError("");
      onChange(next);
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name !== "ZodError"
          ? failure.message.includes("must fit within its wall height")
            ? "Die Wand wäre zu niedrig für ein vorhandenes Fenster. Bitte Höhe oder Zusatzhöhe anpassen."
            : failure.message
          : "Bitte gültige Maße eingeben. Fenster und Wandanschlüsse müssen weiterhin passen.",
      );
    }
  };
  return (
    <div className="flex flex-wrap items-end gap-2" aria-label="Wandhöhenbindung">
      <label className="text-xs">
        Höhenmodus
        <select
          aria-label="Wandhöhenmodus"
          value={binding ? "bound" : "fixed"}
          className="mt-1 block h-8 rounded border bg-background px-2 text-xs"
          onChange={(e) => {
            if (e.target.value === "fixed") apply({ kind: "fixed", height: wall.height });
            else if (canBind) apply({ kind: "storey", topOffset: 0 });
          }}
        >
          <option value="fixed">Feste Höhe</option>
          <option value="bound" disabled={!canBind}>
            An Geschoss gebunden
          </option>
        </select>
      </label>
      {binding && (
        <PropertyForm
          className="flex items-end gap-2"
          aria-label="Zusatzhöhe bearbeiten"
          onSubmit={(e) => {
            e.preventDefault();
            const value = parse(e.currentTarget, "topOffset");
            if (!Number.isFinite(value)) {
              setError("Bitte eine endliche Zusatzhöhe eingeben.");
              return;
            }
            if (value === binding.topOffset) return setError("");
            apply({ kind: "storey", topOffset: value });
          }}
        >
          <label className="text-xs">
            Zusatzhöhe (m)
            <Input
              key={binding.topOffset}
              name="topOffset"
              aria-label="Zusatzhöhe über OK Geschoss (m)"
              inputMode="decimal"
              required
              defaultValue={Number(binding.topOffset.toPrecision(12))}
              className="mt-1 h-8 w-24"
            />
          </label>
        </PropertyForm>
      )}
      <PropertyForm
        className="flex items-end gap-2"
        aria-label="Wandhöhe bearbeiten"
        onSubmit={(e) => {
          e.preventDefault();
          const value = parse(e.currentTarget, "heightValue");
          if (!Number.isFinite(value) || value <= 0) {
            setError("Die Wandhöhe muss größer als null sein.");
            return;
          }
          if (value === wall.height) return setError("");
          apply({ kind: "fixed", height: value });
        }}
      >
        <label className="text-xs">
          Wandhöhe (m)
          <Input
            key={wall.height}
            name="heightValue"
            aria-label="Wandhöhe (m)"
            inputMode="decimal"
            required
            defaultValue={Number(wall.height.toPrecision(12))}
            className="mt-1 h-8 w-24"
          />
        </label>
      </PropertyForm>
      {binding ? (
        <p className="text-[11px] text-muted-foreground">
          Bezug: {storey.name} · OK Rohfußboden darüber{" "}
          {upperElevation != null && `${metres(upperElevation)} m`}
          <br />
          Berechnete Höhe: <output aria-label="Berechnete Wandhöhe">{metres(wall.height)} m</output>
          <br />
          Eine eingegebene Wandhöhe löst die Bindung.
        </p>
      ) : (
        !canBind && (
          <p className="max-w-48 text-[11px] text-muted-foreground">
            Für die Bindung zuerst die Geschosshöhe festlegen.
          </p>
        )
      )}
      {error && (
        <p role="alert" className="max-w-80 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
