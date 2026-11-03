import test from "node:test";
import assert from "node:assert/strict";
import { gesamtFixture } from "./gesamt-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { sectionDrawing } from "../src/rendering/viewport/section-drawing.ts";
import {
  drawSectionCanvas,
  imagePlacement,
  viewTransform,
  type SectionCanvasContext,
  type SectionCanvasStyle,
} from "../src/components/cad/section-canvas.ts";

// docs/performance/SECTION_CANVAS.md: the canvas of the section tab draws what the SVG drew,
// in the same order, with screen-pixel widths and dashes, in the same view box placement.

test("section canvas: view box placed like SVG xMidYMid meet, images follow zoom and pan", () => {
  // Wider than the canvas: fits the width, centred vertically.
  assert.deepEqual(viewTransform({ x: 0, y: 0, w: 10, h: 5 }, 200, 200), {
    scale: 20,
    x: 0,
    y: 50,
  });
  // Taller: fits the height, centred horizontally; the view origin moves to the top left.
  assert.deepEqual(viewTransform({ x: 2, y: -4, w: 5, h: 10 }, 200, 200), {
    scale: 20,
    x: 10,
    y: 80,
  });
  const view = { x: 0, y: 0, w: 10, h: 10 };
  assert.deepEqual(imagePlacement(view, view, 100, 100), { x: 0, y: 0, w: 100, h: 100 });
  // Zoomed in twice on the centre: the image doubles around the centre.
  assert.deepEqual(imagePlacement(view, { x: 2.5, y: 2.5, w: 5, h: 5 }, 100, 100), {
    x: -50,
    y: -50,
    w: 200,
    h: 200,
  });
  // Panned right by 1 m (10 px): the image moves left.
  assert.deepEqual(imagePlacement(view, { x: 1, y: 0, w: 10, h: 10 }, 100, 100), {
    x: -10,
    y: 0,
    w: 100,
    h: 100,
  });
});

type Op = { op: string; args: unknown[]; state: Record<string, unknown> };
function recorder() {
  const ops: Op[] = [];
  const state: Record<string, unknown> = { lineDash: [] };
  const ctx = new Proxy(
    {},
    {
      get:
        (_t, name: string) =>
        (...args: unknown[]) => {
          if (name === "setLineDash") state["lineDash"] = args[0];
          ops.push({ op: name, args, state: { ...state } });
        },
      set: (_t, name: string, value) => {
        state[name] = value;
        return true;
      },
    },
  ) as unknown as SectionCanvasContext;
  return { ctx, ops };
}
const style: SectionCanvasStyle = {
  colors: { background: "#fff", foreground: "#111", muted: "#888" },
  cut: { fill: "#777", fillOpacity: 0.55 },
  selection: "#0ff",
  hatch: 0.15,
  extent: { minY: -1, maxY: 14 },
};

test("section canvas: every view, storey line, cut and border in the SVG order", () => {
  const project = createProjectSnapshot(gesamtFixture(600));
  for (const section of project.sections!) {
    const drawing = sectionDrawing(project, section);
    const { ctx, ops } = recorder();
    const view = { x: -2, y: -15, w: drawing.width + 4, h: 17 };
    const size = { width: 800, height: 400, ratio: 2 };
    const selected = new Set([drawing.views[0]?.id ?? drawing.cuts[0]!.id]);
    drawSectionCanvas(ctx, drawing, view, size, style, selected);
    const strokes = ops.filter((o) => o.op === "stroke");
    // Per view one fill (two when selected), edges and dashed marks; per storey one dashed
    // line, per cut outline one stroke, two border lines.
    const viewStrokes = drawing.views.reduce(
      (n, v) => n + (v.edges.length ? 1 : 0) + (v.marks?.segments.length ? 1 : 0),
      0,
    );
    const cutStrokes = drawing.cuts.reduce(
      (n, c) => n + (c.loops.length ? 1 : 0) + c.open.length,
      0,
    );
    const layerStrokes = ops.filter(
      (o) => o.op === "stroke" && o.state["globalAlpha"] === 0.55,
    ).length;
    const layerDividers = drawing.cuts.filter((c) => c.layers).length;
    assert.equal(
      strokes.length,
      viewStrokes + drawing.levels.length + cutStrokes + 2 + layerStrokes + layerDividers,
      section.name,
    );
    // Widths and dashes are screen pixels times the device ratio.
    const levelStrokes = strokes.filter((o) => o.state["strokeStyle"] === "#888");
    assert.equal(levelStrokes.length, drawing.levels.length, section.name);
    for (const o of levelStrokes) {
      assert.deepEqual(o.state["lineDash"], [16, 8]);
      assert.equal(o.state["lineWidth"], 1.5);
    }
    // The first view is selected: its background, then the selection tint, before its edges.
    if (drawing.views[0]) {
      const fills = ops.filter((o) => o.op === "fill").slice(0, 2);
      assert.deepEqual(
        fills.map((o) => [o.state["fillStyle"], o.state["globalAlpha"]]),
        [
          ["#fff", 1],
          ["#0ff", 0.25],
        ],
        section.name,
      );
      if (drawing.views[0].edges.length) assert.equal(strokes[0]!.state["strokeStyle"], "#0ff");
    }
    // Every edge and mark segment is one move and one line, like the SVG subpaths.
    const segments = drawing.views.reduce(
      (n, v) => n + v.edges.length + (v.marks?.segments.length ?? 0),
      0,
    );
    const firstLevel = ops.findIndex((o) => o.op === "stroke" && o.state["strokeStyle"] === "#888");
    const moves = ops
      .slice(0, firstLevel < 0 ? ops.length : firstLevel)
      .filter((o) => o.op === "moveTo").length;
    // One move per view outline and per segment; the last one starts the first storey line.
    assert.equal(moves, segments + drawing.views.length + 1, section.name);
    // Cut walls with layers are clipped to their outline.
    assert.equal(
      ops.filter((o) => o.op === "clip" && o.args[0] === "evenodd").length,
      layerDividers,
      section.name,
    );
  }
});
