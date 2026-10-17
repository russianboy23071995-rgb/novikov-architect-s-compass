import type { RecoveryOffer } from "@/application/project-files/recovery-offer";
import { Button } from "@/components/ui/button";

export function RecoveryStartupNotice({
  offer,
  onContinue,
  onOpen,
}: {
  offer: RecoveryOffer | null;
  onContinue: () => void;
  onOpen: () => void;
}) {
  if (!offer || offer.kind === "empty") return null;
  return (
    <aside
      aria-label="Wiederherstellungsangebot"
      className="absolute right-3 top-14 z-40 max-w-sm space-y-2 rounded-lg border border-border bg-popover/95 p-3 text-xs text-foreground shadow-lg"
    >
      <p role="status">
        {offer.kind === "available" ? (
          <>
            Lokale Wiederherstellungsstände für {offer.projects.length} Projekt(e) verfügbar.
            Auswahl und Übernahme erst nach Prüfung und Bestätigung. Die Autosicherung wartet bis
            zur Wiederaufnahme oder „Weiterarbeiten“.
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
              onOpen();
            }}
          >
            Stände auswählen
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onContinue}>
          Weiterarbeiten
        </Button>
      </div>
    </aside>
  );
}
