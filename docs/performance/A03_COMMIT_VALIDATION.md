# A-03: reuse the just-validated commit snapshot

2026-10-07. Base: main `804871a` (PR167 merged). Same browser and deterministic
fixture as [A-01](P0_BROWSER_BASELINE.md): Chromium 154 on Windows, Vite development
server, 5000 elements (1000 joined walls, 500 windows, 3499 lines, one PNG reference),
9,779,490 UTF-8 bytes. The image is generated from the same seed and dimensions.

## Method and evidence

[Before](commit-2026-10-07/before-5000-image.json) and
[after](commit-2026-10-07/after-5000-image.json) contain aggregated diagnostic reports.
Each case has one warmup and 21 samples; case order alternates each round. Median
and nearest-rank P95 are milliseconds. No other test/build jobs ran during timed
profile samples. Absolute timings depend on hardware, GC and the development build;
CPU/RAM configuration was not obtained. This is one local run, not a general SLA.

The diagnostic legacy implementation is the unchanged pre-A03 commit. In the
before run legacy/current medians were 1362.0/1354.7 ms. The following after-run
comparison measures both old and new code in the same browser session:

| Operation | Median ms | P95 ms |
|---|---:|---:|
| Full validation (includes wall solids) | 438.9 | 477.8 |
| Cold wall solids, separate subcost | 200.9 | 217.1 |
| Two JSON strings, UTF-8 size checks and equality | 54.5 | 68.5 |
| Model-only JSON comparison | 13.4 | 16.2 |
| Previous commit | 1390.3 | 1455.3 |
| Current commit | 948.7 | 980.8 |

The commit median falls by 31.8%, about 442 ms; P95 falls from 1455.3 to 980.8 ms.
Cold wall solids are included in full validation and must not be added to it.
JSON-only timings exclude validation. The measured operations do not include React
rendering or frame waits. Status updates trigger workspace renders between samples;
these appear separately in the report. A slow mount and occasional automation
timeouts are not hidden: single mount samples are not used to claim improvement.
Heap fields are post-run JS snapshots affected by GC, not peak/GPU memory evidence.

## Bounded correction

Previously commitProject called validateProject(project), then serializeProject(next),
which ran the full validation again, and serializeProject(history.present). The new
path serializes the immediately validated independent next snapshot directly and
explicitly checks its UTF-8 size. This removes one of three full validation/solid
passes on a changed commit. Validation of the previous snapshot remains. So do both
JSON comparisons, including the special visibility-only branch. No mutable-object
identity bypass, external trusted flag or cross-call validation cache was added.

The file serializer and loader remain unchanged and fully validated. Input copying,
normalized no-op detection, history limits, redo branching, independent layer
visibility and stale Application action checks retain their contracts.

## Acceptance

- 623 tests pass, including four new history regressions for normalized no-op/redo,
  visibility-only changes with assets, invalid previously accepted asset data and
  disconnected joins, and UTF-8 file-size rejection without a history change.
- Existing suite covers stale/cancelled actions, movement, hosted windows, project
  roundtrips, IFC, caller-mutation isolation and the bounded Undo/Redo history.
- TypeScript including diagnostics and production build pass. ESLint: no errors,
  six previously known React fast-refresh warnings.
- Actual CadWorkspace in the 100-element diagnostic fixture: incompatible height
  at a corner is rejected with its existing message and no Undo entry; window width
  1.2 -> 1.4 m, Undo -> 1.2 m and Redo -> 1.4 m confirmed in properties/Navigator.
  Navigator and form confirmation used keyboard activation. This does not certify
  all mouse hit targets, downloads or IFC import anew.

The 949 ms commit remains too slow for comfortable large-scene work. No preview
optimization or end-to-end pointer improvement is claimed. A-01 remaining coverage
(active preview, real user models, dense/contour cases and peak memory) stays open.

## Next bounded task

A-01/A-04: instrument the existing shared group-movement path from pointer intent
through snapping and preview validation to the next rendered frame. Repeat the
20-wall movement in the existing 100/1000/5000 fixtures, with and without PNG.
Report median/P95 by phase and verify cancellation/commit/Undo. Use these measurements
to select the next preview optimization; do not introduce new element tools yet.
