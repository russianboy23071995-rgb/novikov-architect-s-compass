import type { Project } from "@/domain/project/schema";
import type { WallDefaults } from "@/application/tools/pickup";
export function WallDrawingFields({
  project,
  value,
  onChange,
}: {
  project: Project;
  value: WallDefaults;
  onChange: (value: WallDefaults) => void;
}) {
  const axis =
    value.bodyOffset === value.thickness / 2
      ? "outside"
      : value.bodyOffset === -value.thickness / 2
        ? "inside"
        : value.bodyOffset === 0
          ? "centre"
          : "custom";
  return (
    <section aria-label="Wandwerkzeug" className="flex flex-wrap items-end gap-3 text-xs">
      {(["thickness", "height"] as const).map((field) => (
        <label key={field}>
          {field === "thickness" ? "Wandstärke (m)" : "Wandhöhe (m)"}
          <input
            aria-label={field === "thickness" ? "Wandstärke (m)" : "Wandhöhe (m)"}
            type="number"
            min="0.001"
            step="0.01"
            className="block h-8 w-24 rounded border bg-background px-2"
            value={Number.isFinite(value[field]) ? value[field] : ""}
            onChange={(e) => {
              const next = e.target.valueAsNumber;
              onChange({
                ...value,
                [field]: next,
                ...(field === "thickness"
                  ? {
                      bodyOffset:
                        axis === "outside"
                          ? next / 2
                          : axis === "inside"
                            ? -next / 2
                            : Math.max(-next / 2, Math.min(next / 2, value.bodyOffset)),
                    }
                  : {}),
              });
            }}
          />
        </label>
      ))}
      <label>
        Achslage
        <select
          aria-label="Wandvorgabe Achslage"
          className="block h-8 rounded border bg-background"
          value={axis}
          onChange={(e) =>
            onChange({
              ...value,
              bodyOffset:
                e.target.value === "outside"
                  ? value.thickness / 2
                  : e.target.value === "inside"
                    ? -value.thickness / 2
                    : 0,
            })
          }
        >
          <option value="outside">Außen</option>
          <option value="centre">Mitte</option>
          <option value="inside">Innen</option>
          <option disabled value="custom">
            Individuell
          </option>
        </select>
      </label>
      <label>
        Körperversatz (m)
        <input
          aria-label="Wandvorgabe Körperversatz (m)"
          type="number"
          min={-value.thickness / 2}
          max={value.thickness / 2}
          step="0.01"
          className="block h-8 w-24 rounded border bg-background px-2"
          value={Number.isFinite(value.bodyOffset) ? value.bodyOffset : ""}
          onChange={(e) => onChange({ ...value, bodyOffset: e.target.valueAsNumber })}
        />
      </label>
      <label>
        Ebene
        <select
          aria-label="Wand-Zielebene"
          className="block h-8 rounded border bg-background"
          value={value.layerId}
          onChange={(e) => onChange({ ...value, layerId: e.target.value })}
        >
          {project.layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
