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

- Keep NOVIKOV CAD prototype interaction state local to `CadWorkspace` and child components because this phase is frontend-only without persistence.
- Define CAD tools and viewport layouts as typed data so future tool and BIM additions do not require restructuring the shell.
- Selected-element context is authoritative for all future text, AI and voice commands: clicking a component binds commands to its stable ID, never its list position or a guessed nearby element. Show the target, pin it for each voice session and reject stale context when selection/model changes. Direct 3D selection remains a planned addition; 2D and Navigator selection already feed the shared context.
