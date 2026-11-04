import { z } from "zod";

/**
 * Keyboard commands and their shortcuts (docs/TASTENKUERZEL.md, B1). The project stores only
 * the shortcuts the user changed (`hotkeys`, schema 58), so new commands keep their default.
 * A shortcut is written like "Ctrl+Shift+E": modifiers in the order Ctrl, Shift, Alt, then one
 * key (A–Z, 0–9, F1–F12 or a named key). The copy switch is one modifier alone ("Ctrl").
 */
export const HOTKEY_COMMANDS = [
  { id: "move", label: "Bewegen", group: "Bewegen", default: "Ctrl+E" },
  { id: "rotate", label: "Drehen", group: "Bewegen", default: "Ctrl+D" },
  { id: "mirror", label: "Spiegeln", group: "Bewegen", default: "Ctrl+M" },
  {
    id: "copy-toggle",
    label: "Kopie umschalten (während Bewegen, Drehen, Spiegeln)",
    group: "Bewegen",
    default: "Ctrl",
    modifierOnly: true,
  },
  { id: "copy", label: "Kopieren", group: "Bearbeiten", default: "Ctrl+C" },
  { id: "cut", label: "Ausschneiden", group: "Bearbeiten", default: "Ctrl+X" },
  { id: "paste", label: "Einfügen", group: "Bearbeiten", default: "Ctrl+V" },
  { id: "delete", label: "Löschen", group: "Bearbeiten", default: "Delete" },
  { id: "undo", label: "Rückgängig", group: "Bearbeiten", default: "Ctrl+Z" },
  { id: "redo", label: "Wiederholen", group: "Bearbeiten", default: "Ctrl+Y" },
  { id: "select-all", label: "Alles auswählen", group: "Bearbeiten", default: "Ctrl+A" },
  { id: "tool-select", label: "Auswahl", group: "Werkzeuge", default: "V" },
  { id: "tool-wall", label: "Wand", group: "Werkzeuge", default: "W" },
  { id: "tool-slab", label: "Decke", group: "Werkzeuge", default: "S" },
  { id: "tool-line", label: "Linie", group: "Werkzeuge", default: "L" },
  { id: "tool-hatch", label: "Schraffur", group: "Werkzeuge", default: "H" },
  { id: "tool-door", label: "Tür", group: "Werkzeuge", default: "T" },
] as const satisfies readonly {
  id: string;
  label: string;
  group: string;
  default: string;
  modifierOnly?: true;
}[];

export type HotkeyCommand = (typeof HOTKEY_COMMANDS)[number]["id"];
export const HOTKEY_COMMAND_IDS = HOTKEY_COMMANDS.map((c) => c.id) as [
  HotkeyCommand,
  ...HotkeyCommand[],
];

const NAMED_KEYS = [
  "Delete",
  "Backspace",
  "Insert",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Space",
  "Enter",
] as const;
const KEY = `(?:[A-Z0-9]|F(?:[1-9]|1[0-2])|${NAMED_KEYS.join("|")})`;
export const HOTKEY_COMBO = new RegExp(`^(?:Ctrl\\+)?(?:Shift\\+)?(?:Alt\\+)?${KEY}$`);
export const HOTKEY_MODIFIER = /^(?:Ctrl|Alt)$/;

/** Shortcuts the browser keeps for itself; a page never receives them (Chrome, Edge). */
export const BROWSER_RESERVED_HOTKEYS = [
  "Ctrl+T",
  "Ctrl+N",
  "Ctrl+W",
  "Ctrl+Shift+T",
  "Ctrl+Shift+N",
  "Ctrl+Shift+W",
] as const;

export const hotkeysSchema = z
  .record(z.enum(HOTKEY_COMMAND_IDS), z.string())
  .superRefine((map, ctx) => {
    for (const [id, combo] of Object.entries(map)) {
      const command = HOTKEY_COMMANDS.find((c) => c.id === id)!;
      const ok = "modifierOnly" in command ? HOTKEY_MODIFIER.test(combo) : HOTKEY_COMBO.test(combo);
      if (!ok)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Ungültiges Tastenkürzel für ${command.label}: ${combo}`,
        });
    }
  });
export type HotkeyOverrides = Partial<Record<HotkeyCommand, string>>;

/** Every command with its shortcut: the project's own or the default. */
export function resolvedHotkeys(
  overrides: HotkeyOverrides | undefined,
): Record<HotkeyCommand, string> {
  return Object.fromEntries(
    HOTKEY_COMMANDS.map((c) => [c.id, overrides?.[c.id] ?? c.default]),
  ) as Record<HotkeyCommand, string>;
}

/** Commands that share a shortcut (the copy switch only counts among modifiers). */
export function hotkeyConflicts(map: Record<HotkeyCommand, string>): HotkeyCommand[][] {
  const groups = new Map<string, HotkeyCommand[]>();
  for (const command of HOTKEY_COMMANDS) {
    const key = ("modifierOnly" in command ? "modifier:" : "") + map[command.id];
    groups.set(key, [...(groups.get(key) ?? []), command.id]);
  }
  return [...groups.values()].filter((ids) => ids.length > 1);
}

/** The shortcut as the user reads it: "Strg+E", "Entf". */
export function hotkeyLabel(combo: string): string {
  return combo
    .split("+")
    .map((part) =>
      part === "Ctrl"
        ? "Strg"
        : part === "Shift"
          ? "Umschalt"
          : part === "Delete"
            ? "Entf"
            : part === "Backspace"
              ? "Rücktaste"
              : part === "Insert"
                ? "Einfg"
                : part === "Space"
                  ? "Leertaste"
                  : part,
    )
    .join("+");
}
