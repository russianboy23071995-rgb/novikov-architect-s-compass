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

- Start with `NOVIKOV_MASTERPLAN.md`: this is the consolidated mission, architectural contract, verified status, priorities and one active next task (user request 2026-10-10).
- Read only the relevant IDs/detail capsules in `NOVIKOV_REQUIREMENTS_REGISTER.md`. It preserves N01–N60, Guide-F01–F29, AI01–AI35, V/K/R26, product/release/SBOM/homepage requirements and source provenance. Do not load every old guide for each task.
- Older ARCHITECTURE.md, DEVELOPMENT_PLAN.md, DEVELOPMENT_GUIDE.md, FEATURE_ROADMAP.md and feature plans remain historical evidence/detail sources. Their old next-task instructions do not override the central plan. Update the central status and affected requirement entries after each task; do not create parallel roadmap files.
- The central plan adopts the existing architecture rules with the user's newer decisions, including autonomous speech-capable AI CAD as the top product vision, common typed validated actions/queries, no duplicate BIM model, prepared previews, forbidden proportional BIM/3D scaling, shared scale/visibility contexts, Windows/macOS adapters and undecided browser/desktop delivery.
- Incorporate product responsibility in each relevant change: P0 save/recovery, local-first data, separate license adapter, optional diagnosis/crash reporting off by default, read/export/print after license expiry even without license server, real release-bound SBOM and rights/security/privacy evidence. Public Beta is planned; duration/pricing/account model remain undecided. Six ongoing registers are sections in the central requirement register, not six competing planning documents.
- Keep exactly one bounded implementation task active. Inspect current main and open PR evidence before choosing it; PR238 may advance independently. Do not reimplement merged pilots or treat historical profiling figures as current guarantees.

- Preserve the validated Stage-1 workflow and migrate incrementally. Do not perform broad rewrites merely to match the target folder structure.
- `src/lib/bim` is a transitional location for the existing BIM vertical slice, not the permanent home for every CAD subsystem. Generic geometry, snapping, guides, constraints, tool runtime, transactions and similar reusable infrastructure must be placed according to the central architecture contract instead of automatically being added under `src/lib/bim`.
- `CadWorkspace` may coordinate layout and ephemeral presentation state, but it must not continue growing into the permanent owner of project/domain logic. Authoritative project state, committed selection, edit history and model-changing operations belong behind application/domain boundaries as described in the central architecture contract.
- Target platforms are Windows and macOS. Browser versus installable desktop delivery remains undecided. Keep the project format, CAD/domain logic and validated Application actions reusable across both; isolate filesystem, storage, dialogs and OS integration behind appropriate adapters. Account for Ctrl/Command and mouse/trackpad input without inventing gestures. Do not select a desktop framework, minimum OS/browser version, offline scope or packaging strategy without a concrete follow-up decision. See NOVIKOV_MASTERPLAN.md A10.
- Define CAD tools and viewport layouts as typed data so future tool and BIM additions do not require restructuring the shell.
- Selected-element context is authoritative for text, AI and voice commands: clicking a component binds commands to its stable ID, never its list position or a guessed nearby element. Show the target, pin it for each voice session and reject stale context when selection/model changes. Direct 3D wall selection, 2D and Navigator selection feed the shared context.
- All model-changing interaction paths — mouse tools, properties, direct edit, text commands, AI and voice — must converge on shared validated application/model operations rather than implementing separate mutation logic.
- 2D, 3D, properties, project files and IFC must derive from the same authoritative model state. Do not introduce parallel editable representations of the same project entities.
- Rendering data is derived and disposable. React components, SVG/WebGL/CSS representations and renderer meshes must never become the authoritative BIM model.
- Reuse generic geometry and constraint services across tools. Do not implement separate snapping, projection, intersection or inference logic independently inside Wall, Line, Slab or future tools.
- `FEATURE_ROADMAP.md` is a historical record, not the active sequence. Do not consult or request updates to the superseded `0.Where it all Begins` attachment. Preserve explicit conversation requirements not withdrawn by the user, including 3D selection outlines and speech-recognition improvements; map them during guide Stage 0.
- Put all selected-element properties in the fixed Werkzeugeigenschaften bar below the main toolbar. The Navigator is for project structure/selection. Open contextual movement actions automatically near the pointer on element/point selection and avoid duplicating property fields there; new element types must use the shared properties bar.

- Every interactive movement must immediately pin the chosen point as a shared construction origin: point/element movement, stretch and axis actions alike. New element adapters must participate in the same snapping/inference pipeline; do not make origin activation a per-tool opt-in. Preserve explicit host/axis constraints and the user Snap toggle. See NOVIKOV_MASTERPLAN.md A04.

- New precision-input consumers must use the ToolInteraction contract and shared useToolInteraction/InteractionInput lifecycle. Keep element-specific validation in application/domain adapters; do not add numeric preview switches or per-tool form/Tab handlers to CadWorkspace or BimPlan. Preserve existing geometric snapping services.

- CAD windows use the shared FloatingPanel shell, modeled on Ebenen: draggable, non-modal, no background dimming, Glass Flow styling. Keep window-specific validation/actions separate; do not duplicate drag or overlay implementations.

