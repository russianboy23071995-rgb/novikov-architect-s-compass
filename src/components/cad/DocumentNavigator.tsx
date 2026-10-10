import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { DocumentAction } from "@/application/views/documents";
import { newDocumentScale } from "@/application/views/documents";
import { parseOutputScale } from "@/application/views/scale-input";
import { Button } from "@/components/ui/button";

export type DocumentNavigation = {
  activeDocumentId: string | null;
  onOpenDocument: (id: string | null) => void;
  onDocumentAction: (base: Project, action: DocumentAction) => void;
};
export function DocumentNavigator({
  project,
  activeDocumentId,
  onOpenDocument,
  onDocumentAction,
}: DocumentNavigation & { project: Project }) {
  const [name, setName] = useState("Grundriss");
  const [scaleInput, setScale] = useState<string | null>(null);
  const scale = scaleInput ?? `1:${newDocumentScale(project)}`;
  const [error, setError] = useState("");
  return (
    <div className="space-y-3 p-2 text-xs">
      <Button size="sm" variant="outline" onClick={() => onOpenDocument(null)}>
        Arbeitsmodell öffnen
      </Button>
      <ul aria-label="Gespeicherte Abbilder" className="space-y-2">
        {(project.drawingDocuments ?? []).map((doc) => (
          <li key={doc.id} className="rounded border border-border p-2">
            <input
              aria-label={`Name des Abbilds ${doc.name}`}
              className="w-full bg-transparent"
              defaultValue={doc.name}
              key={doc.name}
              onBlur={(e) => {
                if (e.target.value !== doc.name)
                  onDocumentAction(project, { kind: "rename", id: doc.id, name: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            <div className="flex items-center gap-2">
              <span>1:{doc.denominator}</span>
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={activeDocumentId === doc.id}
                onClick={() => onOpenDocument(doc.id)}
              >
                Öffnen
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Abbild ${doc.name} löschen`}
                onClick={() => onDocumentAction(project, { kind: "delete", id: doc.id })}
              >
                Löschen
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="space-y-2 border-t border-border pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const denominator = parseOutputScale(scale);
            if (!name.trim()) throw new Error("Bitte einen Namen eingeben.");
            onDocumentAction(project, {
              kind: "create",
              id: crypto.randomUUID(),
              modelViewId: crypto.randomUUID(),
              name,
              denominator,
            });
            setError("");
          } catch (cause) {
            setError((cause as Error).message);
          }
        }}
      >
        <label className="block">
          Name
          <input
            aria-label="Neues Abbild Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className="w-full rounded border border-border bg-popover p-1"
          />
        </label>
        <label className="block">
          Maßstab
          <input
            aria-label="Neues Abbild Maßstab"
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            className="w-full rounded border border-border bg-popover p-1"
          />
        </label>
        <Button size="sm" type="submit">
          Abbild erstellen
        </Button>
        <p>Gesamter Grundriss · Ebenensichtbarkeit des Arbeitsmodells übernehmen</p>
        {error && <p role="alert">{error}</p>}
      </form>
    </div>
  );
}
