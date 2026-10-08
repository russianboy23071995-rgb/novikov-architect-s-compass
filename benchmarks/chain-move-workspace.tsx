import React from "react";
import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { connectedFixture } from "./connected-fixture";
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
  const axis = () => document.querySelector<SVGLineElement>('[aria-label="Wandachse wall-0"]')!;
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
  for (const confirm of [false, true]) {
    button("Select wall wall-0");
    await frame();
    button("Wandachse Anfang");
    await frame();
    button("Element frei bewegen");
    await frame();
    pointer("pointermove", -1, 0);
    await frame();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true }));
    await frame();
    pointer("pointermove", -2, 0.5, true);
    await frame();
    if (
      Math.abs(Number(axis().getAttribute("y1"))) > 1e-8 ||
      Number(axis().getAttribute("x1")) >= 0
    )
      throw Error("Shift preview mismatch");
    if (confirm) {
      pointer("pointerdown", -2, 0.5, true);
      pointer("pointerup", -2, 0.5, true);
      pointer("click", -2, 0.5, true);
      await frame();
      button("Select wall wall-0");
      await frame();
    } else {
      button("Abbrechen");
      await frame();
    }
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
    await frame();
    if (!confirm && Number(axis().getAttribute("x1")) !== 0) throw Error("Cancel changed model");
  }
  const end = axis().getAttribute("x1");
  button("Undo");
  await frame();
  button("Select wall wall-0");
  await frame();
  if (Number(axis().getAttribute("x1")) !== 0) throw Error("Undo failed");
  button("Redo");
  await frame();
  button("Select wall wall-0");
  await frame();
  if (axis().getAttribute("x1") !== end) throw Error("Redo failed");
  button("3D");
  await frame();
  button("2D");
  await frame();
  return "PASS: synthetic DOM mouse/Shift, preview, cancel, click placement, Undo/Redo, 3D/2D switch";
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
const fixture = connectedFixture("chain", 3);
if (new URLSearchParams(location.search).has("free")) fixture.storey.wallTJunctions = [];
createRoot(document.getElementById("root")!).render(<CadWorkspace initialProject={fixture} />);
