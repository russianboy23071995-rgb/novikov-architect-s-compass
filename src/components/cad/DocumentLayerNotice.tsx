import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Project } from "@/domain/project/schema";

export type DocumentLayerActivation = { base: Project; documentId: string; layerIds: string[] };
/** Announce confirmed element placement in the original Abbild, never layer creation/load/undo. */
export function DocumentLayerNotice({
  project,
  activeDocumentId,
  activation,
}: {
  project: Project;
  activeDocumentId: string | null;
  activation: DocumentLayerActivation;
}) {
  const [dismissed, setDismissed] = useState(false);
  const layers = project.layers.filter((l) => activation.layerIds.includes(l.id));
  const document = project.drawingDocuments?.find((d) => d.id === activation.documentId);
  const confirmed =
    project.id === activation.base.id &&
    activeDocumentId === activation.documentId &&
    layers.length > 0 &&
    !!document &&
    activation.layerIds.every((id) => !document.hiddenLayerIds.includes(id));
  useEffect(() => {
    if (!confirmed) {
      setDismissed(true);
      return;
    }
    const timer = window.setTimeout(() => setDismissed(true), 10000);
    return () => window.clearTimeout(timer);
  }, [confirmed]);
  if (!confirmed || dismissed) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute right-3 top-14 z-40 flex max-w-sm gap-3 rounded-lg border border-border bg-popover/95 p-3 text-xs text-foreground shadow-lg backdrop-blur"
    >
      <p>
        Im Abbild „{document!.name}“ wurde die Ebene „{layers.map((l) => l.name).join(", ")}“ als
        sichtbar aktiviert. Änderungen sind in den Abbildeinstellungen möglich.
      </p>
      <button
        type="button"
        aria-label="Ebenenhinweis schließen"
        onClick={() => setDismissed(true)}
        className="h-5 shrink-0 rounded hover:bg-accent"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
