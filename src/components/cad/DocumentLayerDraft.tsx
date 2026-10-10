import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Project } from "@/domain/project/schema";

/** Edits only the creation draft; no model or visibility-history mutation. */
export function DocumentLayerDraft({
  layers,
  hidden,
  onChange,
}: {
  layers: Project["layers"];
  hidden: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const matches = layers.filter((layer) =>
    layer.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <section aria-label="Ebenen für das neue Abbild" className="space-y-2">
      <p>
        Für das neue Abbild sind die folgenden Ebenen vorgesehen. Über das Auge kannst du jede Ebene
        ein- oder ausblenden.
      </p>
      <div className="max-h-52 overflow-y-auto rounded-lg border">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-popover">
            <tr>
              <th className="px-3 py-2 font-medium">Name der Ebene</th>
              <th className="w-24 px-3 py-2 font-medium">Sichtbarkeit</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((layer) => {
              const visible = !hidden.includes(layer.id);
              return (
                <tr key={layer.id} className="border-t">
                  <td className="px-3 py-1">{layer.name}</td>
                  <td className="text-center">
                    <button
                      type="button"
                      aria-label={`Ebene sichtbar: ${layer.name}`}
                      aria-pressed={visible}
                      title={visible ? "Ausblenden" : "Einblenden"}
                      className={`rounded p-1.5 hover:bg-accent ${visible ? "text-emerald-600" : "text-muted-foreground"}`}
                      onClick={() =>
                        onChange(
                          visible ? [...hidden, layer.id] : hidden.filter((id) => id !== layer.id),
                        )
                      }
                    >
                      {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!matches.length && <p className="p-3 text-muted-foreground">Keine passende Ebene.</p>}
      </div>
      <input
        aria-label="Ebene suchen"
        placeholder="Ebene suchen …"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded border bg-popover px-3 py-1.5"
      />
    </section>
  );
}
