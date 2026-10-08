import React from "react";
import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { tPairFixture } from "./t-pair-fixture";
import "../src/styles.css";
if (!import.meta.env.DEV) throw Error("Development diagnostic only");
const frame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
async function runUi() {
  const button = (name: string) => {
    const b = [
      ...document.querySelectorAll<HTMLButtonElement>("main button, main [role=button]"),
    ].find((b) => b.getAttribute("aria-label") === name || b.textContent?.trim() === name);
    if (!b) throw Error(`Missing ${name}`);
    b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  };
  const axis = () => document.querySelector<SVGLineElement>('[aria-label="Wandachse wall-1"]')!;
  const pointer = (type: string, x: number, y: number, shift = false) => {
    const svg = document.querySelector<SVGSVGElement>('svg[aria-label="BIM floor plan"]')!;
    const p = new DOMPoint(x, -y).matrixTransform(svg.getScreenCTM()!);
    svg.dispatchEvent(
      type === "click"
        ? new MouseEvent(type, {
            bubbles: true,
            clientX: p.x,
            clientY: p.y,
            button: 0,
            shiftKey: shift,
          })
        : new PointerEvent(type, {
            bubbles: true,
            clientX: p.x,
            clientY: p.y,
            pointerId: 1,
            pointerType: "mouse",
            shiftKey: shift,
          }),
    );
  };
  const walls = () => document.querySelectorAll('[aria-label^="Select wall "]').length;
  const initial = walls();
  const click = async (x: number, y: number, shift = false) => {
    pointer("pointerdown", x, y, shift);
    pointer("pointerup", x, y, shift);
    pointer("click", x, y, shift);
    await frame();
  };
  button("Wall tool");
  await frame();
  await click(-5, -5);
  pointer("pointermove", -2, -5);
  await frame();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true }));
  pointer("pointermove", -1, -4, true);
  await frame();
  await click(-1, -4, true);
  window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
  await frame();
  await click(-1, -1);
  await click(-4, -1);
  document
    .querySelector('svg[aria-label="BIM floor plan"]')!
    .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  await frame();
  if (walls() !== initial + 3) throw Error(`Expected three walls, got ${walls() - initial}`);
  button("Undo");
  await frame();
  if (walls() !== initial) throw Error("Chain undo failed");
  button("Redo");
  await frame();
  if (walls() !== initial + 3) throw Error("Redo failed");
  button("Wall tool");
  await frame();
  await click(-8, -8);
  pointer("pointermove", -6, -8);
  await frame();
  document
    .querySelector('svg[aria-label="BIM floor plan"]')!
    .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await frame();
  if (walls() !== initial + 3) throw Error("Cancel changed model");
  button("Wall tool");
  await frame();
  await click(-8, -8);
  pointer("pointermove", -6, -8);
  await frame();
  button("Select tool");
  await frame();
  if (walls() !== initial + 3) throw Error("Tool switch changed model");
  return "PASS: mouse/Shift, three segments, one Undo/Redo, Escape and tool switch";
}
const diagnostic = document.createElement("button");
diagnostic.textContent = "Maus/Shift testen";
diagnostic.style.cssText =
  "position:fixed;right:8px;bottom:40px;z-index:9999;background:white;color:black";
document.body.append(diagnostic);
diagnostic.onclick = async () => {
  diagnostic.disabled = true;
  try {
    diagnostic.textContent = await runUi();
  } catch (e) {
    diagnostic.textContent = String(e);
  } finally {
    diagnostic.disabled = false;
  }
};
const fixture = tPairFixture();
if (new URLSearchParams(location.search).has("free")) fixture.storey.wallTJunctions = [];
createRoot(document.getElementById("root")!).render(<CadWorkspace initialProject={fixture} />);
