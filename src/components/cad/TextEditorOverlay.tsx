import { useEffect, useRef } from "react";
import type { Layer } from "@/domain/layers/model";
import { TextFields, type TextDefaults } from "./TextFields";

/**
 * Typing field of the text tool at the clicked screen point (docs/TEXT.md): the text plus every
 * text setting in one compact panel (user decision 31.10.2026). Enter makes a new line,
 * Ctrl+Enter or leaving the panel places the text, Esc cancels. Settings changed here stay the
 * tool defaults for the next text.
 */
export function TextEditorOverlay({
  position,
  content,
  onContent,
  settings,
  onSettings,
  layers,
  denominator,
  onCommit,
  onCancel,
}: {
  position: { x: number; y: number };
  content: string;
  onContent: (content: string) => void;
  settings: TextDefaults;
  onSettings: (settings: TextDefaults) => void;
  layers: readonly Layer[];
  denominator: number;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const done = useRef(false);
  useEffect(() => field.current?.focus(), []);
  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    if (commit) onCommit();
    else onCancel();
  };
  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Text eingeben"
      className="glass-panel-strong fixed z-50 w-[440px] max-w-[calc(100vw-16px)] space-y-1 rounded-lg border p-2 shadow-lg"
      style={{
        left: Math.max(8, Math.min(position.x + 8, window.innerWidth - 456)),
        top: Math.max(8, Math.min(position.y + 8, window.innerHeight - 320)),
      }}
      // Leaving the whole panel places the text; moving between its own controls does not.
      onBlur={(e) => {
        if (!panel.current?.contains(e.relatedTarget as Node | null)) finish(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          finish(false);
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          finish(true);
        }
      }}
    >
      <textarea
        ref={field}
        aria-label="Neuer Text"
        value={content}
        rows={Math.max(2, Math.min(6, content.split("\n").length))}
        onChange={(e) => onContent(e.target.value)}
        placeholder="Text eingeben"
        className="block w-full resize-none rounded border bg-background p-1 text-sm"
      />
      <div className="max-h-48 overflow-auto [&_label]:text-[11px] [&_section]:gap-2">
        <TextFields
          value={settings}
          onChange={onSettings}
          layers={layers}
          denominator={denominator}
        />
      </div>
      <p className="px-1 text-[10px] text-muted-foreground">
        Enter: neue Zeile · Strg+Enter oder daneben klicken: setzen · Esc: abbrechen
      </p>
    </div>
  );
}
