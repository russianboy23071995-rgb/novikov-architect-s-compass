# Browser baseline (A-01)

## Architecture audit (read-only, no browser required)

Run `node --experimental-strip-types benchmarks/architecture-audit.ts` at the
repository root. It calls the existing selection movement action for mixed
100/1000/5000-element fixtures and asserts object/value identity, base immutability,
changed contours on a stationary joined neighbour, and rejection when an unrelated
wall endpoint arrives at an already joined node. JSON is written to stdout.

This is a baseline diagnostic of the current implementation, not a future
requirement to keep reallocating all objects, a latency test, or a heap measurement.
Update the reallocation observations when the preview representation changes.
See [the architecture review](../docs/performance/ARCHITECTURE_REVIEW_2026-10-07.md)
and its captured `architecture-audit-2026-10-07.json` for scope and implications.

## Browser setup and measurements

Run `npm run benchmark:browser` and open
`http://127.0.0.1:8081/benchmarks/browser.html`. This separate development server
mounts the actual CadWorkspace; it never reads or replaces the user's project.
The diagnostic page is not a product route or a production benchmark.

Select 100, 1000 or 5000 elements and optional embedded image, then Load scenario.
Each ten elements include two connected walls, a window and seven lines (one
line is replaced by a reference for image cases). Image generation uses seeded
noise in a 1400x1400 canvas, encoded as a real PNG; fixtures remain below 10 MiB.
Image encoding and fixture construction are included only in fixture/load timing.

Measure core runs one warmup and 21 synchronous samples per operation, separated
by two animation frames. It calls actual Application actions and JSON boundaries
inside Chromium. Group preview moves up to 20 walls; wall preview creates a new
segment. Commit starts from the same history; Undo/Redo exercises one transition,
not 100 retained image edits. wallSolids measures the existing warm cache.

For selection measurements alternate Navigator Wall 2 and Wall 1 eleven times,
then Report. Save the textarea JSON. React Profiler durations include dev-only
render cost; event-to-two-rAF timings are paint opportunities, not GPU presentation
or OS input latency. React update samples also include incidental updates, so do
not equate them with isolated selection latency. Pointer samples over Navigator
are not an active drag-preview latency measurement. The core preview timings are
reported separately. JSON timing excludes filesystem dialogs and actual download.

Heap is an approximate, process-dependent Chromium JS heap observation; it is not
peak RSS, decoded-image GPU memory, or proof of asset duplication across history.
Cross-run GC and development instrumentation affect absolute results. One mount
sample is diagnostic only; P95 requires the repeated sample sets.

Before/after runs must use identical fixtures and the same browser/server/config.
Check selected property values, applied changes and Undo/Redo as separate functional
acceptance. Report missing measurement coverage explicitly rather than extrapolate.

## A-03 commit profile

Choose 5000 elements with Image, Load scenario, then Profile commit. Wait for
Commit profile complete and save Benchmark report. It uses the same 20-wall move
and compares the frozen pre-A03 commit with the current exported commit. One warmup,
21 rounds, alternating case order; no timing assertion in unit tests.

validateInclusive includes schema parsing, image base64 checking, geometry and wall
solids. wallSolidsCold receives a fresh shallow project root per call to bypass the
existing root-keyed cache; this is a separately measured subcost, not an extra cost
to add to validation. jsonCompareAndSize serializes both snapshots and checks their
UTF-8 sizes; modelOnlyCompare omits only visibility. Timing excludes React rendering
and frame waits around each synchronous call. Diagnostics update the status between
samples, so wall-clock run duration includes additional workspace renders.

The legacy implementation is kept only in benchmarks/commit-profile.ts. Do not
import it into the product. The public file serializer remains fully validated.

## Active movement profile (A-01/A-04)

Load a fresh fixture, wait for Loaded, then Profile movement. Do not interact with
the workspace during the run. Repeat for 100/1000/5000 with and without Image.
Movement complete means that all 21 recorded samples rendered the measured preview
and the subsequent cancellation, placement, single Undo and Redo checks passed.
Report contains the individual samples, phase totals/call counts and acceptance.
Reload before another run because the acceptance ends with a committed movement.

The driver uses the real Navigator buttons to select 20 walls, starts the real
On-Demand action and sends synthetic PointerEvent/MouseEvent inputs to the SVG.
It never invokes the Application movement action directly. Two standard wheel
steps zoom out before timing, leaving a visible empty area below the fixture.
Small fixtures may need an additional setup wheel step after their initial fit
settles; the report records that adjustment and the actual viewBox.
Every dispatched pointer is checked against the SVG bounds. Both event types use
the same rounded CSS coordinates. One warmup precedes 21 sequential targets on the same CSS-pixel path (6 px right,
3 px downward per sample, into the empty side of the fixture), outside the origin snap radius. World targets are recorded
through the resulting preview; CSS inputs and viewport are included. Initial fit
differs by fixture, so the same screen travel represents different metre distances.
The driver waits at least two animation frames and verifies the rendered wall
position against the last preview snapshot observed by the instrumentation.
If concurrent work has not reached the DOM, it waits additional frame pairs
(up to 30); elapsed time includes that wait, and missing renders fail the run.

Only the separate benchmark Vite configuration installs movement-instrumentation.
It wraps explicit functions in memory and fails if a source anchor no longer
matches. No production source is modified and no diagnostic module is imported
by the product build. React Profiler records commit count and render duration.

Phase timings are inclusive and nested: validation includes solids, selection
preview includes validation, precision preview may include selection preview.
Do not sum these phases or subtract independent medians to claim exclusive time.
Elapsed time runs from synthetic dispatch to a verified frame opportunity. It is a paint opportunity, not GPU presentation
or OS input latency. Synthetic clicks bypass hit testing, and sequential samples
do not measure event queue/coalescing under continuous hardware input. This focused
movement scenario does not close dense-snap, contour or peak-memory coverage.


The image-URL reuse comparison is recorded in
[IMAGE_URL_REUSE](../docs/performance/IMAGE_URL_REUSE.md), with after reports in
`docs/performance/image-url-2026-10-07/`. Use the unchanged movement protocol above.
The image is checked during fixture rendering before movement timing, so this
comparison measures warm reuse across preview copies, not cold import/decoding.


[Selection preview reuse](../docs/performance/SELECTION_PREVIEW_REUSE.md) records
the next comparison in `docs/performance/preview-reuse-2026-10-07/`. Each recorded
target now has one project-validation call. The driver/fixtures are unchanged;
final validate/commit calls intentionally still run full validation outside the
movement samples.
