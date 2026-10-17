import { useMemo, useState } from "react";
import type { Project, Wall } from "@/domain/project/schema";
import { setWallHeightRule } from "@/application/walls/height-binding";
import { resolveStoreyLevels } from "@/domain/storeys/heights";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "./PropertyForm";

/** Presentation adapter only; every edit uses the shared validated height action. */
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
  const { storey, upper, canBind } = useMemo(() => {
    const index = project.storeys.findIndex((s) => s.walls.some((w) => w.id === wall.id));
    const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId);
    const upper = project.storeys[index + 1];
    return {
      storey: project.storeys[index]!,
      upper,
      canBind: !!upper && levels[index]?.elevation != null && levels[index + 1]?.elevation != null,
    };
  }, [project, wall.id]);
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
            ? "Die Wand wäre zu niedrig für ein vorhandenes Fenster. Bitte Höhe oder Versatz anpassen."
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
            else if (canBind && upper)
              apply({ kind: "slab-underside", storeyId: upper.id, topOffset: 0 });
          }}
        >
          <option value="fixed">Feste Höhe</option>
          <option value="bound" disabled={!canBind}>
            UK Rohdecke
          </option>
        </select>
      </label>
      <PropertyForm
        className="flex items-end gap-2"
        aria-label="Wandhöhe bearbeiten"
        onSubmit={(e) => {
          e.preventDefault();
          const raw = String(new FormData(e.currentTarget).get("heightValue") ?? "")
            .trim()
            .replace(",", ".");
          const value = raw === "" ? NaN : Number(raw);
          if (!Number.isFinite(value) || (!binding && value <= 0)) {
            setError(
              binding
                ? "Bitte einen endlichen Höhenversatz eingeben."
                : "Die Wandhöhe muss größer als null sein.",
            );
            return;
          }
          if (value === (binding?.topOffset ?? wall.height)) {
            setError("");
            return;
          }
          apply(binding ? { ...binding, topOffset: value } : { kind: "fixed", height: value });
        }}
      >
        <label className="text-xs">
          {binding ? "Versatz zur UK (m)" : "Wandhöhe (m)"}
          <Input
            name="heightValue"
            aria-label={binding ? "Versatz zur UK Rohdecke (m)" : "Wandhöhe (m)"}
            inputMode="decimal"
            required
            defaultValue={Number((binding?.topOffset ?? wall.height).toPrecision(12))}
            className="mt-1 h-8 w-24"
          />
        </label>
      </PropertyForm>
      {binding ? (
        <p className="text-[11px] text-muted-foreground">
          Bezug: {upper?.name} · Rohdecke {binding.slabThickness.toLocaleString("de-DE")} m
          (Annahme)
          <br />
          Berechnete Höhe:{" "}
          <output aria-label="Berechnete Wandhöhe">
            {wall.height.toLocaleString("de-DE", { maximumFractionDigits: 3 })} m
          </output>
        </p>
      ) : (
        !canBind && (
          <p className="max-w-48 text-[11px] text-muted-foreground">
            {upper
              ? "Für die Bindung zuerst die Geschosshöhen festlegen."
              : "Für die Bindung ein Geschoss darüber anlegen."}
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
