import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { DocumentAction } from "@/application/views/documents";
import { parseOutputScale } from "@/application/views/scale-input";
import { FloatingPanel } from "./FloatingPanel";

/**
 * Window „Schnitt als Abbild sichern“ (docs/ABBILDER.md, AB2): every drawing document gets its
 * drawing name and its scale, a section or elevation document as well. Defaults: the name of
 * the section and the project scale; the folder is the standard collection.
 */
export function SectionDocumentWindow({
  project,
  sectionId,
  denominator,
  onApply,
  onClose,
}: {
  project: Project;
  sectionId: string;
  /** Default scale, the current project scale. */
  denominator: number;
  /** Applies the action; throws with a message when it is refused. */
  onApply: (action: DocumentAction) => void;
  onClose: () => void;
}) {
  const section = project.sections?.find((s) => s.id === sectionId);
  const kind = section?.kind === "elevation" ? "Ansicht" : "Schnitt";
  const folders = project.documentFolders ?? [];
  const [name, setName] = useState(section?.name ?? kind);
  const [scale, setScale] = useState(`1:${denominator}`);
  const [folderId, setFolderId] = useState(
    folders.find((f) => f.name === "Abbildsammlung")?.id ?? folders[0]?.id ?? "",
  );
  const [error, setError] = useState("");
  const input = "w-full rounded border bg-popover p-1";
  return (
    <FloatingPanel
      centered
      open
      title={`${kind} als Abbild sichern`}
      width={400}
      height={330}
      onClose={onClose}
    >
      <form
        className="flex min-h-0 flex-1 flex-col gap-3 p-3 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onApply({
              kind: "create-section",
              id: crypto.randomUUID(),
              modelViewId: crypto.randomUUID(),
              sectionId,
              name,
              denominator: parseOutputScale(scale),
              ...(folderId ? { folderId } : {}),
            });
            onClose();
          } catch (cause) {
            setError((cause as Error).message);
          }
        }}
      >
        <p className="text-muted-foreground">
          Das Abbild zeigt {kind === "Ansicht" ? "die Ansicht" : "den Schnitt"} „{section?.name}“
          und folgt jeder Änderung am Modell. Zeichnungsname und Maßstab erscheinen später im
          Plankopf.
        </p>
        <label>
          Zeichnungsname
          <input
            aria-label="Zeichnungsname"
            autoFocus
            maxLength={120}
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <label className="w-28">
            Maßstab
            <input
              aria-label="Maßstab"
              className={input}
              value={scale}
              onChange={(e) => setScale(e.target.value)}
            />
          </label>
          <label className="flex-1">
            Ordner
            <select
              aria-label="Ordner"
              className={input}
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">Ohne Ordner</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <div className="mt-auto flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-1" onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="submit"
            className="rounded border bg-primary px-3 py-1 text-primary-foreground"
          >
            Als Abbild sichern
          </button>
        </div>
      </form>
    </FloatingPanel>
  );
}
