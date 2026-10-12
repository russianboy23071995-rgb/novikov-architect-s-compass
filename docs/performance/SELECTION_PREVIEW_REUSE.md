# Share the validated group-movement preview - 2026-10-07

Base: main `4928940`, PR170 merged. Bounded A-04 correction; no file-schema,
element-model, selection, snapping-policy or history redesign.

## Implementation

`application/tools/point-preview.ts` holds one successful result for an exact 2D
point within one bound interaction adapter. Every request runs its context guard,
including hits. A new target, failed request or explicit clear discards the entry.
There is no global project cache and no tolerance-based target equivalence.
A new adapter/context creates a new cache; this deliberately does not optimize
repeated independent React renders of an otherwise unchanged interaction.

`selectionMoveInteraction` uses this shared helper for its precision preview and
plan preview. Its model/selection/visibility eligibility guards remain active;
changing the pinned origin rejects the old adapter. Context replacement is still
owned by useSelectionMove, whose latest-context check protects final mutation.
Both validate and commit bypass/clear presentation reuse and derive a fresh model.
Cancellation clears reuse. Mutable preview output can never become trusted commit
input. The unchanged model action still performs its full validation.

The common polar resolver now preserves the exact snapped aim when neither angle
nor length is supplied. Previously its normalize/reconstruct round trip introduced
small differences (e.g. at 22.8/-15.3), which correctly missed an exact cache key.
Explicit angle/distance constraints still use their existing projection. Invalid
or overflowing distances remain rejected. No per-element UI code was added.

## Repeated browser evidence

Same Chromium 154 / Windows, development Vite instrumentation and 1280 x 720
viewport as [PR170 comparison](IMAGE_URL_REUSE.md). Six fixtures, identical byte
sizes, exact viewBoxes and all 21 CSS targets checked against the prior reports.
One warmup, then 21 measured targets per case. No build/test jobs during timing.

Median / P95 milliseconds; the validation phase is included in frame time.

| Elements | Image | Before, verified frame | After, verified frame | After, validation |
|---:|:---:|---:|---:|---:|
| 100 | plain | 32.1 / 60.3 | 36.4 / 65.4 | 3.9 / 6.3 |
| 100 | PNG | 514.3 / 532.4 | 261.4 / 270.8 | 197.9 / 205.8 |
| 1000 | plain | 190.9 / 309.9 | 171.2 / 292.1 | 36.5 / 44.1 |
| 1000 | PNG | 740.6 / 781.0 | 371.0 / 493.9 | 229.9 / 235.7 |
| 5000 | plain | 1160.2 / 1208.3 | 1026.6 / 1052.2 | 211.2 / 224.3 |
| 5000 | PNG | 1603.3 / 1710.8 | 1234.6 / 1292.9 | 406.6 / 428.5 |

All 126 measured targets now invoke exactly **one** full validation, versus two
in PR170. With PNG, median frame time drops by about 49%, 50% and 23% for
100/1000/5000 elements. Plain 100-element timings fluctuate around frame cadence;
no speedup is claimed there. The larger plain cases improve less than the PNG
cases. This is not a promise of smooth interaction for large projects.

All six acceptance runs passed: 20 selected walls, 21 nonzero rendered previews,
Escape without history, placement matching preview, single Undo and Redo.
As before, the DOM completion probe observes the first wall, with model regressions
covering the full translated selection. The driver uses synthetic DOM events and
frame opportunities; it does not measure OS queues or guaranteed GPU presentation.
Setup/status timeouts in large fixtures were checked before retry; they were not
included as successful timing samples. Exploratory runs before preserving the exact
polar aim were replaced by these six final comparison reports.

After the six-case comparison, review added an explicit nonfinite-distance guard
to retain the old overflow rejection with exact aim preservation. All automated
checks and an additional 100-PNG browser smoke run cover that final guard. It does
not change the finite fixture targets; that smoke report is kept separately rather
than mixed into the comparison samples: [final smoke](preview-reuse-final-smoke.json).

[Raw comparison reports](preview-reuse-2026-10-07/) and
[driver protocol](../../benchmarks/README.md).

## Validation and practical acceptance

633 tests, TypeScript including diagnostics and production build pass. ESLint:
zero errors, six known fast-refresh warnings. Five new regressions cover one-entry
reuse/failures, final recomputation despite altered preview data, context/origin
invalidation, exact shared mouse targets and overflowing distances. Existing tests
cover polar constraints, model commands, geometry, persistence, IFC and history.

Practical check: select several walls (or a supported mixed selection), choose
Auswahl frei bewegen, pick an origin, move and place with a click. Repeat with
Tab length/angle entry. Escape must discard; Undo/Redo must each operate on the
whole placement. Hiding a target layer or changing selection cancels the operation.

## Remaining cost and exactly one next task

A-04 remains open. At 5000 PNG elements the frame median is still 1234.6 ms;
full validation is 406.6 ms, React render 952.0 ms (inclusive/nested, not additive).
Rendering/derivation grows significantly. A-01 still lacks dense geometry, actual
user projects, contour movement, peak memory and continuous hardware-input evidence.

The PNG validation phase still costs about 194 ms more than plain at 100 elements,
with similarly small wall-solid cost. The reference schema rescans canonical
base64 in every validation. This identifies a candidate, not an isolated timing
attribution to that scan. Next bounded task: instrument that exact pure string
check and, if confirmed, reuse its result with explicit entry/byte bounds and exact
content keys. Keep MIME/dimension/schema/header checks independent, recheck changed
payloads and malformed data, and preserve public file validation. Repeat the same
movement comparison. Do not add a whole-project trusted/cached-validation path.
