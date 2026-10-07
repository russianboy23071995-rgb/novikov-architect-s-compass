import {
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
function pointer(type: string, x: number, y: number) {
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
async function selectWalls() {
  for (let i = 1; i <= 20; i++) {
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
  const selected = document.querySelectorAll(
    '[aria-label="Project navigator"] button[aria-pressed="true"]',
  );
  if (selected.length !== 20)
    throw new Error(`Expected 20 selected walls, found ${selected.length}`);
}
function wallStart() {
  // The rendered physical body has zero lateral offset in this fixture.
  const wall = requireValue(
    document.querySelector('[aria-label="Select wall wall-1"]'),
    "Missing rendered wall",
  );
  const transform = wall.parentElement?.getAttribute("transform") ?? "";
  const match = requireValue(
    /translate\(([^ ]+) ([^)]+)\)/.exec(transform),
    `Unexpected wall transform: ${transform}`,
  );
  return { x: Number(match[1]), y: -Number(match[2]) };
}
function same(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y) < 1e-7;
}
async function begin() {
  await selectWalls();
  button("Auswahl frei bewegen").click();
  await frame();
  pointer("click", 0, 0);
  await frame();
  if (!document.querySelector("main")?.textContent?.includes("Klick platziert die Auswahl"))
    throw new Error("Movement did not enter target mode");
}
export async function runMovementProfile() {
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
    await begin();
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
    // One warmup, then 21 changing pointer targets. No direct Application invocation.
    for (let i = 0; i < 22; i++) {
      startMovementSample();
      const point = worldOffset(40 + i * 6, -30 - i * 3);
      const input = pointer("pointermove", point.x, point.y);
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
    const preview = wallStart();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await frame();
    if (!same(wallStart(), baseline) || !button("Undo").disabled)
      throw new Error("Cancel changed the model/history");
    await begin();
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
    button("Undo").click();
    await frame();
    if (!same(wallStart(), baseline) || !button("Undo").disabled)
      throw new Error("Undo did not restore one atomic move");
    button("Redo").click();
    await frame();
    if (!same(wallStart(), target)) throw new Error("Redo failed");
    return {
      samples,
      acceptance: {
        selectedWalls: 20,
        preview,
        cancelled: true,
        committed: target,
        undo: true,
        redo: true,
      },
      syntheticPointer: true,
      viewport,
    };
  } finally {
    discardMovementSample();
  }
}
