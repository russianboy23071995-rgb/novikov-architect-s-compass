import {
  HOTKEY_COMBO,
  HOTKEY_COMMANDS,
  hotkeyConflicts,
  resolvedHotkeys,
  type HotkeyCommand,
  type HotkeyOverrides,
} from "../../domain/hotkeys/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";

type KeyInput = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">;

const NAMED: Record<string, string> = {
  Delete: "Delete",
  Backspace: "Backspace",
  Insert: "Insert",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  " ": "Space",
  Enter: "Enter",
};

/**
 * The shortcut of a key press ("Ctrl+E"), or null for a key that cannot be one. Cmd counts as
 * Ctrl (macOS). A modifier alone gives "Ctrl" or "Alt" for the copy switch.
 */
export function comboFromKey(event: KeyInput): string | null {
  if (event.key === "Control" || event.key === "Meta") return "Ctrl";
  if (event.key === "Alt") return "Alt";
  if (event.key === "Shift") return null;
  const key =
    NAMED[event.key] ??
    (/^F(?:[1-9]|1[0-2])$/.test(event.key)
      ? event.key
      : event.key.length === 1 && /[a-z0-9]/i.test(event.key)
        ? event.key.toUpperCase()
        : null);
  if (!key) return null;
  const combo = [
    event.ctrlKey || event.metaKey ? "Ctrl" : "",
    event.shiftKey ? "Shift" : "",
    event.altKey ? "Alt" : "",
    key,
  ]
    .filter(Boolean)
    .join("+");
  return HOTKEY_COMBO.test(combo) ? combo : null;
}

/** The command a key press runs with the project's shortcuts, or null. Fixed extras kept from
 * before B1: Backspace deletes and Ctrl+Shift+Z redoes, unless assigned to another command. */
export function commandForKey(
  overrides: HotkeyOverrides | undefined,
  event: KeyInput,
): HotkeyCommand | null {
  const combo = comboFromKey(event);
  if (!combo) return null;
  const map = resolvedHotkeys(overrides);
  const hit = HOTKEY_COMMANDS.find((c) => !("modifierOnly" in c) && map[c.id] === combo);
  if (hit) return hit.id;
  if (combo === "Backspace") return "delete";
  if (combo === "Ctrl+Shift+Z") return "redo";
  return null;
}

/** Whether a key press is the copy switch (a modifier alone, docs/TASTENKUERZEL.md). */
export function isCopyToggle(overrides: HotkeyOverrides | undefined, event: KeyInput): boolean {
  return (
    comboFromKey(event) === resolvedHotkeys(overrides)["copy-toggle"] &&
    (event.key === "Control" || event.key === "Meta" || event.key === "Alt")
  );
}

/**
 * One checked change of a shortcut (one undo step). A shortcut back at its default is no longer
 * stored; one another command uses is refused with both names.
 */
export function setHotkey(project: Project, command: HotkeyCommand, combo: string | null): Project {
  const overrides: HotkeyOverrides = { ...(project.hotkeys ?? {}) };
  const definition = HOTKEY_COMMANDS.find((c) => c.id === command)!;
  if (combo === null || combo === definition.default) delete overrides[command];
  else overrides[command] = combo;
  const conflict = hotkeyConflicts(resolvedHotkeys(overrides)).find((ids) => ids.includes(command));
  if (conflict) {
    const other = HOTKEY_COMMANDS.find((c) => c.id === conflict.find((id) => id !== command))!;
    throw new Error(`Dieses Tastenkürzel hat schon „${other.label}“.`);
  }
  return replaceProjectHotkeys(project, overrides);
}

/** All shortcuts back to their defaults (one undo step). */
export function resetHotkeys(project: Project): Project {
  return replaceProjectHotkeys(project, {});
}

function replaceProjectHotkeys(project: Project, overrides: HotkeyOverrides): Project {
  const { hotkeys: _old, ...rest } = project;
  return validateLike(
    project,
    Object.keys(overrides).length ? { ...rest, hotkeys: overrides } : rest,
  );
}
