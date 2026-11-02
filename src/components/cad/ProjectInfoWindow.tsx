import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { ProjectInfo } from "@/domain/views/layouts";
import { FloatingPanel } from "./FloatingPanel";

const FIELDS: readonly { key: keyof ProjectInfo; label: string; placeholder: string }[] = [
  { key: "name", label: "Projektname", placeholder: "{Projektname}" },
  { key: "client", label: "Bauherr", placeholder: "{Bauherr}" },
  { key: "address", label: "Projektadresse", placeholder: "{Projektadresse}" },
  { key: "author", label: "Planverfasser", placeholder: "{Planverfasser}" },
];

/**
 * Window „Projektinformationen“ (Organisation, docs/PLANKOPF.md, AT2): what the title block's
 * automatic texts of the project group show on every sheet.
 */
export function ProjectInfoWindow({
  project,
  onApply,
  onClose,
}: {
  project: Project;
  /** Applies the information; throws with a message when it is refused. */
  onApply: (info: ProjectInfo) => void;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<ProjectInfo>(project.projectInfo ?? {});
  const [error, setError] = useState("");
  return (
    <FloatingPanel
      centered
      open
      title="Projektinformationen"
      width={440}
      height={420}
      onClose={onClose}
    >
      <form
        className="flex min-h-0 flex-1 flex-col gap-3 p-3 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onApply(info);
            onClose();
          } catch (cause) {
            setError((cause as Error).message);
          }
        }}
      >
        <p className="text-muted-foreground">
          Diese Angaben erscheinen über die automatischen Texte im Plankopf jedes Blatts.
        </p>
        {FIELDS.map((f) => (
          <label key={f.key}>
            {f.label} <span className="text-muted-foreground">{f.placeholder}</span>
            <input
              aria-label={f.label}
              maxLength={f.key === "address" ? 300 : 200}
              className="w-full rounded border bg-popover p-1"
              value={info[f.key] ?? ""}
              onChange={(e) => setInfo({ ...info, [f.key]: e.target.value })}
            />
          </label>
        ))}
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
            Übernehmen
          </button>
        </div>
      </form>
    </FloatingPanel>
  );
}
