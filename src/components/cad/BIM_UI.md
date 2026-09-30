# BIM UI integration

The model and current selection live in `CadWorkspace`. All viewports, the navigator and the inspector receive this same project snapshot. Changes go through the validated BIM commands; form errors do not replace the current project. Explicit JSON save/load and in-session model history are available; no backend or autosave is introduced.

## Try it

1. Start the app with the existing `dev` script. The initial 2D view contains the agreed 3.00 × 0.36 × 2.80 m wall and centred 1.20 × 1.35 m window with a 0.90 m sill.
2. Select the wall in the plan or navigator. Set **Length (m)** to 6 and click **Apply dimensions**. The length label and navigator update; the window stays centred at 3 m. Length changes keep the wall's start point and direction.
3. Try a length of 1 m. An inline error appears and the 6 m wall remains unchanged.
4. Select the window. Edit width, height, sill height or relative centre position (0.5 is centred). Try a width greater than the wall length or a position that would cross its end: the model remains unchanged.
5. Select **Wall** (or press W outside form fields), then click a start and end point in the plan. New walls use 0.36 m thickness and 2.80 m height. Snap rounds to 0.10 m; Ortho aligns the second point with the first. Escape cancels. Coincident points show an error and let you choose a different endpoint.
6. Select a new wall and click **Add centred window**. This uses the reference window dimensions; a wall too short or too low is rejected. Adjust the opening in the inspector.
7. Switch to two viewports and edit a dimension: both update together. Select **3D** to see the wall body and through openings in the first viewport; other viewports retain the plan. Drag to orbit, use the wheel or +/− buttons to zoom, or select Pan and drag. Fit view recentres the model; Reset view restores the initial camera. Arrow keys rotate the focused 3D canvas; +/− zoom. Click visible wall material in 3D to select its stable ID; click empty space to clear selection. Dragging beyond 4 CSS pixels orbits/pans without selecting. Select windows in the navigator.

`BimPlan` converts model XY coordinates to SVG, derives wall thickness/length and window placement, and fits the view to the model bounds. SVG elements and navigator buttons can both select components. Window outlines are plan symbols. `BimSolidView` renders real wall boundary surfaces with WebGL depth testing. `buildSolid` partitions each wall at window edges, extrudes occupied cells through the wall thickness, and emits only external surfaces, including opening reveals. Overlapping openings are subtracted as a union. Coordinates remain metres and Z is up. The camera uses orthographic projection. No new dependencies are required.

## Verification

- `npm test`: 72 tests: 16 model tests, 5 UI-helper tests, 10 IFC export tests, 9 command tests, 8 speech-adapter tests, 7 3D-picking tests, 8 project-file/history tests, and 9 solid-geometry/camera tests covering volume, surface orientation, through openings, changed dimensions, diagonal walls, overlapping openings and camera projection.
- `tsc --noEmit`, targeted ESLint and the production build.
- Browser checks: wall extension and rejected shortening, window editing and rejected oversize, two-click wall creation, window creation, zero-length rejection, Escape cancellation, shared updates in split views, real 3D openings, height/sill edits and camera controls. No browser console errors during these checks.

Use Save project to download editable JSON and Open project to restore it. Undo/Redo retains up to 100 model changes in the session. Reload starts the example again; there is no autosave. See [project files](../../lib/bim/PROJECT_FILES.md). Automatic fitting is not a physical print scale. Window overlaps are not checked by the current core; multiple windows can be selected individually in the navigator. The IFC toolbar button exports the current model for exchange; IFC import and free-form AI interpretation remain later work. Local text commands now edit selected elements through a validated preview; see [model commands](../../lib/bim/COMMANDS.md). See [IFC export](../../lib/bim/IFC.md).

The 3D viewport requires WebGL; if it is unavailable, an error explains how to use 2D instead. GPU buffers and programs are released on unmount; context restoration rebuilds the renderer. Walls remain separate solids (no wall-junction union), and windows are openings without frames or glass. The grid is a screen-space guide. 3D wall selection uses the rendered triangles and nearest depth, preserving through openings. Window selection remains through the navigator.
