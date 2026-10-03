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

# Architectural Principle

NOVIKOV CAD is not built as a collection of UI features.

It is built as a reliable modeling platform whose UI, AI, rendering and interoperability layers all operate on the same validated architectural model.
