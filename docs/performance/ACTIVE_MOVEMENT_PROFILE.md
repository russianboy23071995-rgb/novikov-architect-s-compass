# Active group-movement browser profile - 2026-10-07

Base: main `c4a44c3`, PR168 merged. This step measures the existing shared movement
path; it does not optimize or change production behavior.

## Method

Chromium 154 on Windows, 1280 x 720 CSS viewport, Vite development server. Same
seeded 100/1000/5000-element fixtures as [A-01](P0_BROWSER_BASELINE.md), with/without
PNG (up to 9.33 MiB). CPU/RAM configuration was not obtained. No build/test job ran
during measured samples. One warmup and 21 recorded sequential movement events per
case. Median and nearest-rank P95; no production SLA or cross-machine claim.

The development-only driver selects 20 walls through Navigator, invokes the actual
On-Demand movement, picks its origin and dispatches synthetic DOM pointer events.
It never calls the movement Application action directly. Normal wheel handlers make
room below the fixture; actual viewBox and CSS coordinates are included in reports.
The path moves 6 CSS px right and 3 px down per sample, outside the origin snap
radius and into empty model space. All dispatched coordinates must stay inside the
SVG bounds. Setup and selection time are excluded. Each sample waits at least two
frames and verifies rendered first-wall position against the latest observed preview;
additional frame pairs (bounded to 30) wait for pending React work if necessary.

[Rerun instructions](../../benchmarks/README.md) and [individual reports](movement-2026-10-07/).
Reports include all samples and call counts. Small cases were completed after adding
a conditional setup-zoom safeguard; larger cases had already passed the same pointer
bounds checks. Their recorded viewBoxes document the actual framing. Failed setup
iterations (pixel rounding, out-of-bounds path, or a collision with existing joins)
are excluded and are not counted as successful performance samples.

## Results

All cells: median / P95 milliseconds. Phase durations are inclusive and nested.
React render includes work called during render; project validation includes wall
solids. Do not add columns or subtract independent medians as exclusive costs.

| Elements | PNG | Dispatch to verified frame | Snap resolver | Full validation, total | Image URL check/decode | React render |
|---:|:---:|---:|---:|---:|---:|---:|
| 100 | plain | 34.5 / 38.7 | 0.2 / 0.3 | 7.1 / 9.2 | 0.0 / 0.0 | 20.6 / 23.5 |
| 100 | image | 1050.0 / 1081.5 | 0.2 / 0.2 | 429.2 / 440.7 | 545.6 / 577.2 | 1031.5 / 1059.3 |
| 1000 | plain | 203.7 / 301.5 | 0.1 / 0.2 | 68.9 / 92.7 | 0.0 / 0.0 | 139.6 / 243.6 |
| 1000 | image | 1290.6 / 1368.2 | 0.2 / 0.3 | 500.6 / 524.0 | 533.8 / 600.4 | 1222.1 / 1292.6 |
| 5000 | plain | 1184.2 / 1230.2 | 0.2 / 0.2 | 405.5 / 434.4 | 0.0 / 0.0 | 930.8 / 967.6 |
| 5000 | image | 2085.0 / 2218.3 | 0.1 / 0.3 | 762.4 / 788.9 | 533.9 / 555.7 | 1822.4 / 1948.1 |

Every recorded event invoked full project validation twice. `useToolInteraction`
evaluates the precision preview; `BimPlan` also requests the adapter's previewProject
for display. Both reach previewSelectionMove and validateProject. This is a measured
redundancy candidate, not a reason to weaken final commit or stale-context checks.

A second significant cost appears with the unchanged PNG: validateProject creates
new asset objects for each preview. checkedImageUrl caches by asset-object identity,
so it repeats base64 decoding, byte conversion and header checking. The image URL
phase costs about 534 ms median in the 5000-image case despite unchanged image data.
The existing cache is present; the issue is reuse across equivalent asset copies.

Snap is cheap on this specific sparse, empty-space path. It is not evidence that
all dense-snap or hover-acquisition cases are fast. At 5000 plain elements the wall
solids phase totals about 371 ms median (including calls nested in validation); plan
outlines about 41 ms. Rendering also grows, so caching one phase cannot remove the
whole latency. No performance improvement is claimed by this measurement PR.

## Acceptance and limits

All six scenarios passed: 20 selected walls; 21 nonzero rendered previews; Escape
restores the original displayed first wall without a history entry; final placement
matches its preview; one Undo restores the original, and Redo restores the move.
The driver observes first-wall display as a frame-completion probe; existing model
regressions cover complete selection translation and dependencies, not this single
probe alone. This does not certify every geometry pixel or all element types.

623 tests, TypeScript including diagnostics and production build pass. ESLint:
0 errors, 6 known fast-refresh warnings. Built production JS contains none of the
movement driver/trace markers. Instrumentation is installed only by the separate
benchmark Vite configuration; source anchors fail loudly if code changes.

Synthetic dispatch bypasses hardware input queues and hit testing. Frame callbacks
and DOM verification do not prove GPU presentation. This sequential test does not
measure event coalescing under continuous real mouse motion. The reported heap is a
post-run JS observation, not peak/GPU memory. Image-heavy setup occasionally exceeded
automation timeouts; page status was checked before retrying actions. Real user
projects, dense geometry, contour movement, peak memory and hardware input remain
open A-01 coverage. A-04 implementation remains open.

## Exactly one next task

Reuse the result of checkedImageUrl for unchanged image contents and dimensions
across equivalent preview asset objects, through the shared image adapter. Bound
cache retention and keep invalidation for changed content, MIME and dimensions;
invalid or replaced images must never receive a stale URL. Preserve project-file
validation and the existing preview/commit/history path. Repeat these same six
movement scenarios afterward. The double full-preview validation remains a separate
measured follow-up, not part of that first bounded cache correction.
