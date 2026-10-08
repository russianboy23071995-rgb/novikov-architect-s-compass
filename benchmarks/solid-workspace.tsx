import React from "react";
import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { connectedFixture } from "./connected-fixture";
import "../src/styles.css";
if (!import.meta.env.DEV) throw Error("Diagnostic only");
createRoot(document.getElementById("root")!).render(
  <CadWorkspace initialProject={connectedFixture("chain", 3)} />,
);
const test = document.createElement("button");
test.textContent = "3D Kontext testen";
test.style.cssText =
  "position:fixed;right:10px;bottom:40px;z-index:9999;background:white;color:black";
document.body.append(test);
const frame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
const event = (c: HTMLCanvasElement, name: string) =>
  new Promise<void>((resolve, reject) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      c.removeEventListener(name, done);
      reject(Error(name + " timeout"));
    }, 5000);
    c.addEventListener(name, done, { once: true });
  });
test.onclick = async () => {
  test.disabled = true;
  try {
    const c = document.querySelector<HTMLCanvasElement>(
      'canvas[aria-label="3D walls with window openings"]',
    );
    if (!c) throw Error("Switch to 3D first");
    c.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await frame();
    const ext = c.getContext("webgl")!.getExtension("WEBGL_lose_context")!;
    let waiting = event(c, "webglcontextlost");
    ext.loseContext();
    await waiting;
    await frame();
    if (!document.querySelector('[role="alert"]')) throw Error("Missing lost-context notice");
    waiting = event(c, "webglcontextrestored");
    await new Promise((r) => setTimeout(r, 100));
    ext.restoreContext();
    await waiting;
    await frame();
    await frame();
    if (document.querySelector('[role="alert"]')) throw Error("Restoration failed");
    const gl = c.getContext("webgl")!,
      pixels = new Uint8Array(c.width * c.height * 4);
    // Trigger a fresh draw and capture inside its animation turn via the displayed canvas.
    c.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await frame();
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    if (gl.getError() !== gl.NO_ERROR) throw Error("WebGL error after restoration");
    test.textContent = "PASS: Kamera, Verlustmeldung und Wiederherstellung";
  } catch (e) {
    test.textContent = String(e);
  } finally {
    test.disabled = false;
  }
};
