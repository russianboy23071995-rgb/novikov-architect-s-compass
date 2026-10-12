import type { ReactNode } from "react";
import { DocumentLayerDraft } from "./DocumentLayerDraft";
import type { Project } from "@/domain/project/schema";
import { SettingsSections } from "./SettingsSections";

export function DocumentSettingsSections({
  project,
  documentId,
  children,
  onVisibilityChange,
}: {
  project: Project;
  documentId?: string;
  children: ReactNode;
  onVisibilityChange: (hidden: string[]) => void;
}) {
  const hidden = project.drawingDocuments?.find((d) => d.id === documentId)?.hiddenLayerIds ?? [];
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
