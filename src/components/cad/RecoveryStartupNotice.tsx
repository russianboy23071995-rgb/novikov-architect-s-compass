import { useEffect, useRef, useState } from "react";
import { startRecoveryOffer, type RecoveryOffer } from "@/application/project-files/recovery-offer";
import { browserRecoveryCatalog } from "@/interop/project-file/recovery-storage";
import { Button } from "@/components/ui/button";

export function RecoveryStartupNotice({
  context,
  onOpen,
}: {
  context: unknown;
  onOpen: () => void;
}) {
  const initialContext = useRef(context);
  const [offer, setOffer] = useState<RecoveryOffer | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (context !== initialContext.current) return;
    const query = startRecoveryOffer(browserRecoveryCatalog, setOffer);
    return query.dispose;
  }, [context]);
  if (context !== initialContext.current || dismissed || !offer || offer.kind === "empty")
    return null;
  return (
    <aside
      aria-label="Wiederherstellungsangebot"
      className="absolute right-3 top-14 z-40 max-w-sm space-y-2 rounded-lg border border-border bg-popover/95 p-3 text-xs text-foreground shadow-lg"
    >
      <p role="status">
        {offer.kind === "available" ? (
          <>
            Lokale Wiederherstellungsstände für {offer.projects.length} Projekt(e) verfügbar.
            Auswahl und Übernahme erst nach Prüfung und Bestätigung.
          </>
        ) : (
          <>
            Lokale Wiederherstellung konnte nicht geprüft werden. {offer.message} Du kannst
            weiterarbeiten.
          </>
        )}
      </p>
      <div className="flex gap-2">
        {offer.kind === "available" && (
          <Button
            size="sm"
            onClick={() => {
              setDismissed(true);
              onOpen();
            }}
          >
            Stände auswählen
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
          Weiterarbeiten
        </Button>
      </div>
    </aside>
  );
}
