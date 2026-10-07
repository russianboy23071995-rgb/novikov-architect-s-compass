# Reuse checked image URLs across preview copies - 2026-10-07

Base: main `b292553` after merged PR169. This bounded A-04 correction changes only
`interop/images/import.ts`: checked image URLs are reusable across equivalent
asset copies. No schema, model action, history or UI workflow changes.

## Cache contract

The former WeakMap was keyed by asset object identity. Validation creates fresh
asset objects for movement previews, even when their strings and metadata match.
A shared bounded LRU now compares exact base64 contents, MIME, pixel width and
pixel height. Asset IDs do not establish equivalence; reusing an ID with changed
contents cannot return the old result. Scalar snapshots also detect mutation of a
previously supplied object. Failed header checks are reusable only for the exact
same inputs. Eviction means a new check on the next access.

At most eight entries and 48 MiB of conservatively counted UTF-16 payload are
retained: two bytes per input and output string character. This is an admission
bound, not a measured process-heap guarantee; runtime object/string overhead and
browser-decoded pixels are separate. Oversized results are returned but not cached.
No project/asset objects, Blob URLs or decoded bitmaps are retained. Normal project
and import validation remain intact; cached presentation checks cannot replace them.
Cold image processing remains unchanged. The constants are implementation bounds,
not a new user-facing project or image format limit.

## Same movement comparison

Same Chromium 154 / Windows, Vite development instrumentation and 1280 x 720
viewport as [PR169 baseline](ACTIVE_MOVEMENT_PROFILE.md). Identical seeded fixture
byte sizes, exact viewBoxes and all 21 CSS pointer coordinates were checked against
the baseline in all six cases. One warmup precedes 21 recorded events; the fixture
image is already rendered/checked before timing, so these are warm movement costs,
not first-import or cold-load improvements. No build/tests ran during measurements.

Median / P95, milliseconds. The last column is included in total time, not additive.

| Elements | Image | Before, verified frame | After, verified frame | After, image URL phase |
|---:|:---:|---:|---:|---:|
| 100 | plain | 34.5 / 38.7 | 32.1 / 60.3 | 0.0 / 0.0 |
| 100 | PNG | 1050.0 / 1081.5 | 514.3 / 532.4 | 0.0 / 0.0 |
| 1000 | plain | 203.7 / 301.5 | 190.9 / 309.9 | 0.0 / 0.0 |
| 1000 | PNG | 1290.6 / 1368.2 | 740.6 / 781.0 | 0.0 / 0.1 |
| 5000 | plain | 1184.2 / 1230.2 | 1160.2 / 1208.3 | 0.0 / 0.0 |
| 5000 | PNG | 2085.0 / 2218.3 | 1603.3 / 1710.8 | 0.0 / 0.0 |

The PNG medians fall by about 51%, 43% and 23% respectively. Repeated image URL
checking/decode drops from roughly 534-546 ms median to below timer resolution
(reported 0.0 ms). This does not mean literally zero execution time. Plain controls
have no image-cache calls; their timing and P95 vary between runs. Do not attribute
those fluctuations to this optimization or claim all interactions improved equally.

The 5000-PNG path still takes 1603.3 ms median. Two full validations remain per
recorded target, totaling 841.3 ms median / 883.8 ms P95 in that case. These inclusive
nested phases cannot be summed or subtracted as independent exclusive costs.
Wall derivation and rendering remain costly. This correction does not close A-04.

All six acceptance sequences passed: 20 selected walls, 21 rendered nonzero
previews, Escape with no history entry, placement, one Undo and Redo. As before,
first-wall DOM geometry is the completion probe; full group semantics are covered
by model regressions. Synthetic events bypass hardware input queues/hit testing;
frame callbacks do not prove GPU presentation. Dense geometry, real projects,
contours, peak memory and continuous hardware motion remain open coverage.
Setup/status automation occasionally timed out for large fixtures; status was
checked before retrying. These were not failed timing samples.

[Raw after reports](image-url-2026-10-07/) and [rerun instructions](../../benchmarks/README.md).

## Validation and practical acceptance

628 tests pass, including five added cache regressions: equivalent copies/IDs,
changed contents/MIME/width/height including same-object mutation, LRU eviction,
payload-budget eviction and oversized admission. TypeScript including diagnostics
and production build pass. ESLint: zero errors, six existing fast-refresh warnings.

Practical check: open a project with a PNG/JPEG reference, select several walls,
choose Auswahl frei bewegen, select an origin and move the pointer. The image must
stay visible. Escape must leave the project unchanged; repeat, place and verify
Undo/Redo. Large-model movement is still slow and is the next target below.

## Exactly one next task

Remove the duplicate validation of the same group-movement preview requested by
precision input and plan rendering. Reuse one validated preview only within an
unchanged movement context and identical target. Changed model, selection,
visibility, origin or target must invalidate it; do not bypass final commit/stale
context checks or weaken validation. Keep this in the shared interaction/Application
path, not per-element UI logic. Add regression evidence for reuse/invalidation,
then repeat the same six movement scenarios and acceptance checks. Broader local
validation, wall-solid caching and new features remain separate follow-ups.
