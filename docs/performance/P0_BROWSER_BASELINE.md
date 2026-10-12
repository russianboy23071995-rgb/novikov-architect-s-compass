# P0 browser measurements - 2026-10-07

Baseline source: `aac3955` plus the diagnostic mount/runner; after uses the same runner with A-02 revision keys.

Status: first reproducible A-01 baseline and A-02 correction; broader A-01 acceptance remains open (see limits). PR166 merged, including both planning sections.

## Method

Windows, Chromium 154.0.0.0, Vite development build on localhost:8081. Real CadWorkspace, React Profiler, deterministic fixtures (20% joined walls, 10% host windows, remainder lines). A real seeded 1400x1400 PNG replaces one line in image cases. Each core operation: one warmup, 21 samples; nearest-rank P95. Selection: 22 alternating Navigator clicks. See [runner](../../benchmarks/README.md) via repository root `benchmarks/README.md` for exact steps. No forced GC or CPU throttling.

A-02 replaces two full-project JSON keys with weakly held immutable project revision and selected kind/ID. Same immutable snapshot and selection retain form drafts; a changed snapshot/selection remounts forms. Layer properties remain controlled. No model/asset is read by the key helper.

## Core browser costs before A-02

All values median / P95 milliseconds. A-02 does not change these model operations.

| Elements | Image | Project MiB | Group preview | Commit | JSON save | JSON load |
|---:|:---:|---:|---:|---:|---:|---:|
| 100 | plain | 0.02 | 4.0 / 4.4 | 11.4 / 12.5 | 3.8 / 4.3 | 3.3 / 4.0 |
| 100 | image | 8.59 | 215.0 / 218.8 | 709.0 / 750.9 | 238.2 / 275.8 | 221.2 / 266.8 |
| 1000 | plain | 0.15 | 32.3 / 35.7 | 97.8 / 102.8 | 32.5 / 36.4 | 33.2 / 40.0 |
| 1000 | image | 8.73 | 241.4 / 251.6 | 784.1 / 819.1 | 263.3 / 280.2 | 257.8 / 265.8 |
| 5000 | plain | 0.75 | 197.7 / 204.6 | 602.9 / 626.5 | 203.6 / 212.4 | 206.6 / 221.0 |
| 5000 | image | 9.33 | 418.5 / 426.3 | 1314.2 / 1373.8 | 435.0 / 446.5 | 429.3 / 458.2 |

## Form-key and interaction comparison

Two keys per sample. Zero means below the available timer resolution, not literally free. Click timings include the instrumented driver and two-rAF scheduling; they are not pure hardware input latency.

| Elements | Image | Old keys median/P95 | New keys median/P95 | Click before median/P95 | Click after median/P95 |
|---:|:---:|---:|---:|---:|---:|
| 100 | plain | 0.1 / 0.2 | 0.0 / 0.0 | 64.6 / 92.4 | 68.6 / 88.7 |
| 100 | image | 9.4 / 12.7 | 0.0 / 0.1 | 81.7 / 112.9 | 60.5 / 78.9 |
| 1000 | plain | 0.9 / 1.2 | 0.0 / 0.1 | 152.3 / 472.5 | 150.1 / 475.3 |
| 1000 | image | 8.5 / 10.3 | 0.0 / 0.0 | 163.9 / 296.9 | 153.6 / 478.3 |
| 5000 | plain | 3.6 / 4.2 | 0.0 / 0.0 | 875.6 / 938.3 | 860.9 / 1013.9 |
| 5000 | image | 11.1 / 14.0 | 0.0 / 0.1 | 884.0 / 946.3 | 864.6 / 932.7 |

## Interpretation and limitations

- A-02 eliminates a measurable serialization cost, especially with images. Total selection latency still includes larger render/application work and variability; no universal speedup claim.
- A-03/A-04 have measured candidates: group/wall preview and commit grow substantially with model size and image payload. Profile phases before choosing a correction.
- Correction to the initial audit: connectedWallSolids already has a WeakMap cache. The warm wallSolids samples confirm it; new preview snapshots still need derivation.
- Heap fields in raw reports are approximate JS used/total/limit snapshots, not peak RSS or decoded-image/GPU memory. They include harness objects/history and are affected by GC. No claim that history duplicates images 100 times.
- Mount/load contains one sample only, no statistical P95 claim. JSON load/save timings measure actual parser/serializer, not OS file dialogs or browser downloads.
- Core preview timings do not include end-to-end active pointer-preview rendering. The collected pointermove events are over UI controls. A-01 remains open for that measurement, contour/dense-snap UI regressions, real user projects and peak memory.
- Large-scene diagnostic button calls sometimes exceeded the automation timeout while Chromium was busy. Status was checked before retrying; core sampling ran only after a confirmed start.
- Functional browser acceptance: draft height survives zoom; committed 3 m height restores 2.8 m on Undo and 3 m on Redo; confirmed keyboard Navigator selection resets the draft; layer assignment and Undo restore expected layer. A canvas click on a selected wall axis does not count as successful window selection.

## Next bounded task

A-03: profile validation, connected-wall derivation and JSON comparison separately for the existing 5000-element image fixture; remove one proven redundant commit/validation pass while retaining stale/invalid action guards, file validation and Undo/Redo. Extend the corresponding acceptance with the active preview path; do not start rooms yet.
