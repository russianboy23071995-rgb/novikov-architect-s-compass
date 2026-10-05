# NOVIKOV CAD Architecture Contract

## Status

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

No scaling action exists in the inspected code. This documentation records its mandatory implementation gate; it does not claim executable enforcement has been added. Required acceptance cases: permitted drawing line/PDF; BIM wall selected in plan and section rejected; mixed line/wall selection rejected atomically; stale target rejected; valid operation preserves IDs and supports one undo/redo and JSON round-trip. Bitmap import remains an older retained wish; it does not gain scaling permission under the new restriction.

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
