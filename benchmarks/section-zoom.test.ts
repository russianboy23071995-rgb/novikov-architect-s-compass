import test from "node:test";
import assert from "node:assert/strict";
import { gesamtFixture } from "./gesamt-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { sectionDrawing } from "../src/rendering/viewport/section-drawing.ts";
import { segmentPath } from "../src/components/cad/section-paths.ts";
import { parsePath } from "../src/interop/pdf/svg-path.ts";

// docs/performance/SECTION_ZOOM.md: the edges of a view are one path; it draws exactly the
// former lines, one open subpath per edge, also for the PDF export that reads the SVG.
test("section zoom: one path per view draws every edge as its own subpath", () => {
  const project = createProjectSnapshot(gesamtFixture(600));
  let edges = 0;
  for (const section of project.sections!) {
    for (const view of sectionDrawing(project, section).views) {
      for (const segments of [view.edges, view.marks?.segments ?? []]) {
        const subpaths = parsePath(segmentPath(segments), [1, 0, 0, 1, 0, 0]);
        assert.equal(subpaths.length, segments.length);
        subpaths.forEach((sub, i) => {
          const [a, b] = segments[i]!;
          assert.equal(sub.closed, false);
          assert.deepEqual(sub.start, { x: a.x, y: 0 - a.y });
          assert.deepEqual(sub.segments, [{ kind: "line", to: { x: b.x, y: 0 - b.y } }]);
        });
        edges += segments.length;
      }
    }
  }
  assert.ok(edges > 1000);
  assert.equal(segmentPath([]), "");
});
