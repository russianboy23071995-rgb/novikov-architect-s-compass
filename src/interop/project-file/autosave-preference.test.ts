import test from "node:test";
import assert from "node:assert/strict";
import { readAutosavePreference, writeAutosavePreference } from "./autosave-preference.ts";
test("fresh profile defaults on; explicit choices survive a new read", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  assert.equal(readAutosavePreference(storage), true);
  writeAutosavePreference(storage, false);
  assert.equal(readAutosavePreference(storage), false);
  writeAutosavePreference(storage, true);
  assert.equal(readAutosavePreference(storage), true);
});
test("storage failure is surfaced instead of claiming a persisted preference", () => {
  const storage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
  };
  assert.throws(() => readAutosavePreference(storage), /blocked/);
  assert.throws(() => writeAutosavePreference(storage, false), /quota/);
});
