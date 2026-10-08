import { continuousMovement } from "./continuous-movement";
import {
  takePreparations,
  startMovementSample,
  finishMovementSample,
  discardMovementSample,
  movementPreview,
  type MovementSample,
} from "./movement-trace";

const frame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value == null) throw new Error(message);
  return value;
}
function button(label: string) {
  return requireValue(
    [...document.querySelectorAll<HTMLButtonElement>("main button")].find(
      (b) => b.textContent?.trim() === label || b.getAttribute("aria-label") === label,
    ),
    `Missing button: ${label}`,
  );
}
const plan = () =>
  requireValue(
    document.querySelector<SVGSVGElement>('svg[aria-label="BIM floor plan"]'),
    "Missing plan",
  );
function pointer(type: string, x: number, y: number, shiftKey = false) {
  const svg = plan();
  const screen = new DOMPoint(x, -y).matrixTransform(
    requireValue(svg.getScreenCTM(), "Missing plan transform"),
  );
  const bounds = svg.getBoundingClientRect();
  if (
    screen.x < bounds.left ||
    screen.x > bounds.right ||
    screen.y < bounds.top ||
    screen.y > bounds.bottom
  )
    throw new Error(
      `Diagnostic pointer outside canvas: ${type} world=${x},${y} screen=${screen.x},${screen.y} rect=${bounds.x},${bounds.y},${bounds.width},${bounds.height}`,
    );
  const init = {
    bubbles: true,
    clientX: Math.round(screen.x),
    clientY: Math.round(screen.y),
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    shiftKey,
  };
  svg.dispatchEvent(type === "click" ? new MouseEvent(type, init) : new PointerEvent(type, init));
  return { clientX: init.clientX, clientY: init.clientY };
}
function worldOffset(dx: number, dy: number) {
  const matrix = requireValue(plan().getScreenCTM(), "Missing plan transform");
  const origin = new DOMPoint(0, 0).matrixTransform(matrix);
  const local = new DOMPoint(origin.x + dx, origin.y - dy).matrixTransform(matrix.inverse());
  return { x: local.x, y: -local.y };
}
async function selectWalls(count: number, includeWindows: boolean) {
  for (let i = 1; i <= count; i++) {
    const row = requireValue(
      [
        ...document.querySelectorAll<HTMLButtonElement>(
          '[aria-label="Project navigator"] button[aria-pressed]',
        ),
      ].find((b) => b.textContent?.startsWith(`Wall ${i} \u00b7`)),
      `Missing wall ${i}`,
    );
    row.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: i > 1 }));
    await frame();
  }
  let windowCount = 0;
  if (includeWindows) {
    const rows = [
      ...document.querySelectorAll<HTMLButtonElement>(
        '[aria-label="Project navigator"] button[aria-pressed]',
      ),
    ].filter((b) => b.textContent?.startsWith("Window "));
    for (const row of rows) {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));
      await frame();
    }
    windowCount = rows.length;
  }
  const selected = document.querySelectorAll(
    '[aria-label="Project navigator"] button[aria-pressed="true"]',
  );
  if (selected.length !== count + windowCount)
    throw new Error(`Expected ${count + windowCount} selected elements, found ${selected.length}`);
}
let renderedBodyOffset = { x: 0, y: 0 };
function wallStart() {
  // Recover the axis from the DOM body transform using the fixture offset.
  const wall = requireValue(
    document.querySelector('[aria-label="Select wall wall-1"]'),
    "Missing rendered wall",
  );
  const transform = wall.parentElement?.getAttribute("transform") ?? "";
  const match = requireValue(
    /translate\(([^ ]+) ([^)]+)\)/.exec(transform),
    `Unexpected wall transform: ${transform}`,
  );
  return {
    x: Number(match[1]) - renderedBodyOffset.x,
    y: -Number(match[2]) - renderedBodyOffset.y,
  };
}
function same(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y) < 1e-7;
}
async function begin(count: number, includeWindows: boolean) {
  await selectWalls(count, includeWindows);
  button("Auswahl frei bewegen").click();
  await frame();
  pointer("click", 0, 0);
  await frame();
  if (!document.querySelector("main")?.textContent?.includes("Klick platziert die Auswahl"))
    throw new Error("Movement did not enter target mode");
}
export async function runMovementProfile(
  checkGeometry?: (delta: { x: number; y: number }) => unknown,
  heldShift = false,
  selectedCount = 20,
  bodyOffset = { x: 0, y: 0 },
  includeWindows = false,
) {
  renderedBodyOffset = bodyOffset;
  takePreparations();
  const samples: MovementSample[] = [];
  // Use the real wheel handler to make room below the fixture, outside other walls.
  for (let i = 0; i < 2; i++) {
    const rect = plan().getBoundingClientRect();
    plan().dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: 300,
        clientX: Math.round(rect.left + rect.width / 2),
        clientY: Math.round(rect.top + rect.height / 2),
      }),
    );
    await frame();
  }
  const baseline = wallStart();
  if (!same(baseline, { x: 0, y: 0 }))
    throw new Error("Reload the fixture before profiling movement");
  try {
    await begin(selectedCount, includeWindows);
    // Small fixtures can settle their initial fit after the first wheel event.
    // Ensure the same 93px downward path fits; these setup frames are not timed.
    let extraZoomSteps = 0;
    for (; extraZoomSteps < 3; extraZoomSteps++) {
      const svg = plan(),
        rect = svg.getBoundingClientRect();
      const origin = new DOMPoint(0, 0).matrixTransform(
        requireValue(svg.getScreenCTM(), "Missing transform"),
      );
      if (rect.bottom - origin.y >= 98 && rect.right - origin.x >= 171) break;
      svg.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          deltaY: 300,
          clientX: Math.round(rect.left + rect.width / 2),
          clientY: Math.round(rect.top + rect.height / 2),
        }),
      );
      await frame();
    }
    const viewport = {
      width: innerWidth,
      height: innerHeight,
      viewBox: plan().getAttribute("viewBox"),
      extraZoomSteps,
    };
    if (heldShift)
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true }));
    // One warmup, then 21 changing pointer targets. No direct Application invocation.
    for (let i = 0; i < 22; i++) {
      startMovementSample();
      const point = worldOffset(40 + i * 6, -30 - i * 3);
      const input = pointer("pointermove", point.x, point.y, heldShift);
      await frame();
      // Concurrent render/effect work can outlive two frames. End only when the
      // latest observed preview has reached the actual DOM, with a bounded wait.
      for (let pending = 0; pending < 30; pending++) {
        const expected = movementPreview();
        if (expected && same(wallStart(), expected)) break;
        await frame();
      }
      const sample = finishMovementSample();
      if (
        !sample.previewStart ||
        !sample.reactCommits ||
        same(sample.previewStart, baseline) ||
        !same(wallStart(), sample.previewStart)
      )
        throw new Error(
          `Preview was not rendered in sample ${i}: expected=${JSON.stringify(sample.previewStart)}, actual=${JSON.stringify(wallStart())}, commits=${sample.reactCommits}`,
        );
      if (i) samples.push({ ...sample, input });
    }
    const continuous = await continuousMovement((i) => {
      const point = worldOffset(100 + 60 * Math.sin(i / 12), -50 - 25 * Math.cos(i / 12));
      pointer("pointermove", point.x, point.y, heldShift);
    });
    if (!continuous.trace.previewStart || !same(wallStart(), continuous.trace.previewStart))
      throw new Error("Continuous input did not reach the latest preview");
    if (heldShift) window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
    const preview = wallStart();
    const geometryPreview = checkGeometry?.(preview);
    // Untimed UI acceptance: lock a horizontal direction, move far away, release.
    const horizontal = worldOffset(60, 0),
      diagonal = worldOffset(60, -60);
    pointer("pointermove", horizontal.x, horizontal.y);
    await frame();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true }));
    await frame();
    pointer("pointermove", horizontal.x, horizontal.y, true);
    await frame();
    pointer("pointermove", diagonal.x, diagonal.y, true);
    await frame();
    if (Math.abs(wallStart().y) > 1e-7) throw new Error("Shift did not retain direction");
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
    pointer("pointermove", diagonal.x, diagonal.y);
    await frame();
    if (Math.abs(wallStart().y) < 1e-7) throw new Error("Shift direction not released");
    const key = () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
      );
    const input = (label: string) =>
      requireValue(document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`), label);
    const lengthInput = input("Bewegungslänge (m)"),
      angleInput = input("Bewegungswinkel (Grad)");
    key();
    await frame();
    if (document.activeElement !== lengthInput) throw new Error("First Tab did not focus length");
    key();
    await frame();
    if (document.activeElement !== angleInput) throw new Error("Second Tab did not focus angle");
    const set = (element: HTMLInputElement, value: string) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        element,
        value,
      );
      element.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set(angleInput, "90");
    await frame();
    set(lengthInput, "2");
    await frame();
    if (!same(wallStart(), { x: 0, y: 2 })) throw new Error("Numeric preview mismatch");
    checkGeometry?.(wallStart());
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await frame();
    if (!same(wallStart(), baseline) || !button("Undo").disabled)
      throw new Error("Cancel changed the model/history");
    await begin(selectedCount, includeWindows);
    const commitPoint = worldOffset(110, -65);
    pointer("pointermove", commitPoint.x, commitPoint.y);
    await frame();
    const target = wallStart();
    pointer("click", commitPoint.x, commitPoint.y);
    await frame();
    if (!same(wallStart(), target) || same(target, baseline) || button("Undo").disabled)
      throw new Error(
        `Commit mismatch: preview=${JSON.stringify(target)}, actual=${JSON.stringify(wallStart())}, undoDisabled=${button("Undo").disabled}`,
      );
    const geometryCommit = checkGeometry?.(target);
    button("Undo").click();
    await frame();
    if (!same(wallStart(), baseline) || !button("Undo").disabled)
      throw new Error("Undo did not restore one atomic move");
    button("Redo").click();
    await frame();
    if (!same(wallStart(), target)) throw new Error("Redo failed");
    return {
      samples,
      continuous,
      preparationMs: takePreparations(),
      fullPathComparison: { preview: geometryPreview, commit: geometryCommit },
      acceptance: {
        shiftRetainedAndReleased: true,
        tabLengthAngle: true,
        numericPreview: { degrees: 90, metres: 2 },
        selectedWalls: selectedCount,
        explicitlySelectedWindows: includeWindows,
        preview,
        cancelled: true,
        committed: target,
        undo: true,
        redo: true,
      },
      syntheticPointer: true,
      heldShift,
      viewport,
    };
  } finally {
    if (heldShift) window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
    discardMovementSample();
  }
}
