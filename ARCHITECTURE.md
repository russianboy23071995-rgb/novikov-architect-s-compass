# NOVIKOV CAD Architecture Contract

Tool-specific settings, properties and option hints belong exclusively in the
Werkzeugeigenschaften area, not the top application toolbar. TopToolbar has no
active-tool option model; global project/view/layer controls remain there.

## Window placement adapter — 2026-10-06

`application/drawing/window-placement.ts` derives host/relative position from a
visible physical wall body and uses existing `addWindow` validation for preview
and commit. `useWindowPlacement` binds immutable project/visibility and a stable
new ID; `useToolInteraction` and the generic plan placement binding own interaction.
The shared snap resolver receives the host's physical longitudinal axis. This
creation starts without a pinned movement origin or polar input; ToolInteraction
accepts an unanchored ToolSnapPolicy, while movement adapters explicitly retain
AnchoredToolInteraction. Existing movement-origin requirements are unchanged.
Draft window rendering uses its actual layer and host visibility, never a fake
committed entity. New selection requests accompanying a model commit are validated
against that new snapshot; ordinary clicks still validate the current snapshot.
No project schema change. Initial placement uses the existing 1.20 x 1.35 m window
with 0.90 m sill as defaults; one click commits once, Escape discards. Properties remain shared.
The placement hook retains editable width/height/sill text for the current workspace
session. Application parses metre values (decimal comma or point) and applies the
same dimensions through preview and addWindow. Each immutable draft revision binds
a new interaction; old preview/commit callbacks reject a changed revision. Invalid
or incomplete fields cannot fall back to earlier valid dimensions. These tool
preferences do not mutate existing entities or create model history/file fields.

Optional precise placement first pins a visible wall ID without a model commit.
The same adapter then anchors the shared precision input at the physical wall
body start; longitudinal distance locates the window centre relative to the wall
axis start (the lateral body offset does not change that distance). Wall direction
is fixed/read-only. Existing precisionTarget, snapping, Tab and confirmation are
reused. Host choice, project/visibility and dimension revisions reject stale
callbacks. Only final placement creates history; Escape discards the session.

Window centre bounds are derived once per action by the shared domain wall/window-range
function, used by both placement and movement. Pointer/precision targets beyond
those bounds are capped before validated addWindow/updateWindow. Bounds include
corner seams with numerical clearance and deliberately ignore T junctions. Invalid
sizes and unavailable hosts remain errors; model validation is not relaxed.

## Shared selection requirement — 2026-10-06

User requirement: selection is a tool-independent Application capability for all
current and future element types, including mixed sets. Support click, Ctrl-click
and rectangular marquee. User clarification: active means visible; all shown layers
are eligible. Reuse existing visibility policy, including hidden-host exclusion for
windows. Do not introduce a separate activation/lock state for this requirement.

Application owns one typed stable-ID selection set and eligibility rules. Viewport
adapters supply projected hit geometry; common picking/marquee logic and pointer
handling are reused, not reimplemented per tool. Selection capability is independent
of movement support. Actions validate the full pinned target set; never silently
act on just its first member. Properties, Navigator, On-Demand and AI/Text/Voice
consume the same context. A selected host does not implicitly select its windows;
future transformations must account for dependencies without double movement.

Implemented first delivery: shared 2D selection for walls, windows, lines/polylines
and hatches, including mixed sets. `application/selection/state.ts` owns typed-ID
transitions, eligibility and the model-bound index. `useElementSelection` binds
that state to React; renderers and Navigator consume it. Only a singleton supplies
a legacy action/AI target. No first-item fallback for mixed sets.
`planSelectionShapes` supplies disposable contours; `enclosedTargets` applies full
rectangle containment to all vertices (including boundary), independently of type.
`useSelectionMarquee` owns the pointer gesture. Click replaces, Ctrl/Cmd-click
toggles, empty click clears; a frame replaces. Start the frame on empty canvas in
Select mode, after 3 CSS pixels of movement. Drawing, editing, reference selection
and navigation retain precedence. Escape/pointer cancellation/model or visibility
change cancel the frame; selection creates no model history.
3D wall surface and foot-anchor clicks now forward Ctrl/Cmd to the same selection
transition as the plan. Existing depth/visibility and drag-vs-click gates remain.
Selected wall outlines share the central set; no separate 3D selection store.
`rendering/viewport/window-selection.ts` derives opening hit rectangles on the
physical wall centre plane and outlines on both opening rims. These are disposable
selection geometry, not glazing or exported model material. Windows and wall
surfaces compete in the same projected depth space; hidden windows/hosts are
excluded. A visible opening now targets its window instead of a wall behind it.
The adapter returns the same typed targets for plain and Ctrl/Cmd selection.
No 3D marquee or group-movement gesture is added.
Implemented consumer: `application/selection/move.ts` pins a complete typed target
set and base project, translates one proposed snapshot, then validates it once per
proposal. Internal corner/T relations survive; relations crossing the selected-wall
boundary detach. Host windows retain relative parameters and follow exactly once.
A selected window without its host rejects the complete free translation. No new
joins are inferred, no scaling or file-schema change is introduced.
`useSelectionMove` binds the session and checks current context again at commit.
`ToolInteraction`, shared polar input and snap policies own precision and inference;
the viewport's generic placement binding only supplies pointer intent and displays
the returned preview. Exclude moving entities and hosted windows from snap sources,
pin the chosen origin immediately. Context changes and cancellation discard the
preview; commit creates one model history entry. First delivery is 2D. Text/Voice
must consume this same validated action with pinned whole-selection context, never
fall back to a single target. See the [selection plan](docs/walls/SELECTION_MOVE_PLAN.md).


### Local selection-command adapter - 2026-10-06

`application/commands/selection-command.ts` adapts a bounded translation grammar
to the shared selection-movement action and polar service. The UI supplies the full
typed selection, immutable base and visibility policy. Textual previews disclose
all targets and relationship effects; they never mutate the model. Acceptance
checks context again and reruns the validated action rather than trusting editable
preview geometry. Singleton legacy commands use the same context gate; mixed sets
never fall back to their first element. Pure vector translation uses a neutral
coordinate origin, not an inferred element anchor. This does not alter the pinned
origin rule for interactive pointer movement. `selection-voice.ts` now binds browser recognition to an immutable context revision
containing the complete selection, project and visibility policy. UI cleanup aborts
on revision changes; callback-time revision checks reject late results before
cleanup as well. Returning to the same IDs is still a new revision. Recognition
only supplies normalized text and the shared command preview, never a commit.
Invalid transcripts remain editable; explicit acceptance retains action validation.
The existing browser recognition lifecycle supplies timeout, cancellation and errors.

## Corner plus T: bounded composition — 2026-10-06

A host may combine exactly one right-angle corner with remote perpendicular T
contacts. The incoming wall must have no corner and cannot also be a host or
have a second T. Existing equal cross-section and T-overlap checks still apply.
`connectedWallContours` retains composed corner profiles. `validateCornerTContact`
checks the full contact against the actual remaining longitudinal side and rejects
contact with the corner partner. No fixed clearance margin is introduced.
Corner-window validation runs before T opening clipping; crossing a T does not
permit crossing a miter. All interaction and export paths share this derivation.

Schema 8 is retained: relation fields, units, identity and interpretation are
unchanged; this extends admissible topology. Older builds reject mixed files
under their stricter validation. Loading never deletes relations to make them
fit an older implementation. Existing schema-8 files remain valid.

Correction to the planning assumption: current single-endpoint edits detach an
end join when endpoints cease to coincide; no shared corner-move action exists.
User decision (2026-10-06): a dedicated joint corner-move action is not wanted.
The intended workflow is to select both affected walls and translate the selected
whole elements together. Do not implicitly move an unselected neighbour.
Selection-set translation must reuse the shared interaction pipeline and atomic
history; its implementation and connection handling still require verification.
Individual whole-wall translation retains its existing automatic-detachment rule.
See [combination plan](docs/walls/CORNER_T_COMBINATION_PLAN.md).


## Derived wall drawing preview — 2026-10-06

ToolInteraction may expose previewProject for a disposable model snapshot. The
wall adapter uses previewWallChain/appendWallChain for both that snapshot and
confirmation validation. BimPlan only renders the returned model or reports the
Application error. Numeric targets carry no hover candidate, matching commit.
Draft wall visibility follows its assigned layer; committed picking, snap sources
and history remain bound to the authoritative project. New draft IDs are never
added to that project. Invalid targets retain already accepted draft segments,
show the precise validation error and do not display an invalid body. The current
slice is the 2D plan; shared 3D drawing preview is not introduced here.


## Starting a wall on a host axis — 2026-10-06

The initial wall snap policy uses the shared local T-axis resolver, projecting
the cursor onto a visible host interior. Ambiguous hosts do not create intent.
ToolSnapPolicy permits no origin before acquisition; AnchoredSnapPolicy remains
mandatory for active ToolInteraction. No synthetic construction origin is pinned.
beginWallChain pins the explicit start candidate in the ephemeral transaction.
appendWallChain connects endpoint 0 through connectWallAtTAxis; finish alone
commits history. Cancellation discards intent. Coordinate-only starts do not
create relations. Existing right-angle/cross-section/topology rules validate
mouse and numeric targets. A T-connected segment cannot continue into a corner.
This supersedes the unsupported start status in the historical section below.


## Drawing endpoint T intent — 2026-10-06

Wall drawing reuses Application findTAxisReference/queryTAxisSnap and
connectWallAtTAxis with direct editing. The plan carries the exact candidate
through ToolInteraction validation and appendWallChain. Numeric input discards
mouse intent. Only finishWallChain commits history; cancel discards the draft.
The current slice ends a new segment on an existing visible host axis. A chain
ending at a T must be finished before drawing again; corner/T combinations
remain unsupported. Starting on a host axis does not yet create a T relation.


## T contacts do not constrain hosted window movement — 2026-10-06

Binding user clarification: windows stay on their original wall and ignore T
contacts while moving. This supersedes the earlier overlap prohibition for T
openings only. Original wall-axis extent, dimensions and opening-overlap rules
remain; corner rules are unchanged. Moving a window neither transfers its host
nor cuts a neighbouring wall. Geometric contact reports remain diagnostic.

T wall solids opt into clipping the rectangular opening to the owning wall's
derived footprint. The shared extrusion kernel bounds its slices to that profile;
closed-shell validation remains active. This includes a window crossing a trimmed
incoming cap. IFC retains its existing owning-wall void relationship, so no
neighbouring element is silently modified. Model actions, preview, persistence
and normal export accept the same window positions.

Canvas wall contour width is a presentation preference in CSS pixels (0.5–2,
default 1), shared by all plan viewports. UI hook owns guarded browser storage;
it is neither project data nor model history. View → Canvas-Darstellung and the
Settings control open the same dialog. Turquoise axis stays at 2.5 CSS pixels;
selected wall outline stays neutral. This supersedes the fixed 1.25 px selection
width below; physical wall thickness and export geometry are unaffected.

## Shared-host T relations and joined plan outlines — 2026-10-06

Binding decision following the user's multi-side T workflow: a host may have
multiple right-angle incoming walls on either side, including opposite branches
at the same axis point. This supersedes the disjoint-pair restriction below.
An incoming wall may have only one T relation and may not also act as a host.
Corner/T combinations and differing cross-sections remain unsupported. Same-side
contact intervals must not overlap; all window/contact checks remain mandatory.
Schema 8 fields are unchanged; validation accepts this broader topology. Existing
files retain their exact relations. Earlier builds may reject new multi-T files.
An endpoint already participating in a T is excluded from automatic corner
acquisition, preventing a false corner between opposite incoming branches.

Rendering wallPlanOutlines removes coincident contact strokes only between
persisted, visible partners using the authoritative derived contours. It does
not discover relations from proximity or merge BIM entities. Hiding a partner
restores the remaining wall's cap. Fill is uniform; selection uses a subtle neutral exposed contour (1.25 CSS px).
Turquoise is reserved for the authoritative drawing axis and its handles (2.5 CSS px axis). Separate hit geometry, stable IDs and IFC entities
remain intact. This is a ground-plan display rule, not a solid boolean union.
The existing temporary pair-preview overlay remains separately outlined.

The 3D workplane adapter now passes the shared T candidate through preview and
commit, superseding the earlier unimplemented 3D carrier status below.

## Explicit axis snap intent in 2D endpoint editing — 2026-10-06

Application t-axis-snap derives an endpoint target from nearby eligible axis
segments supplied by the shared source query. It projects the fixed opposite
endpoint onto the host axis for the supported right-angle T; the target must be
inside the segment and within the CSS snap radius. Ambiguous hosts produce no
connection intent; existing reference selection can restrict sources. No global
wall-pair search, no inference of a connection from a numeric coordinate alone.
Only axis-endpoint point/stretch interactions participate in this first slice.

ToolInteraction carries an optional SnapCandidate through shared validation and
commit. previewEdit combines the endpoint edit with the existing T Application
action, with the same pinned session/model and one history commit. Plan preview
and mouse confirmation pass the same candidate; numeric overrides discard it.
Explicit axes/held Shift remain authoritative. Viewport capability
includeInteractionTargets keeps 3D unmodified until its target transport is
integrated; it is a generic carrier, not geometry logic in the renderer.
The existing isolated/equal-cross-section/right-angle relation limits still apply.

## Held Shift direction — 2026-10-06

Shift now latches the acquired construction direction for the current interaction,
not the nearest angle on every pointer movement. Application createShiftSnapLock
owns the transient origin/direction; useShiftSnapLock supplies shared keyboard
press/release/blur lifecycle for plan and 3D workplane adapters. Existing explicit
edit axes and host restrictions still win. Recognised oblique guides can be held;
otherwise the first direction uses the existing 45-degree acquisition. Exact
compatible snap targets remain eligible along the held axis. Releasing Shift
permits recalibration; a new interaction/reset discards the latch; view zoom does
not. This state is neither project data nor model history.

## Persisted isolated T relations, schema 8 — 2026-10-06

Current contract supersedes the historical schema-7/persistence status below.
storey.wallTJunctions stores only hostWallId and incoming wallId/endpoint.
Strict V7 validation precedes migration with an empty T list; V1–V6 retain their
explicit migration chain. Loading never discovers or repairs connections.
Domain t-relations validates disjoint pairs (no shared walls or corner joins)
and delegates geometry/opening inspection to t-pair. connectedWallContours and
connectedWallSolids supply the existing plan, 3D, snapping and normal IFC paths.
The first slice supports right angles and equal thickness/height only.

Application t-connections provides snapshot-bound preview/commit connect and
disconnect actions, stable IDs and one model-history transaction. Future mouse,
text and voice adapters use this boundary, never a second relation model.
Direct-edit translation passes explicit move intent through updateWall and
removes a participating T without moving its neighbour or rediscovering joins.
Reshaping retains a relation while the incoming world anchor remains on the host
interior; otherwise it detaches. An end shortened exactly to the anchor does not
silently become a corner. Invalid remaining contact geometry rejects atomically.
Windows may touch T contact but cannot overlap it, including hidden windows.
No automatic T creation or additional UI workflow is introduced in this slice.

## Recursion-free T pair kernel — 2026-10-06

Domain t-pair owns inspection and solid derivation from resolved Wall parameters,
endpoint index and schema-valid windows from one snapshot. It has no runtime
Project/schema validation dependency. Internal project validation may call this
kernel after structural/identity checks; it must enforce relation eligibility.
Public resolveIsolatedTPair validates/copies the full Project and resolves stable
IDs and the current isolated-pair restriction. inspectTOpenings and deriveTSolids
use this boundary then delegate to the same kernel. No caller-provided stale
contours and no second geometry implementation. Application preview and isolated
IFC export retain their existing public interfaces and strict validation.
Schema remains 7; persistence/automatic T relations are not implemented here.


## Persistent T contract preparation — 2026-10-06

User confirmed: changing one host endpoint keeps the incoming endpoint at its
world position; when that point leaves the host interior, detach without moving
the incoming wall. Individual element movement detaches, without propagation.
[Persistent T contract](docs/PERSISTENT_T_RELATIONS.md) defines the bounded
implementation plan: IDs/end index identify the anchor; do not store redundant
coordinates or a proportional anchor. Schema 8 is planned, not implemented.
Separate validated public entry points from pure internal derivation before
connecting T solids to validateProject, avoiding recursive validation. Movement
intent must be explicit; coordinate differences alone are not the action type.


## Isolated T IFC acceptance — 2026-10-06

Domain t-solid now owns the validated T pair's opening-aware solids. Application
re-exports it for the existing snapshot-bound preview; interop/ifc/t-junction
uses it directly and passes local profiles to the existing writer. No Interop
import from Application and no duplicate clearance or extrusion implementation.
This is an explicit acceptance export, not a change to the normal export button.
No stored T relation or schema migration. The fixture generator supplies free,
touching and rotated cases with independent analytic net-volume expectations.
See docs/T_IFC_ACCEPTANCE.md for regeneration and external acceptance.


## T-preview opening contact — 2026-10-06

User permits windows to run against a wall. The isolated T-preview interprets
this as touching allowed, positive overlap rejected, without extra clearance.
Existing corner-join rules are unchanged. Domain t-openings derives one snapshot's
T geometry and reports free/touching/overlapping for each target window. Host
windows are checked against the entire projected contact interval; incoming
windows against the trimmed contour and correct endpoint cap. Visibility never
exempts an opening. Application consumes the report and shared cut solids.

contour-solid reconciles numerically compatible local profile X coordinates and
opening bounds after world/local conversion, preventing spurious tiny extrusion
cells at a transverse cap. This affects derived geometry only, within existing
model tolerances. No project mutation or persisted opening resize. T relations
remain temporary; save/ordinary IFC still use the unchanged model. Further joins
on either wall remain unsupported by the diagnostic T path.


## Temporary T preview adapter — 2026-10-06

Application walls/t-preview resolves stable IDs in a validated Project, rejects
windows and persisted joins on either target, then consumes the pure T geometry
and shared wallContourSolid. The existing corner preview reducer binds the
result to the source snapshot and clears on target/type changes. The diagnostic
dialog offers a T mode using navigator wall labels, with the selected first wall
as host. Existing plan profiles and solid preview surfaces display the pair.
No duplicated geometry or persistent T relation. Closing is discard-only; save,
history and IFC continue to use the unchanged authoritative Project. Host window
clearance and anchor/movement policies are still proposals, not implemented rules.


## Isolated right-angle T geometry — 2026-10-06

Domain `elements/wall/t-junction.ts` now derives gross contours and a contact
segment for an explicit host/incoming pair. The host body remains unbroken;
the incoming cap meets the facing host side. Equal heights/thicknesses and an
interior axis contact are required. Existing wallBody, line intersection and
polygon/tolerance services are reused in a local coordinate frame. Numerical
compatibility is not authorization to auto-connect nearby model entities.

This pure helper knows no Project, windows, other joins, persistence or UI.
Callers must verify those preconditions separately. It never mutates axes or
adds a relation. Contact width touching a host end, insufficient incoming length,
non-right angles and invalid inputs reject. Existing automatic endpoint joins
remain unchanged. No schema migration, new command or duplicated renderer path.
The planned anchor/host-movement policies remain open.

## T-wall connection planning boundary — 2026-10-06

[The bounded T-connection draft](docs/T_WALL_CONNECTION_PLAN.md) records the
current endpoint-pair limitation and proposes an unbroken host wall with a
trimmed incoming wall. It is not an implemented connection or a settled anchor
policy. Preserve common contours, IDs and validated Application actions. Host
movement/anchor behavior and host opening clearance remain explicit proposals.
The next geometry-only helper introduces no persistence, UI or command path.
Text/voice remain companion adapters of verified actions per the guide; there
is no blanket deferral based on the user's priority question.

## Oblique persisted wall corners — 2026-10-06

The automatic connection path now uses Domain deriveWallCorner for non-collinear
axis-end pairs, including acute and obtuse corners. This supersedes the historical
right-angle-only restriction below. The existing line intersection service and
contour validation are shared; no angle-specific renderer or IFC implementation.
The strict deriveRightAngleCorner entry remains for the older diagnostic preview.
That dialog is still limited to right angles; automatic drawing/editing does not
require it. Equal thickness/height, exact endpoint identity, two ends per node,
valid composed profiles and opening clearance remain mandatory. Parallel axes,
numerically unresolved seams and miters reaching the opposite cap reject.

Schema 7 is unchanged: joins still store only IDs/end indices. Existing valid
right-angle projects retain their geometry. The admissible geometry is expanded;
older releases may reject newly saved oblique joins. All views, snap references
and ordinary IFC export consume connectedWallSolids. A complete wall chain still
forms one undo action. T contacts, collinear subdivision and unequal wall sections
remain outside this step. Future text/voice adapters use existing validated wall
actions and stable target context, not a separate corner mutation path.


## Convex 2D contour offset — 2026-10-06

Geometry prepareConvexOffset owns parallel edge offsets for either winding.
Positive distances are outward, negative inward. Initial simple/convex checks
and miter vectors are prepared once per immutable EditSession; queries traverse
vertices/edges and reject the first collapsed/reversed side rather than silently
changing topology. Domain validation still checks the resulting snapshot.
Concave rings and numerically extreme acute corners are explicitly unsupported.

Application direct-edit/offset accepts only closed 2D lines and hatches, using
closedContour as its capability gate. BIM is rejected here even in plan views.
Existing editInteraction, origin, snap resolver and signed axis input serve both
kinds; no copied form, mouse handler or snapping engine. The selected side (or
first side when selected as an element) supplies the outward normal; the chosen
point remains the pinned origin. Shared previewEdit checks model/selection;
existing confirmation creates one history entry. Cancellation never changes the
model. Style, layer and stable ID are preserved; file schema remains 7. Future
text/voice adapters use these same actions. Offset is not uniform scaling.


## Hatch appearance and schema 7 — 2026-10-06

Hatches retain their existing foreground fill/opacity and gain required background
and contour paints, each with a visible flag and a six-digit hex colour. The
background is opaque behind the fill; 100% foreground opacity covers it. The
contour is currently a solid 1 CSS-pixel display line, independent of zoom and
selection highlighting. These are appearance attributes, not additional line
entities. Existing contour picking, snapping and direct editing stay shared,
including when paints are hidden. IFC still exports BIM geometry only.

Interop strictly validates V1–V6 before migration to schema 7. Legacy paints are
initialized hidden (white background, slate contour), preserving old appearance.
No silent runtime defaults: schema-7 snapshots require both valid paints. The
legacy V6 validator checks its original strict shape and reuses current wall-join
validation on a disposable converted view. Creation defaults live in Domain;
Application previewHatch/commitHatch owns updates by stable project/hatch ID,
with stale-context validation and one normal model-history commit. Future
text/voice adapters must call this same action; no separate appearance mutation.
The fixed properties bar edits all three paints; no pattern engine is implied.

## Automatic persisted right-angle wall connections — 2026-10-05

Schema 6 requires storey.wallJoins, each relating two stable wall IDs and endpoint
indices. V1–V5 migration initializes no joins: old touching geometry is preserved.
No separate editable miter geometry is stored. Shared addWall/updateWall reconcile
new or moved endpoints before returning a validated snapshot. An unchanged old
endpoint does not acquire a new connection merely because another property or
the opposite endpoint changes. End coordinates must match exactly (the shared
snap engine supplies exact targets); model tolerance is not an identity radius.
Candidate lookup scans only the changed wall's ends, not all wall pairs.

User decisions now confirmed: openings must not touch the joined end boundary;
moving a wall away removes the relation and restores straight ends on both sides.
The movement and relation change share one history commit. Connected walls with
unequal height/thickness, non-right angles, multiple ends at a node or invalid
opening/profile geometry reject atomically. A T contact is not an endpoint join.
Editing one connected wall's height/thickness may therefore require detachment
first; propagation to a whole group remains future work.

Domain connections.ts composes both end contours per wall and validates openings.
It shares contour-solid.ts with the earlier explicit-pair path. Immutable project
identity caches disposable derived solids. Plan profiles, 3D material/picking,
snap corners and ordinary IFC export consume these results before visibility
filtering. Joined physical corners are snap references, not independent endpoint
grips; authoritative axis grips remain editable through existing EditSessions.
Persisted file relations undergo the same geometry validation. No UI-only joins.
The previous temporary dialog remains diagnostic, not a commit requirement.

Wall-chain transaction implemented 2026-10-06: application/drawing/wall-chain
owns an ephemeral snapshot-bound draft. Each accepted point uses createDrawing
and existing Domain join validation; stable wall IDs survive completion. The
plan renders the draft only as a disposable preview. Authoritative project,
navigator, save and IFC remain unchanged until finishWallChain supplies one
history commit. Undo/Redo affects the whole chain as explicitly requested.
Escape/tool changes discard the draft; changed project identity prevents stale
completion. Shared drawingInteraction supplies precision, construction origins
and path references, with no separate snapping or polar calculation.
Click appends, Enter on the canvas or double-click completes. Numeric Enter in
the shared form accepts the next point. One-segment chains are valid. Invalid
continuations preserve prior accepted segments. Current right-angle join limits
still apply; collinear subdivision and arbitrary-angle connections are deferred.

## Revised wall-axis interaction decision — 2026-10-05

The new user direction supersedes explicit-menu-only connections: snapping wall
axes together is to connect their bodies automatically. Continuous wall chains
are the subsequent drawing goal. The pair-preview dialog is a diagnostic aid,
not the required future modelling workflow. Automatic joins and chain drawing
are not implemented by this axis correction.

Application createDrawing places new wall bodies left of the directed axis
(bodyOffset = thickness/2): the axis is the right edge. Existing placements stay
unchanged. Low-level addWall retains its centred compatibility default. New
explicit placements are limited to half-width by Domain axis-position; thickness
changes retain relative axis placement through shared updateWall. Historical V5
files with outside axes still load without relocating bodies/windows; new axis
placements cannot reproduce them. An explicit legacy conversion is future work.

Selected axes share a turquoise overlay in plan/solid. Plan axis clicks project
to the exact axis; endpoint handles use existing EditSessions and universal
construction origins. Coincident corners cannot hide axis handles. No duplicate
snapping/movement logic. Changing body offset keeps the axis fixed and moves the
body, consistent with the previous user decision.

## Explicit temporary corner preview — 2026-10-05

Application walls/corner-preview owns validation and the snapshot-bound derived
result for one explicitly chosen pair of wall ends. It invokes the existing
domain corner-solid service. Changing the source project invalidates the result;
there is no automatic pair search, mutation, history entry or persisted join.
The UI dialog selects stable wall IDs/endpoints and presents existing plan and
solid viewports. Closing/Escape discards the preview. Ordinary model views and
the normal IFC export remain unchanged.

The plan consumes the exact derived local profiles. The solid display adapter
replaces the two original wall surfaces with domain-derived opening-cut faces;
unrelated walls remain intact. Display faces may be convex planar polygons.
Rendering and depth picking share Geometry's triangle-fan iterator so neither
silently drops vertices after the fourth. This is not a general triangulator
for concave polygons. Renderer meshes never become model or export authority.
Currently unsupported corner-opening contacts remain a limitation, not a new
product policy. Persistent connections await the outstanding end-contact and
detachment decisions documented in docs/WALL_CORNER_PLAN.md.

## Implemented BIM visibility and independent palette history — 2026-10-05

This section supersedes the preparation-only status below. Existing plan/solid
viewports consume the shared visibility policy for geometry, picking, snapping,
active references and 3D occlusion. The BIM palette now supplies the persisted
working filter; explicit DrawingDocument contexts remain independent.

User decision: global undo/redo changes model data only. Visibility has separate
undo/redo buttons and a bounded session history in the Application controller.
Application layer visibility actions replace the current setting without adding
a geometry-history entry or clearing model redo. Model undo/redo carries the live
filter forward and removes IDs absent from the restored layer catalogue. Palette
history never creates layers. A restored layer absent from the live filter is
visible. Loading resets palette history; pending geometry previews are discarded.

Canonical runtime/file schema is 3, with required bimVisibility.hiddenLayerIds.
The file adapter strictly validates V1/V2 before explicit all-visible migration;
runtime validation does not migrate or silently repair snapshots. Save preserves
the current filter; history stacks are not serialized. Full geometry, real wall
openings and IFC scope remain independent of display filtering. New drawing
filter initialization is still undecided. Browser acceptance remains outstanding;
automated migration/history/rendering checks do not substitute for it.


## Prepared layer display snapshot — 2026-10-05

rendering/viewport/layer-display.ts derives plan wall/window/line lists and wall
surfaces through the shared eligibility policy. Physical plan openings are a
separate, non-pickable list, independent of window-symbol visibility. Full model
geometry is built before filtering faces. DisplaySurfaces deliberately excludes
quantity/volume data and retains complete-model bounds to avoid implicit refitting.
The existing wall picker and occlusion classifier accept those surfaces, so the
same displayed faces determine both hits and depth. canPick guards delayed plan
events against changed project/context identities. No second Project is created.

This adapter is tested but not yet consumed by BimPlan/BimSolidView. Viewport
binding, gesture cancellation and the remaining source/picking consumers must be
integrated before visibility switches are exposed. No UI or file format change.

## Layer-aware local source queries — 2026-10-05

application/tools/snapping.ts now offers createVisibleToolSourceQuery bound to
Project, the shared visibility policy/context and the existing tool policy.
It reuses the cached primitive index. Eligibility applies before density and
intersection enumeration and to remote active sources and flattened dependencies.
Derived reference IDs are not treated as model element IDs. The exact pinned
interaction origin remains available independently of excluded model targets;
stale project/context bindings suppress even that origin. Consumers must replace
the query on model/filter changes, never on zoom. Existing callers without an
eligibility binding retain their all-visible behavior.

This is the source-query integration only. UI still supplies no persisted filter.
Controller cancellation on hidden edit targets, explicit Shift origins, renderer,
3D foot-edge sources and explicit reference pickers need the same context before
exposing a visibility switch. Do not claim complete viewport visibility yet.

## Implemented layer eligibility policy — 2026-10-05

application/layers/visibility.ts supplies a pure snapshot-bound policy for current
walls, windows and lines. Its frozen context has an explicit bim-project or
drawing-document scope and independent hidden layer IDs. Drawing filters never
intersect a BIM working filter. A hidden host makes its window ineligible.
The policy validates once, builds ID maps once and returns a reason for each
decision; mismatched Project or context identity and unknown targets fail closed.
Callers must use immutable Project snapshots and rebuild on model/filter changes.
The document ID is a binding token, not a claim that schema 2 contains documents:
future binding adapters must validate document existence. No UI, persisted filter,
export filtering or per-tool implementation is introduced in this slice.

## Layer visibility scopes — user decision 2026-10-05

The BIM project and its derived working plans, sections, elevations and 3D views
share one layer visibility context. DrawingDocuments (Ausschnitte/Abbilder) have
independent layer visibility contexts. A layout rendering of a DrawingDocument
uses that document's context. BIM-project visibility is not an upstream mask:
a layer hidden in the working model can remain visible in a DrawingDocument.
All contexts reference the same authoritative elements; no building copies.

Persist these settings in the project. Hidden elements are ineligible for normal
picking and snapping; hiding an edit target cancels its pending edit without
committing the preview. Window display requires both its own layer and its host
wall to be visible in the effective context. Real wall openings and the complete
IFC export remain unchanged. One Application eligibility policy serves all views
and tools. This resolves the earlier open scope, persistence and host questions.
Initial filters for newly created DrawingDocuments and visibility undo semantics
remain open. See docs/LAYER_VISIBILITY_PLAN.md; no visibility implementation yet.

## Implemented: layer data and schema-1 migration — 2026-10-04

The canonical runtime is now schema 2. domain/project/schema.ts owns current and
legacy validation with shared geometry/identity invariants; domain/layers/model.ts
owns the standard layer catalogue. Project stores layers, explicit defaultLayerIds
for wall/window/line creation, and a required layerId on each existing element.
Default IDs, rather than editable names or array positions, drive creation.
interop/project-file/load.ts validates schema 1 before deterministic migration and
validates schema 2 afterwards; current files are never silently repaired. The old
lib/bim/model exports remain a compatibility facade, without a dependency cycle.

application/layers/actions.ts provides previewLayerAssignment and
commitLayerAssignment for stable element IDs and a pinned project snapshot.
Missing targets, stale context and invalid layers reject the entire request;
successful changes use existing snapshot history and no-ops keep history unchanged.
Existing creation paths receive defaults at addWall/addWindow/addLine, not in each
tool. This step adds no visibility filter, layer management UI or language parser.
Future UI/Text/Voice adapters must use these actions. Organisation has no effect
on wall material, hosted openings, coordinates or current IFC output.

The schema-2 addition defaultLayerIds makes defaults survive renaming and
migration-ID collisions. Windows default to the separate Fenster layer; no host
membership inheritance is introduced. Visibility decisions below remain open.

## Layer persistence boundary — decision 2026-10-04

The bounded [layer contract](docs/LAYER_CONTRACT.md) records the inspected schema-1
baseline, retained requirements and the next migration task. No layer code exists
at this decision point. Organisation layers have stable project-wide IDs; element
membership must resolve to those IDs and must not be inferred from mutable names.
Layer membership does not change AssemblyLayer, annotation scope, host relations,
height binding or editing capabilities. File migration validates old input before
conversion and the current model afterwards; runtime validation must not silently
migrate snapshots during editing. Preserve existing element IDs and geometry.

Future layer visibility is one application-level eligibility policy consumed by
rendering, picking and local snapping, including active reference dependencies.
Apply it before local intersection enumeration. Model-only geometry caches remain
derived; view-specific eligibility must not leak between panes or outlive a changed
visibility context. Visibility never changes wall openings or the export scope.
Global versus per-view visibility, persistence of that preference and host/window
display combinations remain open product decisions. The schema-2 field proposal
and window default in the linked contract are implementation proposals, not claims
of user decisions or implemented behaviour.

## Incremental integration: 3D wall movement on z=0 — 2026-10-04

The first 3D move adapter uses the existing EditSession, editInteraction, ToolSnapPolicy, previewEdit and editingReducer. It introduces no model mutation, numeric-input lifecycle, dwell timer or geometry solver of its own. useSolidInference connects the horizontal workplane to the same resolveToolSnap/useHoverReference path for passive preview and movement; SolidSnapPreview only presents the result.

An explicitly clicked visible wall footpoint supplies the model-space origin and stable wall ID. A wall-surface or Navigator selection without that point cannot silently start a 3D move at a guessed origin. Other actions retain the existing 2D entry. The shared policy immediately pins the origin and excludes moving geometry from targets. During a move, visibility tests use stationary wall material; moving preview material is not an occluder of its target sources. This is a bounded interaction rule, not general X-ray selection.

Projection fitting uses the committed model, never the moving preview. Camera/viewport changes rebuild the shared projection independently of geometry preview. A left click during movement fixes direction or confirms through ToolInteraction; it cannot also navigate. Explicit Pan suspends pointer targeting and never confirms on release. Wheel and keyboard camera navigation remain available. Invalid/stale projection blocks pointer targeting. Model/selection validation and one-step Undo/Redo remain application responsibilities. Free Z movement, point deformation and further element adapters are not included in this step.

## Extension: 3D wall endpoint editing — 2026-10-04

The wall-source adapter now resolves its known axis-end/corner feature identity to endpoint index 0 or 1. A midpoint or unknown feature has no endpoint index and must not become a point-edit grip. The clicked physical model-space corner remains the anchor; it is not replaced by the wall axis. BimSolidView forwards the stable wall ID, endpoint index and anchor to the existing selection/Direct Edit contract. The `point` action consumes the same workplane inference, projection frame and ToolInteraction as whole-wall movement; its existing click contract confirms the target directly. Corner offset correction, retained wall thickness/opposite endpoint, hosted opening validation and history stay in the existing shared application/model operations. Other constrained actions still use their previous 2D entry until explicitly integrated.

## Extension: constrained wall edits on z=0 — 2026-10-04

The existing stretch/axis/x/y actions now enter the same 3D workplane interaction as move/point. `supportsWallWorkplaneEdit` is the single application capability check used at entry and by the viewport: only walls, and point/stretch require endpoint index 0 or 1. An explicitly selected footpoint is required for every entry. No axis solver or numeric widget was added. `editDirection`, `resolveEditSnap`/fixedAxis and numericMoveAxis remain authoritative for direction and signed distance; explicit axes take precedence over Shift/Ortho and remain constraints with Snap disabled. Stretch retains the opposite endpoint and checks hosted openings, while axis/x/y translate the whole wall. Existing Pan/confirmation isolation and transaction history are reused.

## Status

### Implemented: 3D wall foot-edge references — 2026-10-04

The existing primitive spatial index now lives in constraints/snapping/local-source-index.ts, accepting geometric references and segments. application/snapping/local-sources.ts retains its compatible project adapter and WeakMap cache. The query, proximity refinement and intersection completion algorithms are unchanged; there is no separate 3D spatial search.

rendering/viewport/wall-foot-sources.ts derives actual z=0 boundary edges through the existing mesh selection-edge extractor, keyed by wall ID and segment geometry and cached per immutable project. Floor-reaching openings therefore leave gaps. Coplanar face partitions can split a continuous foot edge into several reference segments; merging these is not claimed here. wall-preview-context combines locally indexed edges with its existing point sources and remote active dependencies. It excludes the moving wall and requires both the closest hovered point and segment midpoint to be visible. This conservative policy can reject a partly visible segment whose midpoint is hidden. Hidden portions cannot activate it through remote dependencies, which are offered as point-only sources outside an eligible local segment query.

The shared hoveredSegment/useHoverReference path owns 600ms activation, revisit removal, capacity and navigation suspension. Parallel directions and guides use the existing shared functions. SolidSnapPreview adds a dashed hover edge and stronger active edge behind wall pixels; the existing midpoint ring remains. No model or history action is introduced. Current scope is lower material edges on z=0, not wall axes, top edges or arbitrary 3D workplanes. Future adapters supply sources to these same services.

### Implemented: independent preview depth extent — 2026-10-04

ProjectionFrame now optionally carries depthRadius independently of its image-fitting radius. Omitting it preserves the original projection. The geometry helper projectionDepthRadius encloses displayed bounds around the fixed frame centre in camera-independent power-of-two tiers; XY scale and pan are untouched. Both orthographic depth and horizontal depth derivatives use the same extent. ProjectionState validates and snapshots it, and the workplane adapter preserves it.

BimSolidView derives one displayed ProjectionState from its camera/viewport snapshot and the depth envelope of both committed and preview geometry. Rendering, outline, picking, visibility and inference all consume this same projection/frame. Changing depth alone does not clear the pointer or active references; tier changes may suspend pending hover acquisition just like other projection changes. The image frame remains pinned to the committed model during preview. Normal viewport-edge clipping remains intentional. Finite GPU depth precision, the existing NDC visibility tolerance and outline bias limit distinguishability of extremely close surfaces in very large extents; this is not a large-coordinate precision overhaul.

### Implemented: shared 3D selection edges — 2026-10-04

`rendering/viewport/selection-outline.ts` derives boundary and crease segments from the selected entity's displayed polygon faces. It is independent of domain IDs and React; BimSolidView supplies the faces of the current selected wall, including edit preview geometry. No persisted selection or model copy is introduced. Equal-coordinate shared edges with matching unit normals are omitted, removing cell seams and triangle diagonals while retaining opening reveals. The input contract is a conforming mesh with identical shared vertex coordinates, as produced by buildSolid; future nonconforming adapters must subdivide T-junctions first.

Edges are cached by displayed geometry/selection and projected through the existing ProjectionState. CSS-width triangle ribbons (1.5px) use the same WebGL depth buffer as walls, with depth writes disabled and a 1e-6 NDC depth bias to avoid coincidence flicker. Hidden segments remain occluded; this is not X-ray selection. Depth bias is a rendering tolerance, not a model or snap tolerance. Current styling is a subtle light grey-blue border accompanying existing selection tint. Only an actual wall selection gets the border; selecting a window does not falsely outline its entire host as the selected object. Other element types need their displayed-face adapter when implemented, not separate outline algorithms. No large-scene, nonconforming-mesh or general solid topology support is claimed.

This document is the architectural source of truth for NOVIKOV CAD.

It describes the target structure for the application as it grows from the current Stage-1 BIM/CAD vertical slice into a complex, reliable and maintainable professional CAD/BIM system.

The rules in this document apply to all new implementation work unless a later documented architecture decision explicitly replaces them.

The current working system must not be rewritten merely to match folder names in this document. Migration is incremental: preserve working behaviour, tests and validated Stage-1 workflows while moving responsibilities behind clearer boundaries.

---

# 1. Architectural Goals

NOVIKOV CAD shall be designed for long-term growth, not only for the next visible feature.

The architecture must support, without fundamental redesign:

- large architectural projects
- 2D and 3D model views
- walls, openings, slabs, roofs, columns, stairs, rooms and future BIM element types
- stable element identity
- parametric editing
- snapping, inference, temporary guides and constraints
- precise drawing tools
- undo/redo and transactions
- project serialization and schema migration
- IFC and future interoperability formats
- multiple storeys and building structure
- selection and direct manipulation
- AI, text and voice commands
- automated tests
- later plugin/extensibility mechanisms

The primary architectural objective is controlled dependency flow.

Features must communicate through explicit interfaces and application actions instead of reaching across unrelated layers.

---

# 2. Core Dependency Rule

The intended high-level dependency direction is:

```text
UI
 ↓
Application
 ↓
Domain
 ↓
Core / Geometry
```

Supporting adapters depend on the domain/application model, not the other way around:

```text
Domain → Rendering Adapter
Domain → IFC Adapter
Domain → Project File Adapter
AI     → Application Commands
Voice  → Application Commands
```

The following reverse dependencies are forbidden:

```text
Core       → React
Geometry   → UI components
Domain     → toolbar / dialogs / icons
Domain     → IFC-specific structures
Domain     → renderer-specific meshes
Geometry   → BIM wall/window concepts
```

A low-level module must never import a higher-level presentation concern.

---

# 3. Current System and Migration Policy

The current integrated Stage-1 implementation already contains valuable, tested functionality:

- validated immutable project snapshots
- stable entity IDs
- walls and hosted windows
- drawing lines
- project serialization/deserialization
- history with undo/redo
- text/voice command interpretation
- command preview and stale-context protection
- direct editing and transforms
- 2D/3D views
- geometry generation
- picking
- IFC export
- project files
- workflow tests

These features are assets and must be preserved.

Do not perform a broad rewrite.

Refactor only when a feature requires crossing a boundary that this document defines, and keep the application in a working state after every change.

The current `src/lib/bim` directory is considered a transitional structure, not the permanent home for every CAD subsystem.

New generic systems such as snapping, guide inference, geometric primitives, transactions or tool runtime must not automatically be added to `src/lib/bim`.

---

# 4. Target Module Structure

The long-term structure should converge toward the following responsibilities.

```text
src/

  core/
    ids/
    events/
    transactions/
    dependency/

  geometry/
    primitives/
    transforms/
    intersections/
    projections/
    solids/
    tolerances/

  domain/
    project/
    building/
    elements/
      wall/
      opening/
      line/
      slab/
      roof/
      room/

  application/
    commands/
    history/
    selection/
    tools/
    direct-edit/
    shortcuts/

  constraints/
    snapping/
    guides/
    inference/
    ortho/

  rendering/
    plan/
    solid/
    picking/
    viewport/

  interop/
    project-file/
    ifc/

  ai/
    commands/
    voice/
    context/

  ui/
    workspace/
    toolbar/
    navigator/
    inspector/
    statusbar/
    commandbar/

  app/
    routing/
    providers/
    bootstrap/
```

This is a responsibility map, not a requirement to create all folders immediately.

Avoid empty architecture scaffolding that has no implementation need.

---

# 5. Core Layer

The Core layer provides infrastructure that is independent of architecture-specific BIM concepts.

Typical responsibilities:

- stable IDs
- model change events
- transactions
- dependency tracking
- generic registries
- change sets

Core must not know about React, IFC, toolbar state, wall rendering or voice commands.

Future dependency graphs and transaction systems belong here when they become necessary.

---

# 6. Geometry Kernel

Geometry is a reusable mathematical subsystem.

It must not be implemented as BIM-specific wall code.

Expected reusable concepts include:

```text
Point2
Point3
Vector2
Vector3
Segment2
Ray
Plane
Polyline
Polygon
Transform
BoundingBox
Intersection
Projection
Distance
Angle
Tolerance
```

Later solid/mesh operations may extend this subsystem.

Architecture-specific entities may use geometry primitives:

```text
Wall → Segment / profile / dimensions
Opening → host-relative placement
Slab → polygon / elevation / thickness
```

But geometry primitives must never import `Wall`, `Window`, `Slab` or other BIM entities.

Numerical tolerances must be centralized instead of scattering arbitrary epsilon values throughout tools and geometry code.

---

# 7. Domain Model

The Domain layer describes what exists in the architectural project.

Examples:

- Project
- Building
- Storey
- Wall
- Window / Opening
- Slab
- Roof
- Room
- Drawing Line
- Material
- Layer

Domain entities require stable project-wide IDs.

Relationships are represented by IDs or explicit references instead of embedding mutable duplicate objects.

Example:

```text
Window
  id
  wallId
  width
  height
  sillHeight
  position
```

not:

```text
Window
  wall: { complete duplicated wall object }
```

Domain models must contain architectural meaning and validated parameters, not React components, Lucide icons, CSS state, Three/WebGL objects or IFC entities.

---

# 8. Project Model and Single Source of Truth

NOVIKOV CAD must have exactly one authoritative project/model state for a running document.

The following must derive from the same model state:

- floor plan
- 3D view
- inspector/property values
- project navigator data
- selection references
- measurements
- IFC export
- project save/load
- AI context

Do not create independent shadow copies of walls, openings or drawing geometry for individual views.

Derived rendering data may be cached, but it must be disposable and reproducible from the authoritative model.

Renderer state is not project state.

---

# 9. Commands and Application Actions

All meaningful user-visible model modifications should converge on shared application operations.

Examples:

```text
CreateWall
UpdateWallParameters
MoveWall
InsertOpening
MoveOpening
CreateLine
DeleteEntity
```

The same operation should be reusable from:

- mouse tools
- keyboard shortcuts
- properties inspector
- direct-edit UI
- AI text commands
- voice commands
- future macros or plugins

Do not create a separate model-manipulation path for AI.

AI and voice are input adapters, not privileged model editors.

Preferred flow:

```text
Input
 ↓
Interpret / gather parameters
 ↓
Application action / command
 ↓
Validation
 ↓
Transaction / history
 ↓
Domain model
```

---

# 10. Command Preview and Safety

The existing preview-before-apply pattern for interpreted commands is part of the architecture and should be retained.

AI/text/voice commands must bind to stable selected IDs and must reject stale context if the project or selection changed after preview.

Potentially destructive or broad actions should expose a clear preview or confirmation path.

Natural-language interpretation must not silently guess a target when selection/context is ambiguous.

---

# 11. Transactions and Undo/Redo

The current full-project snapshot history is accepted for the present project scale because it is simple, reliable and already tested.

Do not replace it prematurely.

However, future architecture must permit migration toward explicit transactions/change sets when model size makes complete snapshots inefficient.

A future transaction may represent operations such as:

```text
CreateEntity
UpdateProperty
TransformEntity
DeleteEntity
```

Undo/redo belongs to the application/core boundary and must not be implemented independently by UI components.

Every committed editing action should produce one understandable undo step unless the workflow explicitly defines grouping.

---

# 12. Tool Architecture

A CAD tool is not a CAD entity.

Examples:

```text
WallTool ≠ Wall
LineTool ≠ DrawingLine
SelectionTool ≠ Selection state
```

Tools manage interaction workflows and eventually should behave as explicit state machines.

Typical wall-tool flow:

```text
Idle
 ↓
AwaitFirstPoint
 ↓
AwaitSecondPoint
 ↓
Preview
 ↓
Commit CreateWall
```

Tools may request snapping and geometry services, but they must not duplicate them.

Avoid implementing separate snapping logic in every drawing tool.

---

# 13. Selection Architecture

Selection is shared application state, not an implementation detail of a particular viewport.

All input surfaces must use stable entity IDs.

2D plan selection, 3D picking, Navigator selection, Inspector context, AI context and direct-edit context must converge on the same selection abstraction.

A renderer may report a picked render primitive, but it must map that result back to a stable domain entity ID before editing commands execute.

---

# 14. Snap, Guides and Inference Architecture

The Stage-2 snapping and guide system must be implemented as a reusable subsystem, not embedded in individual tools or React components.

Target responsibility:

```text
constraints/
  snapping/
  guides/
  inference/
  ortho/
```

The snap/inference system may consume generic geometry and model-derived references such as:

- endpoints
- midpoints
- intersections
- perpendicular projections
- parallel directions
- extensions
- grid points
- angle constraints
- temporary reference points

Preferred API concept:

```text
SnapEngine.query(cursor, context) → candidates
```

A candidate should contain enough information to explain and display why it was selected, for example:

```text
kind
worldPoint
distanceOnScreen
sourceEntityId
sourceFeature
direction
priority
```

Snap priority and visual indication must be deterministic and testable.

Hover dwell/reference activation belongs to interaction/inference logic, not to the BIM entity definitions.

The snapping subsystem must use the existing authoritative model and shared geometry primitives. It must not create a parallel CAD model.

---

# 15. Rendering Boundary

Rendering is a projection of the model, not the model itself.

A wall is a domain entity.

A mesh, SVG polygon, WebGL buffer or CSS drawing is a render representation.

Render representations may be deleted and rebuilt without destroying project information.

Preferred direction:

```text
Domain entity
 ↓
Geometry / render adapter
 ↓
Render representation
 ↓
Viewport
```

UI components must not become the authoritative owners of BIM geometry.

---

# 16. 2D and 3D Views

2D and 3D views must represent the same project entities.

Do not maintain separate editable `2DWall` and `3DWall` domain models for the same wall.

View-specific data such as camera, zoom, section plane, visibility or render style may be separate view state.

Model geometry and architectural properties remain shared.

---

# 17. IFC and Interoperability

IFC is an adapter at the system boundary.

The domain model must not be designed around IFC implementation details.

Preferred flow:

```text
NOVIKOV Domain Model
 ↓
IFC Mapping / Export Adapter
 ↓
IFC
```

IFC export must read the same authoritative project state used by the UI and renderer.

No independent export-only model should be introduced.

Tests should continue to verify placement, dimensions, host relationships and expected exported geometry.

---

# 18. Project Files and Schema Evolution

Serialized project data requires an explicit schema version.

Loading must validate:

- supported schema version
- IDs
- entity references
- units
- required properties
- geometric validity where applicable

When future features change the file model, introduce migrations instead of silently interpreting incompatible files.

Project persistence is separate from UI state.

Temporary UI state such as hover, active menu or current tooltip must not be stored as architectural project data.

---

# 19. AI and Voice Architecture

AI is a first-class interaction method but not a separate CAD engine.

The intended architecture is:

```text
Natural language / Voice
 ↓
Intent + explicit parameters
 ↓
Target/context validation
 ↓
Application command
 ↓
Preview if required
 ↓
Normal validated model operation
```

Any operation available through AI should, where practical, reuse the same operation used by conventional UI controls.

Do not place model mutation logic in `AiCommandBar`, speech-recognition components or prompt handlers.

---

# 20. UI Architecture

React components are presentation and interaction adapters.

They may:

- display application/model state
- collect user input
- dispatch application actions
- display previews, errors and validation results
- maintain ephemeral presentation state

They should not become the permanent owner of project/domain state.

`CadWorkspace` may orchestrate layout and temporary UI state, but long-term project editing responsibilities must migrate to application/domain services rather than continuously enlarging `CadWorkspace.tsx`.

Examples of acceptable local UI state:

- panel open/closed
- popover visibility
- active viewport chrome
- temporary hover state

Examples that should become shared application/model state:

- authoritative project
- committed selection
- edit history
- active editing transaction
- domain commands

---

# 21. Import Rules

Use the following dependency principles when adding imports.

Allowed examples:

```text
ui            → application
ui            → domain read types
application   → domain
application   → geometry
constraints   → geometry
constraints   → domain read adapters
rendering     → domain
rendering     → geometry
interop       → domain
```

Forbidden examples:

```text
geometry      → domain/wall
core          → React
core          → rendering
core          → interop/ifc
domain        → components/cad
domain        → lucide-react
domain        → browser DOM APIs
```

If a circular dependency appears, do not solve it by moving unrelated code into one large shared file. Reconsider the responsibility boundary.

---

# 22. Testing Strategy

Architecture-critical behaviour requires tests at the lowest practical layer.

Examples:

Geometry tests:

- intersections
- projection
- tolerance behaviour
- transforms

Domain tests:

- entity validation
- host relationships
- wall/opening rules
- stable IDs

Application tests:

- commands
- undo/redo
- stale command preview rejection
- selection-aware editing

Interop tests:

- save/load roundtrip
- schema rejection/migration
- IFC placement and dimensions

Workflow tests:

- representative end-to-end user sequences

Browser/manual acceptance tests remain valuable for interaction quality, but they do not replace lower-level deterministic tests.

---

# 23. Performance Rules

Do not optimize blindly, but avoid architectural choices that make large models impossible.

Prefer:

- stable IDs
- derived/cached render data
- local invalidation instead of unnecessary global recomputation when scale requires it
- explicit model changes
- disposable render representations

Avoid:

- duplicating complete project data per viewport
- storing React nodes in domain state
- serializing UI-only state into every model snapshot
- O(n) global scans in pointer-move loops once spatial indexing becomes necessary

Spatial indexes, dependency graphs and incremental recomputation should be added when profiling demonstrates need, without breaking domain boundaries.

---

# 24. Feature Development Rule

Before implementing a new feature, answer:

1. Which layer owns the feature?
2. Which existing model is authoritative?
3. Which application command/action changes the model?
4. Which geometry service is reused?
5. How does undo/redo work?
6. How do 2D and 3D remain synchronized?
7. How does selection identify targets?
8. Does save/load preserve the result?
9. Does IFC need to reflect it?
10. What automated tests prove the core behaviour?

If these answers imply duplicate models or direct cross-layer mutation, stop and redesign before adding more code.

---

# 25. Stage-2 Rule: Snapping Before Feature Expansion

The next precision-drawing stage must strengthen the architecture rather than add isolated UI behaviour.

Before expanding to many new BIM element types, establish reusable foundations for:

- geometry primitives
- tolerance policy
- snap candidates
- snap ranking
- reference activation
- temporary guides
- intersections
- projections
- precise input

Wall, line and future slab/roof tools should consume these shared capabilities.

Do not implement tool-specific versions of the same geometric rule.

---

# 26. Migration Priorities

Migration should be incremental in approximately this order:

1. Keep the current validated Stage-1 workflow green.
2. Establish this architecture contract.
3. Extract reusable geometry primitives as Stage-2 requires them.
4. Introduce the constraints/snap subsystem outside `src/lib/bim`.
5. Move shared editing orchestration out of the growing `CadWorkspace` when practical.
6. Split the BIM model into domain modules as new element types make the current file too broad.
7. Introduce a formal transaction/change-set layer only when project scale justifies moving beyond snapshot history.
8. Add new BIM element families on top of the resulting shared foundations.

Do not perform all migrations in one pull request.

---

# 27. Definition of Architectural Done

A feature is not architecturally complete merely because it works visually.

For a model-changing feature, completion normally requires:

- one authoritative model representation
- stable IDs
- validation
- use from the intended UI workflow
- undo/redo behaviour
- 2D/3D consistency where relevant
- save/load consistency where relevant
- IFC consistency where relevant
- deterministic automated tests
- no prohibited dependency direction

---

# 28. Rule for Codex and Future Contributors

Before changing architecture-sensitive code:

1. Read `ARCHITECTURE.md`.
2. Read `DEVELOPMENT_PLAN.md`.
3. Read feature-specific specifications such as `F13_HILFLINIENSYSTEM.md` when applicable.
4. Inspect existing tests and reuse current validated model operations.
5. Prefer a small migration plus feature step over a large rewrite.
6. Keep the repository buildable and testable after each commit.

If a requested implementation conflicts with this architecture, do not silently bypass the rule. Document the conflict and propose the smallest architecture-consistent change.

---

# 29. Views, Drawing Documents and Layouts — decision 2026-10-03

**Binding architecture decision, not implemented functionality.** Adopted for the user's documentation task of 2026-10-03. The companion function architecture remains a proposal except for the rules explicitly adopted here. No new schema, class hierarchy, rendering engine or database is mandated by these names.

- **ModelView** defines a model-derived floor plan, section, elevation or 3D view, with stable identity and explicit definition (e.g. storey or section plane). It references the authoritative project; it owns no duplicate building elements.
- **DrawingDocument** references a ModelView by ID and owns saved crop, output scale, visibility/style overrides and document-scoped additions. Its building projection is regenerated from the current model. A frozen export is an output artifact, never an independently editable building copy. Missing source references must be surfaced, not silently replaced.
- **Annotation scope** must be explicit and validated: a storey-scoped 2D addition, a particular ModelView, a DrawingDocument or a Layout. The owner is identified by stable ID; no implicit propagation between scopes. Dimensions may reference stable model features independently of their display scope; deletion or topology change must expose unresolved references. Existing storey lines retain their current scope during migration. Text and hatch schema details remain proposals.
- **Layout / MasterLayout** describe paper composition and reusable page format/title-block definitions. A layout placement (working name LayoutViewport) references a DrawingDocument and stores placement/crop/output-scale settings; it does not embed its elements. Deleting a referenced master/document requires explicit dependency handling. Paper units and output scale are distinct from model metres and screen pixels.
- **ViewportBinding** routes one on-screen pane to a ModelView, DrawingDocument or Layout through a typed ID reference. Each pane has an independent camera/navigation context; focus determines the receiving pane. Project, committed selection and application actions remain shared. Screen panes and paper LayoutViewports are different concepts. Persistence of pane arrangements is not decided here.

Responsibility boundaries: saved view/document/annotation/layout definitions belong to the domain; validated changes, reference resolution, capabilities and history to application; projections and drawing to rendering/geometry; file migration and output to interop. Proposed folders such as domain/views and domain/documents are responsibility labels, not a requirement to create empty modules.

Saved definitions and annotations may initially share the versioned Project file and existing snapshot history. Hover, temporary guides and open menus remain ephemeral. Model actions and document actions are distinct typed operations through the same validated application/history boundary; no second BIM history or state store is introduced by a canvas pane. New persistent types require reference validation, migration from schemaVersion 1, round-trip and undo tests before release. Navigation alone must not produce model history entries.

# 30. Editing, Layers, Heights and Input Contracts — decision 2026-10-03

**Binding technical rules for future implementations:**

1. Plan, section, elevation and 3D hits resolve to a stable source element ID and supported feature plus view/work-plane context. They invoke the same validated application action. A generated section edge is not automatically an editable wall vertex. Document-decoration mode must be distinguishable from model editing; changing a view override never changes a material or component.
2. **Layer** is organisation/visibility; **AssemblyLayer** is a material/construction stratum within an assembly. Their IDs, operations and meanings must remain distinct. Elements may reference both. Display overrides cannot alter assembly thickness. Standard organisational layers from the previous guide remain requirements; additions do not rename them implicitly.
3. **Height binding** distinguishes fixed dimensions from storey-bound lower/upper references with offsets. Storey changes affect bound components, not fixed-height components by accident. Derived height must not become an independently editable duplicate. Validate dependent openings and other affected elements atomically before committing. Existing numeric wall heights migrate without silently acquiring storey bindings. Exact schema, defaults and user choices for new components remain open.
4. Each new checked model or document action must expose a typed parameter/target contract for mouse, properties, shortcuts and AI/Text/Voice adapters. Context includes stable target IDs, target kind/scope, originating view/work plane when relevant, and a model/document revision or equivalent snapshot identity. Preview and apply reject changed targets or stale context. Ambiguity is clarified, never resolved by guessing another nearby element. Creation uses explicit container/host IDs; it cannot require a pre-existing created-element ID.
5. Action acceptance includes adapter tests for the supported text intent and simulated voice transcript, invalid parameters and stale context; real speech-recognition quality is a separate test. An unsupported intent is reported explicitly. Neither AI nor speech components contain geometry, validation or independent model mutation.

**Binding user restriction and required application guard for N25:** proportional scaling is allowed only for genuine 2D entities and imported PDF references. BIM/3D objects (including walls, windows, doors, slabs and roofs) remain forbidden even when rendered in a 2D view or DrawingDocument. The future scaling action must resolve authoritative target types/capabilities and validate _every_ target before preview or commit. If any target is forbidden or unresolved, reject the entire selection without partial changes or a history entry. Hiding a toolbar command is insufficient; direct action calls, AI/Text/Voice and imported/reloaded references must pass the same guard. Validate finite positive lengths, nonzero measurement baseline, anchor and target revision. Uniform scale and an explicit anchor form the proposed calibration contract; text/style scaling semantics need separate definition.

No scaling action exists in the inspected code. This documentation records its mandatory implementation gate; it does not claim executable enforcement has been added. Required acceptance cases: permitted drawing line/PDF; BIM wall selected in plan and section rejected; mixed line/wall selection rejected atomically; stale target rejected; valid operation preserves IDs and supports one undo/redo and JSON round-trip. Update 2026-10-07: the user explicitly permits two-point calibration of imported PNG/JPEG images as well. This supersedes the bitmap exclusion only; BIM scaling remains forbidden.

**Open user meanings — no default invented:** D versus Ctrl+D; whether a wall-axis switch preserves physical wall position or the drawn reference axis; the 3D export format/contents; undo grouping for wall chains. These block only their respective implementation. Detailed field names, folder layout, PDF decomposition approach, solid-library choice, per-annotation styling and layout-template linkage mechanics remain proposals until separately decided.

---

# Architectural Principle

NOVIKOV CAD is not built as a collection of UI features.

It is built as a reliable modeling platform whose UI, AI, rendering and interoperability layers all operate on the same validated architectural model.


## Shared precision input — implemented boundary (2026-10-03)

Decision: polar tool input is shared across direct edit and straight-line drawing.
`PrecisionInput` owns presentation only. `usePrecisionDraft` owns transient angle/length, mouse aim and focus for a stable interaction identity; a new identity starts with empty inputs. `application/input/precision.ts` parses text through the core unit parser and delegates target calculation to `constraints/input/polar.ts`. These shared services contain no BIM mutation or renderer dependencies.

Tool adapters supply origin and current aim, validate tool-specific constraints and confirm through existing model/application actions. Line drawing rejects zero length and changed model context; direct edit retains its pinned selection, axis and opening constraints. Numeric targets take precedence over mouse snapping. There is one helper component and one draft hook, not a copied form/state machine per tool. The existing workspace coordinates these consumers; migration of its remaining legacy drawing orchestration is incremental. AI/Text/Voice must use the same validated actions, not React draft state or separate model logic.

Currently connected: element/point movement, point stretching, single straight-line drawing and straight-wall drawing. Polyline segments also consume this contract; other tools remain future precision-input consumers.


## Universal movement origin — binding interaction rule (2026-10-03)

Every interactive movement starts with a pinned construction reference at the chosen point, immediately and without hover dwell. This applies to point movement, whole-element movement, stretching and axis-constrained movement, including hosted elements. Future slabs, roofs, stairs, furniture and other elements must use the same interaction/constraint pipeline; origin activation is not an optional per-tool feature.

The origin stays at the original model-space position during preview and zoom. Shared inference supplies cursor-dependent guides, additional hover references and intersections. Do not display every possible guide simultaneously. Explicit axis/host constraints and model validation still take precedence; a window remains on its wall. User-controlled Snap disable remains respected. Completion/cancellation removes the session origin without committing construction geometry. Future 3D movements must supply the active work-plane context to this same system.

Implementation: application/direct-edit/snapping.ts supplies the session origin for all current EditActions and targets. BimPlan/useHoverReference already consume it through the shared pinned-reference contract. New element adapters supply anchor and geometric directions, not copied inference code.


## Segment tracking and shared precision keyboard interaction (2026-10-03)

Tracked straight segments use the same transient hover state, 600 ms acquisition/removal and screen-space tolerance as point references. Project adapters expose segment snapshots; the generic inference service identifies a hovered segment. A stable segment midpoint identifies the reference while the cursor moves along its interior. Exact point candidates take precedence. Its direction becomes a parallel option through active construction origins. Overlay and snap resolver use the same guide-direction service; no per-tool parallel logic. Existing source exclusion, geometric constraints, reference limits and model/zoom invalidation rules continue to apply.

PrecisionInput centrally handles Tab during an active interaction: from the viewport into length, then angle, then length. On first entry the current mouse direction is captured at full precision through the input adapter, not from the rounded display hint. Enter confirms, Escape cancels. Unrelated text fields keep their normal keyboard behaviour. Explicit axis constraints retain a read-only angle. All future consumers must use this shared keyboard contract. Free point movement now consumes the same polar adapter as whole-element movement.


## Shared drawing application boundary (2026-10-03)

Drawing actions for straight walls and lines/polylines now converge on application/drawing/actions.ts. It validates the pinned model context and delegates creation to existing addWall/addLine domain operations. Mouse and numeric confirmation use the same action and history path. previewDrawingInput shares the polar text adapter; the former line-input export remains compatible. CadWorkspace still coordinates pointer collection and presentation, but no longer calls addWall/addLine directly. Defaults for a drawn wall remain 0.36 m thickness and 2.80 m height. Drawing preview is a 2D axis guide; the confirmed wall supplies the existing 3D rendering.


## Shared tool interaction lifecycle — implemented refactor (2026-10-03)

Binding contract: application/tools/interaction.ts defines ToolInteraction with a stable identity, origin, input constraints, click intent, preview, validation, commit and cancellation. It has no React or element-type dependency. evaluateInteraction evaluates without mutation; confirmInteraction revalidates before invoking a model action.

application/tools/adapters.ts adapts existing Direct Edit and Drawing actions to this contract. Fixed axes, window constraints and the distinction between point and element mutation belong here or in the existing validated model actions. They must not be reimplemented in the input component or viewport click handler.

useToolInteraction runs one shared draft/preview/pick/confirm/cancel lifecycle. InteractionInput binds it to the single PrecisionInput, including shared Tab behaviour. CadWorkspace selects an adapter and connects existing project/history actions; it no longer owns the tool-specific numeric preview switch or form confirmation branches. BimPlan forwards picked targets without deciding which edit action locks a direction. Existing shared snapping, hover references, origins and geometric projection services remain in place.

Migration limits: legacy point collection for drawing and rendering/edit-session plumbing still exist. This change does not claim a complete universal tool framework or a 3D work-plane runtime. Future input consumers implement the small adapter contract; adding one must not require copied Tab, hover, polar-input or form-confirmation logic.


Polyline reuse verified (2026-10-03): each last draft vertex supplies the existing drawingInteraction identity/origin. The same runtime, PrecisionInput, Tab and snapping services are unchanged. Numeric confirmation adds a draft vertex; completion uses one createDrawing/history commit. Invalid explicit input must not be silently discarded by double-click/viewport Enter completion.


## Shared tool snapping context — implemented boundary (2026-10-03)

ToolInteraction now requires a ToolSnapPolicy: pinned origin, allowed-source filtering and the existing resolver. prepareToolReferences and resolveToolSnap form one application entry for idle hover, drawing and Direct Edit. The viewport supplies screen scale, cursor, modifiers and active references; it no longer constructs separate drawing/edit snap contexts or knows edit source-exclusion rules.

Drawing delegates to querySnap; Edit delegates to resolveEditSnap with its axis/host restrictions. These implementations retain their existing geometric responsibilities. No new snap mathematics. Policies are derived, weakly cached by immutable draft-point/edit-session identity so React rerenders and zoom do not discard reference identity; a new interaction obtains a new policy. Project changes still rebuild source snapshots. Render-only edit preview plumbing remains in the viewport.


## Modal keyboard ownership and interaction transitions (2026-10-03)

Modal dialogs own Tab and application shortcuts while open. PrecisionInput must not intercept navigation outside its own panel inside a dialog/alertdialog; workspace tool shortcuts likewise yield to modal content. Cancelling project-file confirmation preserves the suspended draft. Confirmed project replacement and history navigation clear edit/drawing context through the existing shared reset; Undo restores committed model state, never an old interaction session. Session identity checks reject delayed confirmations even after returning to an earlier model snapshot.


## Model-only snapping reference reuse (2026-10-04)

getProjectSnapReferences caches derived references by immutable Project object identity using weak keys. Tool policy, pointer, camera and construction origins are not part of that model cache. BimPlan obtains model references separately from prepareToolReferences so a new drawing origin or edit session only reapplies source filtering and its pinned origin. Changed/reloaded project objects build fresh references, regardless of reused entity IDs; Undo/Redo may reuse the matching historical snapshot. In-place model mutation is outside the immutable project contract. Cache entries are disposable, never serialized or authoritative. The uncached projectSnapReferences builder remains available for baseline/differential checks. This does not optimize first builds or pointer candidate scanning.


## Local snap queries — binding decision (2026-10-04)

Decision: replace production-wide intersection precomputation with local point/segment retrieval and local segment intersections. Reuse immutable model-space primitive data, a spatial index and a full source-identity lookup; do not index all potential intersections. The existing cached reference list is a transitional optimization, not this target implementation. CSS-pixel radii are converted per query; zoom and tool changes do not rebuild the model index. Long segments are indexed by their full extent, not just endpoints. Exact existing geometry, tolerances, ranking and tool source exclusions remain authoritative.

Immediate point/intersection snapping is independent of the 600 ms reference acquisition/removal delay. Active and pinned references are processed separately from local geometry; validate their original source dependencies against the complete snapshot lookup, never only the local result list. Local result-array changes must not reset hover sessions. Model changes/load/history must resolve the matching snapshot and preserve existing session invalidation rules. One shared query path serves drawing, Direct Edit and hover acquisition; no per-tool spatial engines.

Module responsibilities, integration hazards and acceptance cases: docs/LOCAL_SNAP_QUERY_PLAN.md. A static AABB tree, concrete API names and a full primitive-index rebuild on a new snapshot are proposals for the first implementation; incremental updates and index tuning remain evidence-driven choices. The former plan to accelerate a global all-pairs intersection build is superseded. Implementation status and measured limits are recorded below and in docs/performance/LOCAL_INTEGRATION.md and DENSE_SNAPPING.md.


## Local source query service — implementation boundary (2026-10-04)

The pure service now exists in application/snapping/local-sources.ts: primitive model adapter, immutable full source lookup, model-snapshot cache and local point/segment query. geometry/spatial/box-index.ts supplies a static median-split AABB tree using opaque values, no BIM types. Local intersections reuse existing exact geometry and canonical source identities; conservative search padding does not widen the final pixel radius. Since PR #56, BimPlan, shared tool resolution and hover use the local service. The global builder remains only a differential/benchmark oracle. createToolSourceQuery validates remote active sources and flattened construction dependencies through the complete snapshot lookup. Its model/policy-bound identity keeps changing local results out of hover-session identity; zoom preserves active references. See docs/performance/LOCAL_SOURCES.md for measured scope and limitations.


## Explicit point-reference acquisition (2026-10-04)

The shared selection UI holds only a temporary point draft. Committed points enter the existing hover reference state through the pure previewPointReferences service, sharing its four-reference capacity and separate pinned movement origin. Preview reports the exact replacements before commit; overflow is rejected rather than silently truncating selected points. Point acquisition leaves the segment-pair filter and authoritative project/history unchanged. Rendering picks local model endpoints/corners/midpoints; the viewport validates snapshot sources and tool exclusions before handing them to inference. No per-tool acquisition logic or second persistent reference collection.


## Reference-session lifecycle (2026-10-04)

The viewport supplies the shared operation scope to hover inference. Its identity changes on model/history, operation, layout or active viewport changes; a drawing origin change within the same polyline is not a new session. Consumers without an explicit scope retain the existing source-query identity comparison. Pan suspends dwell acquisition without deleting acquired points. Only the active viewport handles selection and hover; activating another viewport consumes the activation click rather than committing a model action. Modal keyboard events do not reset viewport references.


## Horizontal 3D work-plane planning boundary (2026-10-04)

Existing binding rules remain: one authoritative model, one shared snapping/inference pipeline, stable selected-entity context and the same validated application actions for mouse, numeric input and AI/Text/Voice. Work-plane coordinates and overlays are derived interaction data; no renderer mesh or second model becomes authoritative.

The working proposal in [docs/3D_WORKPLANE_PLAN.md](docs/3D_WORKPLANE_PLAN.md) starts with the XY plane at z=0, matching the current model. It requires a shared orthographic forward/inverse projection and later a shared CSS-screen metric for foreshortened views; a single pixels-per-metre factor is insufficient. A plane/model operation scope is distinct from camera navigation. Gesture allocation, occlusion policy and numerical conditioning thresholds are explicitly proposals/open issues, not implemented or user-approved product decisions. The next package is only projection extraction and tested inversion, preserving current rendering and picking; no new 3D editing UI or model mutation is authorized by this planning document.

## Implemented orthographic projection boundary (2026-10-04)

`geometry/projections/orthographic.ts` owns the numeric Z-up forward projection and analytic XY derivatives. The existing renderer and wall picker use this same function, creating the bounds frame once per draw/pick; `lib/bim/geometry.projectPoint` remains a compatibility wrapper. No geometry service depends on React, the renderer or BIM entities.

`rendering/viewport/horizontal-workplane.ts` captures immutable bounds/camera/viewport values and maps a fixed horizontal plane to client CSS pixels and back. Callers must supply the exact rendered aspect, including backing-buffer rounding, separately from the CSS rectangle. Its inverse search AABB is a conservative prefilter, never a substitute for exact CSS-distance ranking. Invalid input, poor conditioning and excessive estimated roundoff return explicit failure statuses; consumers must not confirm an invalid point. The current numeric guards (condition <= 1e6 and estimated roundoff <= 1e-6 m) are implementation safeguards, not model tolerances or guarantees of pointer accuracy. See the plan for their limits.

This adapter has no interaction consumer yet. Supporting a mathematical height does not add model storeys or Z movement. Shared snapping metrics, origin acquisition, occlusion and gestures must be completed before enabling 3D editing. Product decisions still open in the planning boundary remain open; the numerical guards above supersede only the previously undecided conditioning threshold.

## Affine metric for local candidate queries (2026-10-04)

`geometry/projections/screen-metric.ts` owns numeric point distances, conservative inverse search boxes and segment proximity for the linear part of an affine plane-to-CSS map. Translation cancels in these operations. The horizontal workplane adapter exposes this metric from its captured derivatives. Geometry has no camera/UI/BIM dependency.

`application/snapping/local-sources.ts` accepts either this metric or the compatible numeric 2D scale. Numeric callers use the same service through an isotropic adapter, preserving point-distance arithmetic. Candidate segments pass AABB, segment-box and CSS-distance checks before density counting or pair construction. Model-tolerance and roundoff padding retain uncertain contacts for existing exact intersection validation; they do not widen final point acceptance. Unlike the former square-only test, segments near square corners but outside the CSS radius no longer contribute false density. Source identities, full extents, snapshot caching and remote reference lookup remain intact.

The rest of the resolver still uses its existing 2D metric. The affine query API is not a complete 3D snapping path and must not be used to enable that UI yet. Ranking, guide projection, hover and explicit reference picking must converge on this contract in subsequent bounded changes.

## Shared point ranking metric (2026-10-04)

SnapContext now optionally carries ScreenMetric. querySnap supplies the isotropic adapter for legacy numeric callers and forwards the same instance to the shared source query. The Application adapter uses it for local filtering and density; point candidates use it for radius acceptance and distance ranking. Existing priority, activation and stable source tie-break rules remain unchanged. Non-finite point distances are rejected.

This supersedes the point-ranking limitation above only. Guide generation/projection, guide distances, Shift/Ortho direction selection, hover and explicit picking retain their current model/2D contracts. Affine point support alone must not enable a mixed-metric 3D interaction. Model angles and lengths remain model quantities.

## Shared guide projection metric (2026-10-04)

ScreenMetric.projectLine computes the nearest point on an infinite model line by CSS distance. The affine implementation normalizes direction and matrix before projection; invalid or non-finite projections return null. Its isotropic adapter delegates to existing projectDirection to preserve 2D arithmetic. Shared guide candidates use this projection; candidate distances including guide/axis intersections, grid and Shift labels use the same metric.

Direction selection/hysteresis, explicit Shift/Ortho and fixed-axis constraints remain model-space operations. Intersections remain exact model geometry. A candidate must still satisfy the model constraint; projection does not move or duplicate its source. This supersedes the guide-distance/projection limitation above. Hover, acquisition and explicit reference picking still require metric integration before 3D interaction can be enabled.

## Shared hover metric (2026-10-04)

HoverContext optionally carries ScreenMetric. The shared React event adapter forwards it to source lookup, point/guide resolution and segment hover; it is not part of model/reference session identity. ScreenMetric.projectSegment returns the closest bounded point, the unclamped line parameter and CSS distance. Segment hover preserves the existing interior-only rule (parameter 0..1); endpoint acquisition retains priority. The isotropic implementation preserves the previous parameter and residual-distance arithmetic.

Dwell, toggle-on-revisit, suspension, capacity and pinned-reference rules remain in the existing inference state machine. No per-tool hover state or alternate reference store is introduced. This supersedes the hover-metric limitation above; explicit reference picking and later 3D UI/visibility/navigation integration remain pending.

## Explicit reference picking metric (2026-10-04)

The existing rendering/viewport reference pickers accept ScreenMetric or the compatible isotropic numeric scale. Point distances and bounded segment projection use the same geometry service as snapping/hover. Explicit segment picking includes endpoint caps and degenerate point segments, whereas hover retains its interior-only rule. Non-finite hits are excluded. Existing distance/source-key ordering and selection transactions are preserved. The UI still supplies its 2D scale; affine capability does not enable 3D interaction or decide occlusion/navigation policy.

## 3D interaction integration plan (2026-10-04)

[docs/3D_INTERACTION_CONTRACT.md](docs/3D_INTERACTION_CONTRACT.md) records the current viewport audit and separates binding technical requirements from proposed product behavior. Element ID, client-space menu anchor and geometric movement origin are distinct. The next implementation binds rendering, wall picking and plane inversion to one immutable projection state; it does not authorize a gesture change or hidden-target acquisition. Current CSS versus rounded-backbuffer aspect usage differs at the call sites and must be unified. Proposed plane presentation, visibility and gesture policies require explicit resolution before their UI implementation.

## Shared displayed projection state (2026-10-04)

Implemented in rendering/viewport/projection-state.ts: an immutable copy of frame, camera, CSS viewport and actual rounded backbuffer size supplies projection, client-to-NDC conversion and horizontal workplane inversion. BimSolidView rendering and wall picking consume the same displayed snapshot. Camera/layout/DPR changes invalidate stale selection; resize, scroll and resolution changes request redraw. Existing pickWall remains compatible through pickWallInProjection. An optional explicit frame supports later operation-pinned framing; current editing callers do not yet pin it.

This completes the projection-state implementation above, without enabling 3D snapping or deciding gestures/occlusion. Rendering remains derived state. Visibility classification is a separate rendering concern; product policy must not be hidden in geometry or duplicated per tool.

## Shared wall depth and anchor visibility (2026-10-04)

The existing orthographic picker barycentric calculation is extracted into geometry/projections/triangle-depth.ts. It knows only numeric NDC triangles. rendering/viewport/wall-depth.ts adapts the current Solid faces and their two rendered triangles to a nearest-surface query; both the compatible wall picker and anchor visibility use this one path. The transitional lib/bim/picking.ts remains a rendering adapter, not domain logic.

classifyAnchorVisibility consumes a Solid and its matching displayed ProjectionState. Results distinguish visible, occluded, outside the NDC clip cube, and invalid numeric/projection inputs. Boundary inclusion preserves picker tolerances (1e-12 projected determinant, 1e-9 barycentric edge tolerance); surface coincidence permits 1e-7 NDC depth difference. These are numerical tolerances, not metric snap radii. Invalid/degenerate surface triangles are ignored as in picking. Finite wall meshes from buildSolid are the supported input.

This is continuous geometric visibility against current opaque wall faces, not exact GPU pixel coverage/MSAA/depth-buffer quantization. No policy for hidden reference activation is implied. No new caches or per-tool implementations; the current query scans faces, so high-frequency batch use requires profiling and shared projected-scene reuse before scaling to large projects. No slabs or future element occluders are claimed until those renderer adapters exist.

## Read-only wall footpoint candidates (2026-10-04)

rendering/viewport/wall-point-candidates.ts binds the immutable project identity and ProjectionState. Solid and local sources derive from the same project; callers pass their current identities and stale queries pause. The z=0 inverse supplies the common ScreenMetric. Local primitive lookup, collectSnapCandidates and compareSnapCandidates provide the existing radius and ranking rules. Returned candidates carry source identity, metre coordinates, CSS distance and visibility; no visibility filtering or reference activation occurs.

This adapter supports existing wall axis ends, corners and axis midpoints only. It does not reinterpret annotation lines or window coordinates as 3D points, compute new intersections, or process active guides. Queries pause on invalid/ill-conditioned inverse. Application project snapshots must remain immutable. The adapter is not yet connected to viewport events and does not define X-ray or navigation policy. Visibility still scans current wall faces per candidate; no large-scene performance claim.

## Approved 3D footpoint preview (2026-10-04)

The user accepted the concrete proposal after PR #74: immediate hollow silver-grey rings for visible wall footpoints with Snap enabled, including no active drawing tool; shared 600ms acquire/revisit-toggle; navigation suspends acquisition and retains references; wall selection and left-drag navigation remain unchanged. This supersedes the pending approval for these preview rules only, not future 3D movement gestures or X-ray modes.

SolidSnapPreview connects the displayed projection to wall-preview-context and the existing useHoverReference state machine. HoverContext.acceptReference is an optional view eligibility predicate: ineligible active sources cannot win acquisition ranking, while stored references remain intact across view changes. Timers, capacity, direction hysteresis and dwell removal stay shared. Only real visible z=0 wall points are eligible in this slice; generated construction intersections remain a later connection.

The SVG preview is pointer-transparent. Rings keep a 10.5 CSS-pixel radius and no fill; construction lines use the shared mouse-following guide directions. Guide graphics are composited behind opaque wall pixels (a conservative overlay, not a GPU-depth-tested guide mesh). Camera/resize/scroll and pointer capture cancel pending dwell; model identity, Escape and Snap-off clear the ephemeral preview session. Context loss hides the preview. No model action, persisted selection origin, project-file format or IFC change is introduced.

## Orientation floor and 3D construction intersections (2026-10-04)

The user requested a subtle decorative floor at z=0. orientation-floor.ts projects an expanded wall-bounds rectangle through the displayed ProjectionState. The pointer-transparent SVG sits behind walls and guides, independently of Snap. It is not model geometry, a snapping source, a picking target or an IFC element, and does not affect camera fitting.

The 3D preview now uses querySnap for immediate markers as well as the shared hover acquisition path. wall-preview-context supplies remote active origins and flattened original dependencies alongside local sources, using the existing model source lookup and withConstructionReferences. Construction points must have current wall-source dependencies and visible finite z=0 positions. Optional SnapContext.acceptCandidate filters ranked geometric candidates before ranking, so hidden targets cannot mask valid alternatives. Explicit axis/Shift and grid fallback behavior are unchanged; this preview does not use those modes.

No new intersection algorithm or timer is introduced. Shared acquisitionReference, reference capacity, 600ms toggle and model-session invalidation remain authoritative. Decorative SVG floor and guide layers are conservative behind-wall overlays, not general depth-tested scene surfaces. Existing limitations for 3D movement and non-wall sources remain.

## Platform targets and delivery decision (2026-10-04)

User decision: NOVIKOV CAD shall support Windows and macOS. Whether the product is delivered through a browser, as an installable desktop application, or through both remains open. No desktop framework or distribution channel has been selected. These targets are requirements, not a claim that the current application has been accepted on both platforms.

The authoritative project format, geometry/domain logic and shared validated Application actions shall be reusable across delivery forms. Filesystem access, storage, native dialogs and operating-system integration belong to explicit adapters at the appropriate application/interop/platform boundary. Browser or desktop dependencies must not leak into the CAD kernel or domain. Reuse and extract existing boundaries incrementally; this decision does not require empty interfaces, a parallel model, or an immediate rewrite.

Input adapters must account for Windows Ctrl and macOS Command conventions, mouse and trackpad use. Exact gestures remain subject to the shared interaction contract. Rendering and dependency choices must be evaluated for both target platforms; code-level portability alone is not a performance or compatibility acceptance test.

Minimum OS/browser versions, supported browsers and hardware, CPU architectures, offline behavior, installation, signing, distribution and updates will be defined for the concrete delivery package. Essential acceptance scenarios shall include editing a representative larger project, saving/loading and export on Windows and macOS; offline acceptance is required only after its scope is decided. Browser/desktop prototypes and measured file, input and graphics behavior should inform the later delivery decision.

This platform requirement does not replace the current bounded task in DEVELOPMENT_PLAN.md or authorize implementation of packaging, a desktop shell, or a new storage service.

## Implemented: first stored 2D hatch slice — 2026-10-05

Canonical runtime/file schema is now 4. storey.hatches is required (empty for old
projects). Each hatch has a stable project-wide ID, kind hatch, layerId, one simple
implicitly closed ring in model-space metres, and a solid fill with RGB hex color
and opacity 0..1. domain/elements/hatch uses the shared geometry polygon validator.
No holes, repeated closing vertex, BIM volume, pattern or contour-pen definition
is included yet. Optional fill/outline and configurable patterns remain requirements.
The initial ownership is the existing storey's model-space 2D drawing scope;
DrawingDocument-local annotations are not implicitly introduced.

The file adapter validates V1/V2/V3 before explicit migration to V4; it preserves
existing IDs, geometry and V3 visibility. Runtime validation never migrates.
application/hatches supplies snapshot-bound create/update preview and commits
through existing model history. UI and future AI/Text/Voice adapters must use
these same actions and stable targets. Shared layer assignment, occupied-layer
protection and eligibility include hatches. Rendering, picking, snapping and
interactive tool adapters are pending, so no canvas capability is claimed here.
IFC remains the existing building export; 2D hatches are stored in project JSON,
not converted into BIM solids. Existing BIM scaling prohibition remains unchanged.

## Implemented: initial 2D hatch canvas adapter — 2026-10-05

The Hatch tool shares the existing multi-point drawing state, drawingInteraction,
precision input and local source query. createDrawing delegates hatch creation to
previewHatch; only the drawing adapter removes an explicit repeated closing point.
Domain validation remains strict. Double-click/Enter finish the accumulated points;
Escape discards the draft. Closure must remain possible after the final click resets
the numeric preview to a zero-length segment; validity belongs to the creation action.

Selection now uses application/selection/ElementTarget, separately from the narrower
Direct Edit capability. Hatch selection exposes fill and layer properties, not
unsupported movement grips/actions. Commands keep the actual selected hatch ID but
reject unsupported wall/window commands; no target fallback or AI mutation path.
Hatch vertices and all closed edges feed the same primitive index and layer-filtered
query. Plan bounds, display lists and Navigator include hatches. SVG fill is drawn
behind walls/lines, with a thin selection border; 3D geometry/IFC remain unchanged.
The current UI offers solid fill only. Patterns, contour pens, holes and hatch
Direct Edit remain pending. Automated checks do not constitute browser acceptance.

## Drawing contour construction references — 2026-10-05

ToolSnapPolicy may provide pinnedReferences in addition to its primary origin.
The shared drawing adapter supplies at most the first and current draft vertices,
with first/last edge directions. Immutable path identity keeps this policy stable
across camera navigation. These are interaction references, not model entities;
local source lookup accepts exact current pinned references and validates derived
dependencies against them. Existing cursor-guided intersections perform closure
inference for all path consumers; there is no rectangle-specific geometry solver.
The primary origin still controls numeric/Ortho/Shift input. Explicit Shift keeps
its existing priority; ordinary hover dwell remains unchanged. Removing the tool
policy removes its transient sources. No domain/schema/history data is introduced.

## Shift direction with exact feature snapping — user correction 2026-10-05

This supersedes the earlier statement that Shift bypasses automatic point snapping.
Shift fixes the nearest 45-degree direction from the interaction origin. It now
uses the existing fixed-axis candidate pipeline to accept exact endpoints,
midpoints, segment intersections and guide/axis intersections on that direction
within the normal CSS-pixel radius. Off-axis point candidates are rejected, never
silently projected and relabelled as exact. Explicit host/edit axes still win.
Without an eligible exact point, preserve continuous model-space projection onto
the Shift direction (no extra grid jump or screen-metric guide projection).
The same engine serves drawing and editing; no per-tool solver or timer changes.

## Hatch direct edit through shared movement pipeline — 2026-10-05

Hatch targets now participate in EditSession/ToolInteraction. The selected vertex
is the pinned construction origin; the existing inference, precision input,
preview/commit and history paths remain shared with walls and lines. Whole-element
move, X/Y and axis translation preserve every vertex offset. Point and stretch
change only the selected vertex, validated by previewHatch and the simple polygon
validator. Self-intersection and collapsed contours cannot commit.

The existing transformation implementation moved to application/direct-edit/transforms.ts;
lib/bim/transforms.ts is a compatibility re-export, not a second implementation.
Hatch changes use the same Application hatch update action as properties. No new
schema, independent snap engine, AI mutation path or 3D hatch editing is introduced.
Axis/stretch reuse the existing neighbouring-point convention: vertex 0 uses
vertex 1, other vertices use their predecessor. The numeric helper names the
chosen point direction. Stretch means one point along that edge direction, not
parallel displacement of a whole contour edge. Whole-edge offset remains pending.

## Closed contour edge editing — 2026-10-05

Schraffuren and explicitly closed polylines share insert/edge EditActions. A
separate ephemeral edgeIndex in UI selection prevents mistaking a side grip for
a vertex; EditSession.index identifies the chosen edge for these two actions.
Square midpoint grips expose the actions with keyboard and pointer support.
Insert (Knicken) adds a vertex after the chosen edge's start at the pointer or
precision-input target; the existing point action can edit it subsequently.
Edge (Seite strecken) constrains movement to the edge normal, shifts its supporting
line and intersects it with both neighbouring supporting lines. Rectangle angles
are preserved. Collinear neighbours without a unique intersection are rejected,
as are collapse, self-intersection and reversed winding. No implicit repair or
vertex removal. Geometry is in geometry/polygons/edit-edge; Application adapts
implicit hatch closure and repeated-endpoint polyline closure and commits through
existing EditSession history. No independent snap/input engine or BIM scaling.

## Valid stretch interval and bounded marker size — 2026-10-05

Seitenstrecken now caps at the first invalid geometry boundary instead of dropping
the preview. geometry capContourEdge constructs linear vertex motion, collects
segment-contact orientation/coincidence events, checks them in order, and refines
the first invalid interval to its valid side with a numerical margin. It does not
jump across an invalid interval to another valid polygon. Degenerate adjacency
with no unique intersection retains the original contour. Non-finite requests and
invalid initial contours still fail. Domain editContourEdge stays strict.

Application boundedEdgeTarget is shared by snapping, numeric input and final
preview/commit. Capped targets discard an incompatible snap label. Numeric input
reports the resulting signed length and a geometric-limit notice through the
shared input presentation contract. No invalid polygon is stored at the limit;
this is a numerically valid approach to contact, not topology repair or edge deletion.

Side grips are blue double arrows offset inward according to winding, oriented
normal to the edge. Their size is screen-based with a short-edge bound. The moving
target marker is now 5 CSS pixels instead of 0.055 model metres. The reported
intermittent white/black circle has not been reproduced and remains unconfirmed.

## Shared session grid preferences — 2026-10-05

application/snapping/grid-settings.ts defines the shared enabled/spacing preference
and validates positive finite metre input. CadWorkspace owns this transient UI
preference only; it is not Project state, serialized data or model history.
GridControls edits it once. Plan drawing/direct edit and existing horizontal-plane
3D wall editing feed the same spacing/null value to the established resolver.
SNAP remains the master switch. Disabling only grid fallback preserves feature
snapping and inference; visible zoom-adaptive grid display is independent.
Explicit numeric targets and existing axis/Shift precedence remain unchanged.
No per-tool rounding, new model actions or alternative snapping engine is added.

## Wall corner planning boundary — 2026-10-05

The implementation remains independent centred wall bodies without join relations.
The inspected paths, limited equal-thickness right-angle miter proposal and open
product decisions are recorded in [docs/WALL_CORNER_PLAN.md](docs/WALL_CORNER_PLAN.md).
That proposal is not an implemented or approved automatic join policy. Existing
single-model, shared-action, derived-geometry and visibility boundaries apply.
Do not correct only the renderer while retaining independent rectangular IFC bodies.
The next bounded task displays the selected wall's existing centre axis in 2D;
it does not introduce axis offsets, join persistence or connected-wall movement.

## Selected wall axis in plan — 2026-10-05

BimPlan now overlays the selected visible wall's start/end centre axis from its
current validated display/preview snapshot. The dashed line has screen-constant
stroke and ignores pointer events. It introduces no model entity, snap source or
mutation. Axis offsets, 3D axis display and wall-join decisions remain open.

## Wall axis offset: binding user decision — 2026-10-05

The user explicitly chose: the wall body moves relative to the drawing axis.
This supersedes earlier statements that the choice was still open. start/end
remain the drawing-axis endpoints when changing the offset; the physical wall,
its openings and hosted windows translate perpendicular to that axis together.
Axis length, thickness, height, IDs and relative opening positions are preserved.
This is not whole-element translation and does not approve automatic wall joins.

Technical convention for the forthcoming implementation: a signed metre offset
measures the body centre from the drawing axis, positive to the left looking
from start toward end. With unit tangent (ux,uy), left normal is (-uy,ux), body
centre = axis point + offset * normal and sides lie at offset +/- thickness/2.
A default zero offset preserves the current centred wall. This sign convention
is an implementation convention, not an additional claimed user preference.

Implement body coordinates once in a domain wall-geometry adapter backed by
existing generic geometry. Keep axis coordinates distinct from body coordinates.
Plan geometry, bounds, 3D solids, openings, hit testing, corner grips and snapping,
windowCentre/edit anchors and IFC must consume that same derivation. The selected
axis overlay continues to display start/end. Do not create another editable Wall
or store renderer/IFC geometry as authoritative data.

A snapshot-bound Application action must validate a finite offset and all derived
coordinates, return a disposable preview, reject stale target/context, and commit
one undo step. Properties and future mouse/Text/Voice/AI adapters must call it.
Reject non-finite/overflow geometry; do not silently clamp or round the value.
Changing the offset itself leaves the axis fixed. Other endpoint edits retain the
stored signed offset relative to the resulting direction; reversing direction
and deliberately keeping the body fixed is not introduced as a new command.

Persist the offset with an explicit new project schema version and validated
migration of older files to zero; no permissive runtime default for malformed
new-version snapshots. Layer and visibility semantics stay unchanged. The next
implementation must cover all consumers before exposing the numeric field.
3D axis overlay, interactive offset dragging, side presets, wall joins and
material-layer priorities remain separate work.

## Implemented wall-body offset and schema 5 — 2026-10-05

The preceding offset decision is implemented. Wall.bodyOffset is required and
finite in runtime schema 5. Project-file loading strictly validates legacy versions
and migrates them to zero offset; creation defaults only new wall inputs to zero.
domain/elements/wall/body.ts derives physical centres/corners once, including
finite-coordinate checks. Plan, bounds, solids, snapping, corner editing, window
anchors and IFC use this derivation; the selected plan axis retains start/end.
Application previewWallOffset/commitWallOffset enforce current snapshot and stable
project/wall selection, with one model-history commit and no-op preservation.
The properties form keeps draft text locally until explicit acceptance; cancellation
discards text, not a model change. The Application preview is disposable, not yet a
live viewport preview from the form. Future Text/Voice/AI adapters reuse this action.
Hosted openings retain longitudinal position and move with the physical body.
IFC placement uses physical body coordinates and records BodyOffset as a property.
No join semantics or 3D axis overlay are introduced in this step.

## Selected wall axis in 3D — 2026-10-05

BimSolidView now retains the validated display Project snapshot before deriving
its solid. Both physical geometry and the selected axis consume this snapshot,
including direct-edit previews and fallback after invalid input. wall-axis.ts in
rendering/viewport projects start/end at current wall-foot height z=0 through the
same ProjectionState. No body-centre substitution, editable copy or new snap
source. The dashed SVG is a deliberate through-body construction overlay, with
CSS-pixel stroke and pointer-events:none; it does not participate in hit testing.
Committed visibility eligibility gates the preview axis just like surfaces.
This completes the basic N45 selected-axis display in plan and 3D.

## Wall join intent: binding user decisions — 2026-10-05

The user chose explicit creation through "Ecke verbinden"; shared endpoints or
snap proximity alone do not create joins. Moving an individual connected wall
automatically detaches its joins, without requiring a preceding manual detach.
Application preview/commit must treat detachment and movement atomically, with
one undo step and no mutation on cancellation or invalid input. No join is
implemented yet. Shared-corner editing, endpoint/property edits and cap geometry
after detachment remain separate unresolved behaviours. See docs/WALL_CORNER_PLAN.md
for offset examples and the bounded pure contour-derivation proposal. Persisted
join relations are a technical proposal, not an existing schema capability.

## Pure right-angle wall corner contours — 2026-10-05

domain/elements/wall/corner.ts derives gross contours and a shared seam from an
explicit pair of wall endpoint references. It has no project/selection ownership,
opening processing, persistence or automatic neighbour detection. Membership,
other joins and opening eligibility remain caller responsibilities for future
Application integration. Stable-ID ordering makes pair order deterministic;
endpoint directions and offset signs are normalized locally without mutation.
wallBody and existing generic line intersection/polygon validation are reused.
Equal thickness/height are exact parameter requirements; endpoint compatibility
uses the existing metre tolerance, not screen snapping. Right-angle dot-product
tolerance is dimensionless 1e-10. Invalid/too-short geometry throws; no clamping.
Contours have positive winding and local computed area; converted world geometry
is validated too. No runtime consumers, schema changes or UI command yet.

## Corner opening inspection — 2026-10-05

inspectCornerOpenings in domain/elements/wall validates one Project, resolves two
explicit wall/endpoint targets, and derives gross contours plus full-thickness
window footprints from that snapshot. No external/stale contour is accepted.
Generic measureHalfPlane in geometry/projections returns a signed metre clearance
and inside/touching/outside using the existing model tolerance. It knows no BIM.
The domain report retains window/wall IDs and separate side/far-end/join findings.
Normal contact with the two longitudinal sides is expected for a through-opening;
it alone does not cause the aggregate touching status. Any outside half-plane
wins; otherwise join/far-end contact yields touching, else contained. Convexity
comes from the current validated right-angle corner derivation.
No clearance margin, window-overlap policy, join eligibility decision, visibility
filter, mutation or rendering/export integration is introduced. The report does
not approve boundary-touching windows as a product rule.

## Derived corner solids — 2026-10-05

geometry/solids/profile-openings.ts extrudes convex CCW profiles along Z with
rectangular X/Z through-openings. X/Z partitioning subtracts opening unions once;
only boundary faces are emitted. Coplanar external faces may remain subdivided.
Slab intersections use original edges for identical shared vertices. Directed
edge incidence is checked; non-manifold opening contacts and numerically
inseparable cuts fail closed instead of silently dropping material. Faces have
variable polygon vertex counts, not the legacy renderer's fixed quad contract.

domain/elements/wall/corner-solid.ts validates and derives an explicit pair from
one Project using existing contours/opening inspection. It returns disposable
per-wall geometry and volumes, without changing Project, visibility or history.
Local parametric side/cap coordinates are restored within model tolerance after
world/local conversion; authoritative model parameters are never changed.
Only contained openings are supported in this path. Rejection of touching is an
implementation boundary, not a settled product rule. Existing buildSolid and
normal project export are unchanged. Future renderer/IFC adapters must consume
this shared domain derivation rather than calculate separate joins.

## Shared IFC writer and isolated corner acceptance — 2026-10-05

The STEP writer now lives in interop/ifc/writer.ts. lib/bim/ifc.ts retains its public
API and invokes it without profile overrides; ordinary UI export behaviour is
unchanged. No renderer data is accepted as export authority.
interop/ifc/corner.ts is an isolated acceptance path for an explicit temporary
pair. It validates a snapshot and consumes the exact local gross profiles from
domain/elements/wall/corner-solid.ts; the writer emits closed polygon sweeps and
uses the existing semantic opening/fill relationships from that same snapshot.
No alternate miter calculation or persisted join is introduced. Unknown or
invalid profiles fail before asynchronous identity generation. IDs retain the
existing project/kind/source-ID namespace. The acceptance path rejects currently
unsupported end-contact openings without deciding the future product policy.
See docs/CORNER_IFC_ACCEPTANCE.md for independent validation and import limits.

## Incremental closed-contour side stretching — 2026-10-05

Geometry preparePolygonVertexEdit owns a copied, fully validated baseline and
permits edits only to declared vertices. It checks all scalar/area conditions
and all edge pairs incident to those vertices with the same contact predicates
as full validation. Undeclared changes or a different vertex count are rejected.
For two adjacent vertices only three edges change: 3*n-6 pairs, not n*(n-1)/2.
A conservative bounding-box rejection retains gaps within twice the maximum
model tolerance; it does not replace contact tests or introduce screen tolerance.

prepareContourEdge reuses this preparation across pointer targets. Orientation
roots, event order, first-valid-interval restriction, collapse rules and numerical
margin remain intact. Preparation and derived results never mutate model geometry.
Application owns a WeakMap per immutable EditSession, guards its base/target/index/
anchor binding and reuses the last raw or bounded target result. Mouse snapping,
numeric preview and contour preview share this resolver. No tool-specific copy.
A cancelled or replaced session is not reused by subsequent operations.
Full contour/project validation still runs through the existing preview/commit
adapters. No trusted-preview bypass, schema change or relaxed commit validation.
See docs/CONTOUR_EDGE_PERFORMANCE.md for timings and remaining limits.

## Direct contour grip input — 2026-10-05

Blue edge arrows are an input shortcut to the existing edge EditSession, not a
second stretch implementation. BimPlan captures the pointer on the stable SVG;
rendering/viewport/anchor-drag.ts translates pointer displacement to the pinned
model anchor and applies a 3px screen drag threshold. It has no model mutation.
CadWorkspace forwards a begin intent to the existing editing reducer. Snap,
precision input, cap and commit continue through the shared edit interaction.
Pointer-up suppresses its following click; simple click/keyboard activation
leaves the standard edit active. Capture loss/cancel aborts; session/model binding
prevents stale drags. Other on-demand edge and insertion actions remain available.


## Korrektur nach Nutzerabnahme — 06.10.2026

Innenoffset wird jetzt auf mindestens 1 % Restlaenge jeder urspruenglichen Seite
begrenzt. Die zuerst kollabierende Seite bestimmt den Abstand; numerische
Gueltigkeitsgrenzen koennen frueher stoppen. Die Grenze wird einmal vorbereitet,
Mausziel, Zahleneingabe und Bestaetigung verwenden denselben Cap. Vorschau bleibt
stehen und zeigt den tatsaechlichen Abstand statt eines ungueltigen Ziels.
Ungeeignete Ausgangskonturen und nicht-endliche Eingaben bleiben Fehler.
Freies Bewegen bestaetigt jetzt per Klick fuer alle gemeinsamen Edit-Adapter.
Tab bedient weiterhin Laenge/Winkel; Klick fixiert nicht mehr nur die Richtung.
471 Tests bestanden; Browser: 10-cm-Kontur auf 1 mm Restlaenge begrenzt,
kein Fehler; freie Schraffurbewegung durch einen Mausklick abgeschlossen.


### Erweiterung 06.10.2026: zwei Ecken an der T-Hauptwand
Verbindlicher implementierter Stand: Beide Hostenden dürfen rechtwinklige
Eckanschlüsse besitzen. Die gemeinsame Prüfung berücksichtigt jeden Eckpartner
und die zusammengesetzte Hostkontur. Kontakt/Überlappung mit einem Eckpartner
bleibt verboten. Historische Begrenzungen auf genau einen Host-Eckanschluss
sind damit überholt; andere Topologiegrenzen bleiben bestehen. Kein Schemawechsel.

## Image-reference planning boundary — 2026-10-07

See [image-reference plan](docs/references/IMAGE_REFERENCE_PLAN.md) for the verified
schema-8 integration points and proposed embedded-asset/transform/action contract.
No reference schema or calibration action is implemented by this documentation.
Binding user decision: imported PNG/JPEG images may be calibrated using two
points and a known length. This extends Section 30's permitted reference types;
all BIM exclusions and whole-target Application guards remain binding. Asset-backed storey references are not DrawingDocuments or copied
BIM elements. Browser decoders and disposable URLs belong to adapters; project
files must preserve assets independently of their original local files. Proposed
field names and embedded storage are an incremental design, not user decisions.

## Implemented image-reference storage slice — 2026-10-07

Runtime schema 9 adds project assets and storey.references. The reference domain
module validates the storage shape, canonical base64, MIME whitelist, pixel metadata,
finite noncollapsed transforms and linked asset/layer IDs. It deliberately does not
decode images; future file/browser adapters must verify actual content, orientation
and decoded dimensions before rendering/import. No bitmap is trusted as executable
markup. Migration 1–8 belongs solely to the file adapter and adds empty collections.
Image bytes are stored once per asset; no blob URLs or decoded images enter history.

application/references/actions.ts binds import to project ID and base snapshot,
validates an independent preview and commits asset/reference in one history step.
The shared file-size guard now also protects serialization, import and direct JSON
loading (10 MiB UTF-8). Storage metadata has a provisional 16-million-pixel budget
and 16384-pixel edge limit; this is a conservative implementation bound, not a
measured browser capacity promise. Renderer/decoder resource checks remain pending.
Layer assignment, occupancy and eligibility include references. Selection/rendering
and calibration are not yet exposed; existing BIM IFC output ignores these 2D data.

## Image import and plan presentation — 2026-10-07

interop/images/import.ts performs bounded header inspection before browser decoding,
normalizes orientation through createImageBitmap and canvas PNG serialization, and
releases the bitmap. No external URLs or SVG import. Stored image headers are
checked against MIME/dimensions before rendering; this is not full file validation.
useImageImport owns transient read/placement lifecycle and stale async cancellation.
It adapts previewCreateReference to existing ToolInteraction, querySnap and generic
placement; width is local tool input, commit alone stores the reference and asset.

reference joins the shared typed selection index and projected marquee shapes.
Plan rendering derives one image rectangle from origin, rotation and metres/pixel,
with CSS-constant selected outline. Layers and Navigator reuse stable IDs. Reference
pixels are not model snap geometry. Whole-selection moves containing a reference
currently reject atomically; legacy edit menus are withheld for this type. No
calibration action or independent image movement engine is introduced here.


## Implemented image calibration slice — 2026-10-07

`geometry/transforms/calibrate.ts` supplies uniform scaling about a fixed world
anchor. `application/references/calibration.ts` owns snapshot/ID/selection and
visibility guards, explicit metric length parsing, validated preview and history
commit. BIM and mixed selections are rejected in this action, not only in UI.
The renderer derives the new image transform from the same project snapshot.

`useReferenceCalibration` is a ToolInteraction adapter: shared point capture and
snapping, no separate engine. ReferenceCalibrationControls owns the On-Demand
length form; CadWorkspace only coordinates it. A session pins project, visibility,
selected reference and two world points. Context changes invalidate it; preview
does not mutate project/assets and acceptance produces one model history entry.
Text/Voice adapters are the next bounded task and must reuse this action.
