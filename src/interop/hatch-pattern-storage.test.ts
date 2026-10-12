import test from "node:test";
import assert from "node:assert/strict";
import { browserHatchPatternStorage, subscribeHatchPatterns } from "./hatch-pattern-storage.ts";

test("library notifications include own writes, filter other storage and clean up subscriptions", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window"),
    target = new EventTarget();
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const fake = {
    localStorage,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: fake });
  try {
    let project = 0,
      catalog = 0;
    const stopProject = subscribeHatchPatterns(() => project++),
      stopCatalog = subscribeHatchPatterns(() => catalog++);
    browserHatchPatternStorage.write("sample");
    assert.equal(browserHatchPatternStorage.read(), "sample");
    assert.deepEqual([project, catalog], [1, 1]);
    const emit = (key: string | null, storageArea: unknown = localStorage) => {
      const event = new Event("storage");
      Object.defineProperties(event, { key: { value: key }, storageArea: { value: storageArea } });
      target.dispatchEvent(event);
    };
    emit("unrelated");
    emit("novikov.hatch-patterns.v1", {});
    assert.deepEqual([project, catalog], [1, 1]);
    emit("novikov.hatch-patterns.v1");
    emit(null);
    assert.deepEqual([project, catalog], [3, 3]);
    stopCatalog();
    browserHatchPatternStorage.write("again");
    assert.deepEqual([project, catalog], [4, 3]);
    stopProject();
    emit(null);
    assert.deepEqual([project, catalog], [4, 3]);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
