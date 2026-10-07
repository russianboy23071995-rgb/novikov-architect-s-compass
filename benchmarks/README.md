# Browser baseline (A-01)

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
