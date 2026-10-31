import { FloatingPanel } from "./FloatingPanel";
import { SettingsSections, type SettingsSection } from "./SettingsSections";

/**
 * The settings window every tool gets (docs/EINSTELLUNGSFENSTER.md, AGENTS.md): opened by a
 * double click on the tool button (defaults for new elements) or on an element (exactly that
 * element). The bar above keeps the frequent settings; this window holds all of them and grows
 * with later settings. Contents come from the workspace so bar and window share one field set.
 */
export function ToolSettingsWindow({
  title,
  subtitle,
  sections,
  onClose,
}: {
  title: string;
  subtitle: string;
  sections: [SettingsSection, ...SettingsSection[]];
  onClose: () => void;
}) {
  return (
    <FloatingPanel open title={title} onClose={onClose} width={760} height={460}>
      <p className="border-b px-4 py-2 text-xs text-muted-foreground" aria-label="Bearbeitet">
        {subtitle}
      </p>
      <SettingsSections sections={sections} />
    </FloatingPanel>
  );
}
