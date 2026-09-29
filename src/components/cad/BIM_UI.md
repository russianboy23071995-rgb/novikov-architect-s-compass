# BIM UI integration

The model and current selection live in `CadWorkspace`. All viewports, the navigator and the inspector receive this same project snapshot. Changes go through the validated BIM commands; form errors do not replace the current project. No backend or persistence is introduced.

## Try it

1. Start the app with the existing `dev` script. The initial 2D view contains the agreed 3.00 × 0.36 × 2.80 m wall and centred 1.20 × 1.35 m window with a 0.90 m sill.
2. Select the wall in the plan or navigator. Set **Length (m)** to 6 and click **Apply dimensions**. The length label and navigator update; the window stays centred at 3 m. Length changes keep the wall's start point and direction.
3. Try a length of 1 m. An inline error appears and the 6 m wall remains unchanged.
4. Select the window. Edit width, height, sill height or relative centre position (0.5 is centred). Try a width greater than the wall length or a position that would cross its end: the model remains unchanged.
5. Select **Wall** (or press W outside form fields), then click a start and end point in the plan. New walls use 0.36 m thickness and 2.80 m height. Snap rounds to 0.10 m; Ortho aligns the second point with the first. Escape cancels. Coincident points show an error and let you choose a different endpoint.
6. Select a new wall and click **Add centred window**. This uses the reference window dimensions; a wall too short or too low is rejected. Adjust the opening in the inspector.
7. Switch to two viewports and edit a dimension: both update together. 3D is explicitly a schematic plan preview, not solid geometry.

`BimPlan` converts model XY coordinates to SVG, derives wall thickness/length and window placement, and fits the view to the model bounds. SVG elements and navigator buttons can both select components. Window outlines are plan symbols; solid geometry and real 3D openings remain the next roadmap step.

## Verification

- `npm test`: 16 core tests plus 5 UI geometry/interaction-helper tests.
- `tsc --noEmit`, targeted ESLint and the production build.
- Browser checks: wall extension and rejected shortening, window editing and rejected oversize, two-click wall creation, window creation, zero-length rejection, Escape cancellation, shared updates in split views and schematic-mode labelling. No browser console errors during these checks.

Changes remain in memory until reload. The existing AI, file, undo/redo and camera controls are still prototype controls; Save reports that file saving is not connected. Automatic fitting is not a physical print scale. Window overlaps are not checked by the current core; multiple windows can be selected individually in the navigator. No IFC or AI/voice execution is added in this step.
