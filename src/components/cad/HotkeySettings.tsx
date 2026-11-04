import { useEffect, useState } from "react";
import { FloatingPanel } from "./FloatingPanel";
import {
  BROWSER_RESERVED_HOTKEYS,
  HOTKEY_COMMANDS,
  hotkeyLabel,
  resolvedHotkeys,
  type HotkeyCommand,
  type HotkeyOverrides,
} from "@/domain/hotkeys/model";
import { comboFromKey } from "@/application/hotkeys/keys";

/**
 * Edit → Tastenkürzel (docs/TASTENKUERZEL.md, B1): every command with its shortcut. A click on a
 * shortcut records the next key press; Escape stops recording. Changes go into the project
 * (one undo step each) and travel with it.
 */
/** Commands listed already, implemented with B3 (mirror). */
const SOON = new Set<HotkeyCommand>(["mirror"]);

export function HotkeySettings({
  open,
  onClose,
  hotkeys,
  onChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  hotkeys: HotkeyOverrides | undefined;
  /** null: back to the default. Throws a readable message when refused. */
  onChange: (command: HotkeyCommand, combo: string | null) => void;
  onReset: () => void;
}) {
  const [recording, setRecording] = useState<HotkeyCommand | null>(null);
  const [message, setMessage] = useState("");
  const map = resolvedHotkeys(hotkeys);
  useEffect(() => {
    if (!recording) return;
    const command = HOTKEY_COMMANDS.find((c) => c.id === recording)!;
    const modifierOnly = "modifierOnly" in command;
    const capture = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") return setRecording(null);
      const combo = comboFromKey(event);
      if (!combo) return;
      const isModifier = combo === "Ctrl" || combo === "Alt";
      // A modifier alone waits for the key unless the command is the copy switch.
      if (isModifier !== modifierOnly) return;
      try {
        onChange(recording, combo);
        setMessage(
          (BROWSER_RESERVED_HOTKEYS as readonly string[]).includes(combo)
            ? `${hotkeyLabel(combo)} behält der Browser für sich, die App erhält es nicht.`
            : "",
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Nicht möglich.");
      }
      setRecording(null);
    };
    window.addEventListener("keydown", capture, { capture: true });
    return () => window.removeEventListener("keydown", capture, { capture: true });
  }, [recording, onChange]);
  const groups = [...new Set(HOTKEY_COMMANDS.map((c) => c.group))];
  return (
    <FloatingPanel open={open} title="Tastenkürzel" onClose={onClose} width={460} height={640}>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <p className="text-xs text-muted-foreground">
          Auf ein Kürzel klicken und die neue Taste drücken (Esc bricht ab). Die Kürzel werden mit
          dem Projekt gespeichert. Entf löscht auch mit der Rücktaste, Wiederholen geht auch mit
          Strg+Umschalt+Z.
        </p>
        {message && (
          <p role="alert" className="rounded bg-destructive/10 p-2 text-xs text-destructive">
            {message}
          </p>
        )}
        {groups.map((group) => (
          <fieldset key={group} className="space-y-1">
            <legend className="font-medium">{group}</legend>
            {HOTKEY_COMMANDS.filter((c) => c.group === group).map((c) => {
              const changed = hotkeys?.[c.id] !== undefined;
              const reserved = (BROWSER_RESERVED_HOTKEYS as readonly string[]).includes(map[c.id]);
              return (
                <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{c.label}</span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Tastenkürzel ${c.label}`}
                      className={`min-w-28 rounded border px-2 py-1 text-xs ${recording === c.id ? "border-primary bg-primary/10" : "bg-background"} ${reserved ? "text-destructive" : ""}`}
                      title={reserved ? "Vom Browser belegt" : undefined}
                      onClick={() => {
                        setMessage("");
                        setRecording(recording === c.id ? null : c.id);
                      }}
                    >
                      {recording === c.id ? "Taste drücken…" : hotkeyLabel(map[c.id])}
                      {SOON.has(c.id) && recording !== c.id ? " (folgt)" : ""}
                    </button>
                    <button
                      type="button"
                      aria-label={`${c.label} auf Standard`}
                      disabled={!changed}
                      className="rounded px-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
                      title={`Standard: ${hotkeyLabel(c.default)}`}
                      onClick={() => {
                        try {
                          onChange(c.id, null);
                          setMessage("");
                        } catch (error) {
                          setMessage(error instanceof Error ? error.message : "Nicht möglich.");
                        }
                      }}
                    >
                      ↺
                    </button>
                  </span>
                </div>
              );
            })}
          </fieldset>
        ))}
        <button
          type="button"
          className="rounded border px-3 py-1 text-xs hover:bg-muted"
          disabled={!hotkeys || !Object.keys(hotkeys).length}
          onClick={() => {
            onReset();
            setMessage("");
          }}
        >
          Alle auf Standard
        </button>
      </div>
    </FloatingPanel>
  );
}
