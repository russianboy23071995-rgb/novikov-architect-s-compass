import { useEffect, useRef, useState } from "react";

/**
 * Typing field of the text tool at the clicked screen point (docs/TEXT.md, T1): Enter makes a
 * new line, Ctrl+Enter or leaving the field places the text, Esc cancels.
 */
export function TextEditorOverlay({
  position,
  onCommit,
  onCancel,
}: {
  position: { x: number; y: number };
  onCommit: (content: string) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const done = useRef(false);
  useEffect(() => field.current?.focus(), []);
  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    if (commit) onCommit(content);
    else onCancel();
  };
  return (
    <div
      className="glass-panel-strong fixed z-50 rounded-lg border p-1 shadow-lg"
      style={{
        left: Math.min(position.x + 8, window.innerWidth - 260),
        top: Math.min(position.y + 8, window.innerHeight - 120),
      }}
    >
      <textarea
        ref={field}
        aria-label="Neuer Text"
        value={content}
        rows={Math.max(2, Math.min(6, content.split("\n").length))}
        onChange={(e) => setContent(e.target.value)}
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
        onBlur={() => finish(true)}
        placeholder="Text eingeben"
        className="block w-60 resize-none rounded border bg-background p-1 text-sm"
      />
      <p className="px-1 text-[10px] text-muted-foreground">
        Enter: neue Zeile · Strg+Enter oder daneben klicken: setzen · Esc: abbrechen
      </p>
    </div>
  );
}
