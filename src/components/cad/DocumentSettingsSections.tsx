import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Project } from "@/domain/project/schema";
import { SettingsSections } from "./SettingsSections";

export function DocumentSettingsSections({
  project,
  documentId,
  children,
}: {
  project: Project;
  documentId?: string;
  children: ReactNode;
}) {
  const hidden = new Set(
    documentId
      ? (project.drawingDocuments?.find((d) => d.id === documentId)?.hiddenLayerIds ?? [])
      : project.bimVisibility.hiddenLayerIds,
  );
  const visible = project.layers.filter((layer) => !hidden.has(layer.id));
  return (
    <SettingsSections
      sections={[
        { id: "general", label: "Allgemein", content: children },
        {
          id: "layers",
          label: "Ebenensichtbarkeit",
          content: (
            <>
              <section aria-label="Aktive Ebenen">
                <h3 className="mb-2 font-medium">Aktive Ebenen ({visible.length})</h3>
                {visible.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {visible.map((layer) => (
                      <li key={layer.id} className="rounded-md border bg-background/60 px-2 py-1">
                        {layer.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Keine Ebene eingeblendet.</p>
                )}
              </section>
              <section aria-label="Alle vorhandenen Ebenen">
                <h3 className="mb-2 font-medium">
                  Alle vorhandenen Ebenen ({project.layers.length})
                </h3>
                <ul className="divide-y rounded-lg border bg-background/30">
                  {project.layers.map((layer) => (
                    <li
                      key={layer.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span>{layer.name}</span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        {hidden.has(layer.id) ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                        {hidden.has(layer.id) ? "Ausgeblendet" : "Sichtbar"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <p className="text-muted-foreground">
                Die Sichtbarkeit wird über den Ebenenumschalter im geöffneten Abbild gesteuert.
              </p>
            </>
          ),
        },
        ...[2, 3, 4, 5].map((number) => ({
          id: `tab${number}`,
          label: `Tab ${number}`,
          content: (
            <p className="text-muted-foreground">Hier sind noch keine Einstellungen hinterlegt.</p>
          ),
        })),
      ]}
    />
  );
}
