import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SettingsSection = { id: string; label: string; content: ReactNode };

/** Shared settings body; the existing FloatingPanel owns window movement and closing. */
export function SettingsSections({ sections }: { sections: [SettingsSection, ...SettingsSection[]] }) {
  return (
    <Tabs defaultValue={sections[0].id} orientation="vertical" className="flex min-h-0 flex-1">
      <TabsList
        aria-label="Einstellungsbereiche"
        className="h-auto w-40 shrink-0 flex-col items-stretch justify-start gap-1 rounded-none border-r bg-muted/30 p-3"
      >
        {sections.map((section) => (
          <TabsTrigger
            key={section.id}
            value={section.id}
            className="min-h-8 justify-start whitespace-normal px-2 py-1.5 text-left text-xs"
          >
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="min-w-0 flex-1 overflow-y-auto p-5">
        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="m-0 space-y-4 text-xs">
            <h2 className="text-sm font-semibold">{section.label}</h2>
            {section.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
