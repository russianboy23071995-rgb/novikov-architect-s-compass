<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Architecture decisions

- End each completed task report with the next concrete development step, as requested by the user.

- `ARCHITECTURE.md` is the architectural source of truth for NOVIKOV CAD. Read it before architecture-sensitive implementation work and follow its dependency rules, migration policy and layer responsibilities.
- Read `DEVELOPMENT_GUIDE.md` (user guide dated 2026-10-02) before planning work. It replaces the earlier user attachment `0.Where it all Begins` as the requirements and sequence source. `DEVELOPMENT_PLAN.md` records the verified progress and next bounded task against this guide. Guide stage numbers and F01–F29 IDs differ from historical numbering; always qualify old references. Feature-specific specifications such as `F13_HILFLINIENSYSTEM.md` define detailed behaviour but must not override the architectural boundaries in `ARCHITECTURE.md` unless an explicit architecture decision updates that document.
- Preserve the validated Stage-1 workflow and migrate incrementally. Do not perform broad rewrites merely to match the target folder structure.
- `src/lib/bim` is a transitional location for the existing BIM vertical slice, not the permanent home for every CAD subsystem. Generic geometry, snapping, guides, constraints, tool runtime, transactions and similar reusable infrastructure must be placed according to `ARCHITECTURE.md` instead of automatically being added under `src/lib/bim`.
- `CadWorkspace` may coordinate layout and ephemeral presentation state, but it must not continue growing into the permanent owner of project/domain logic. Authoritative project state, committed selection, edit history and model-changing operations belong behind application/domain boundaries as described in `ARCHITECTURE.md`.
- Define CAD tools and viewport layouts as typed data so future tool and BIM additions do not require restructuring the shell.
- Selected-element context is authoritative for text, AI and voice commands: clicking a component binds commands to its stable ID, never its list position or a guessed nearby element. Show the target, pin it for each voice session and reject stale context when selection/model changes. Direct 3D wall selection, 2D and Navigator selection feed the shared context.
- All model-changing interaction paths — mouse tools, properties, direct edit, text commands, AI and voice — must converge on shared validated application/model operations rather than implementing separate mutation logic.
- 2D, 3D, properties, project files and IFC must derive from the same authoritative model state. Do not introduce parallel editable representations of the same project entities.
- Rendering data is derived and disposable. React components, SVG/WebGL/CSS representations and renderer meshes must never become the authoritative BIM model.
- Reuse generic geometry and constraint services across tools. Do not implement separate snapping, projection, intersection or inference logic independently inside Wall, Line, Slab or future tools.
- `FEATURE_ROADMAP.md` is a historical record, not the active sequence. Do not consult or request updates to the superseded `0.Where it all Begins` attachment. Preserve explicit conversation requirements not withdrawn by the user, including 3D selection outlines and speech-recognition improvements; map them during guide Stage 0.
- Put all selected-element properties in the fixed Werkzeugeigenschaften bar below the main toolbar. The Navigator is for project structure/selection. Open contextual movement actions automatically near the pointer on element/point selection and avoid duplicating property fields there; new element types must use the shared properties bar.
