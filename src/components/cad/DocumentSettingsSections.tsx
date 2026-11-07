import type { ReactNode } from "react";
import { DocumentLayerDraft } from "./DocumentLayerDraft";
import type { Project } from "@/domain/project/schema";
import { SettingsSections } from "./SettingsSections";

export function DocumentSettingsSections({
  project,
  documentId,
  children,
  onVisibilityChange,
  onUnderlaysChange,
}: {
  project: Project;
  documentId?: string;
  children: ReactNode;
  onVisibilityChange: (hidden: string[]) => void;
  onUnderlaysChange?: ((show: boolean) => void) | undefined;
}) {
  const document = project.drawingDocuments?.find((d) => d.id === documentId);
  const hidden = document?.hiddenLayerIds ?? [];
  return (
    <SettingsSections
      sections={[
        { id: "general", label: "Allgemein", content: children },
        {
          id: "layers",
          label: "Ebenensichtbarkeit",
          content: (
            <DocumentLayerDraft
              layers={project.layers}
              hidden={hidden}
              onChange={onVisibilityChange}
            />
          ),
        },
        // Image underlays on layouts and in the PDF (docs/BILDUNTERLAGE.md, B6).
        {
          id: "underlays",
          label: "Bildunterlagen",
          content: (
            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                aria-label="Bildunterlagen auf Layouts zeigen"
                checked={!!document?.showUnderlays}
                disabled={!onUnderlaysChange}
                onChange={(e) => onUnderlaysChange?.(e.target.checked)}
              />
              <span>
                Bildunterlagen auf Layouts und im PDF zeigen. Aus: Ein Scan zum Nachzeichnen
                erscheint nur im Grundriss und im Abbild, nicht auf dem Plan.
              </span>
            </label>
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
