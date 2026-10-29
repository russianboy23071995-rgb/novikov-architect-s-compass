import type { RecoveryOffer } from "@/application/project-files/recovery-offer";
import { Button } from "@/components/ui/button";

/**
 * Compact recovery offer (text line, button line) at the bottom left of the first view (user decision
 * 29.10.2026): same choice as before, the explanation moves into the tooltip. Autosave
 * still waits for „Stände auswählen“ or „Weiterarbeiten“, so the line never hides by itself.
 */
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
  const detail =
    offer.kind === "available"
      ? `Lokale Wiederherstellungsstände für ${offer.projects.length} Projekt(e) verfügbar. Auswahl und Übernahme erst nach Prüfung und Bestätigung. Die Autosicherung wartet bis zur Wiederaufnahme oder „Weiterarbeiten“.`
      : `Lokale Wiederherstellung konnte nicht geprüft werden. ${offer.message} Du kannst weiterarbeiten.`;
  return (
    <aside
      aria-label="Wiederherstellungsangebot"
      title={detail}
      className="flex max-w-[16rem] flex-col items-start gap-1 rounded border border-border bg-popover/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-md"
    >
      <span role="status" aria-description={detail}>
        {offer.kind === "available"
          ? `Wiederherstellung verfügbar (${offer.projects.length}) · Autosicherung wartet`
          : "Wiederherstellung nicht prüfbar"}
      </span>
      <span className="flex gap-1">
        {offer.kind === "available" && (
          <Button size="sm" className="h-5 px-2 text-[10px]" onClick={onOpen}>
            Stände auswählen
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-5 px-2 text-[10px]" onClick={onContinue}>
          Weiterarbeiten
        </Button>
      </span>
    </aside>
  );
}
