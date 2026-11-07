import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { comboFromKey, commandForKey, isCopyToggle, resetHotkeys, setHotkey } from "./keys.ts";
import {
  HOTKEY_COMMANDS,
  hotkeyConflicts,
  hotkeyLabel,
  resolvedHotkeys,
} from "../../domain/hotkeys/model.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { addObject } from "../objects/actions.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { copyTransformed } from "../selection/copy-transform.ts";
import { storeyOf } from "../../domain/storeys/access.ts";

// docs/TASTENKUERZEL.md, B1.
const key = (
  k: string,
  mods: Partial<Record<"ctrl" | "shift" | "alt" | "meta", boolean>> = {},
) => ({
  key: k,
  ctrlKey: !!mods.ctrl,
  shiftKey: !!mods.shift,
  altKey: !!mods.alt,
  metaKey: !!mods.meta,
});

test("keys: presses become shortcuts; Cmd counts as Ctrl; modifiers alone are the copy switch", () => {
  assert.equal(comboFromKey(key("e", { ctrl: true })), "Ctrl+E");
  assert.equal(comboFromKey(key("E", { ctrl: true, shift: true })), "Ctrl+Shift+E");
  assert.equal(comboFromKey(key("d", { meta: true })), "Ctrl+D");
  assert.equal(comboFromKey(key("Delete")), "Delete");
  assert.equal(comboFromKey(key("F5")), "F5");
  assert.equal(comboFromKey(key("Control", { ctrl: true })), "Ctrl");
  assert.equal(comboFromKey(key("Shift", { shift: true })), null);
  assert.equal(comboFromKey(key("ä")), null);
  assert.equal(hotkeyLabel("Ctrl+Shift+Delete"), "Strg+Umschalt+Entf");
});

test("defaults: move Ctrl+E, rotate Ctrl+D, mirror Ctrl+M, tools by letter, no two alike", () => {
  const map = resolvedHotkeys(undefined);
  assert.equal(map.move, "Ctrl+E");
  assert.equal(map.rotate, "Ctrl+D");
  assert.equal(map.mirror, "Ctrl+M");
  assert.equal(map["copy-toggle"], "Ctrl");
  assert.deepEqual(hotkeyConflicts(map), []);
  assert.equal(commandForKey(undefined, key("e", { ctrl: true })), "move");
  assert.equal(commandForKey(undefined, key("w")), "tool-wall");
  assert.equal(commandForKey(undefined, key("Backspace")), "delete");
  assert.equal(commandForKey(undefined, key("z", { ctrl: true, shift: true })), "redo");
  assert.equal(commandForKey(undefined, key("q")), null);
  assert.ok(isCopyToggle(undefined, key("Control", { ctrl: true })));
  assert.ok(!isCopyToggle(undefined, key("e", { ctrl: true })));
  assert.equal(HOTKEY_COMMANDS.length, 17);
});

test("change: own shortcut stored in the project, a taken one refused, default not stored", () => {
  const p = createStandardProject("p", "eg", "og");
  const changed = setHotkey(p, "move", "Ctrl+Shift+M");
  assert.deepEqual(changed.hotkeys, { move: "Ctrl+Shift+M" });
  assert.equal(commandForKey(changed.hotkeys, key("M", { ctrl: true, shift: true })), "move");
  assert.equal(commandForKey(changed.hotkeys, key("e", { ctrl: true })), null);
  assert.throws(() => setHotkey(p, "move", "Ctrl+C"), /schon „Kopieren“/);
  assert.equal(setHotkey(changed, "move", "Ctrl+E").hotkeys, undefined);
  assert.equal(setHotkey(changed, "move", null).hotkeys, undefined);
  const alt = setHotkey(p, "copy-toggle", "Alt");
  assert.ok(isCopyToggle(alt.hotkeys, key("Alt", { alt: true })));
  assert.equal(resetHotkeys(alt).hotkeys, undefined);
  // Checked by the schema: no malformed shortcut, no unknown command, no two alike.
  assert.throws(() => validateProject({ ...p, hotkeys: { move: "Ctrl+E+E" } }));
  assert.throws(() => validateProject({ ...p, hotkeys: { fly: "F2" } }));
  assert.throws(() => validateProject({ ...p, hotkeys: { "copy-toggle": "Ctrl+E" } }));
  assert.throws(
    () => validateProject({ ...p, hotkeys: { move: "Ctrl+D" } }),
    /dasselbe Tastenkürzel/,
  );
});

test("schema 58: shortcuts travel with the file; v57 files refuse them and load with defaults", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 65);
  const p = setHotkey(createStandardProject("p", "eg", "og"), "rotate", "Ctrl+Shift+D");
  assert.deepEqual(readProjectFile(serializeProject(p)).hotkeys, { rotate: "Ctrl+Shift+D" });
  const stored = JSON.parse(serializeProject(p));
  assert.throws(() => loadProjectData({ ...stored, schemaVersion: 57 }));
  const plain = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  const loaded = loadProjectData({ ...plain, schemaVersion: 57 });
  assert.equal(loaded.schemaVersion, 65);
  assert.equal(loaded.hotkeys, undefined);
});

test("copy move: the original stays, a copy with a new id sits at the target, one change", () => {
  let p = createStandardProject("p", "eg", "og");
  p = addObject(p, { id: "tisch", catalogId: "table", position: { x: 1, y: 1 } });
  const targets = [{ kind: "object", id: "tisch" }] as const;
  const moved = prepareTranslation(p, ["tisch"]).materialize(p, { x: 2, y: 0 });
  const result = copyTransformed(p, moved, targets, (kind) => `${kind}-neu`);
  const objects = storeyOf(result.project).objects!;
  assert.deepEqual(
    objects.map((o) => [o.id, o.position.x]),
    [
      ["tisch", 1],
      ["object-neu", 3],
    ],
  );
  assert.deepEqual(result.targets, [{ kind: "object", id: "object-neu" }]);
});
