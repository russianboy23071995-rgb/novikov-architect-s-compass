import type { Plugin } from "vite";
/** Diagnostic-only build transform for the 3D drag (docs/performance/DRAG_RENDERING_3D.md). */
export function renderInstrumentation(): Plugin {
  return {
    name: "diagnostic-render",
    enforce: "pre",
    apply: "build",
    transform(source, id) {
      const path = id.split("?")[0]!.replaceAll("\\", "/");
      let edits: [string, string][] = [];
      if (path.endsWith("/src/components/cad/BimSolidView.tsx")) {
        edits = [
          [
            "return preparedEdit.evaluate(project, selection, target, targetCandidate);",
            'return renderSync("evaluate", () => preparedEdit.evaluate(project, selection, target, targetCandidate));',
          ],
          // Pointer handler: snapping/inference and the workspace aim callback.
          [
            "inference.resolve(\n                  { x: event.clientX, y: event.clientY },\n                  event.shiftKey,\n                );",
            'renderSync("resolve", () => inference.resolve({ x: event.clientX, y: event.clientY }, event.shiftKey));',
          ],
          [
            "onEditAim?.(editSession, result.point);",
            'renderSync("aim", () => onEditAim?.(editSession, result.point));',
          ],
          // Render count of the 3D view.
          [
            "const queryModel = useMemo(() => prepareViewportModel(project), [project]);",
            'renderSync("render", () => 0); const queryModel = useMemo(() => prepareViewportModel(project), [project]);',
          ],
        ];
      } else if (path.endsWith("/src/rendering/viewport/solid-renderer.ts")) {
        edits = [
          [
            "const change = cache.update(next, nextOrigin, nextSelected);",
            'const change = renderSync("buffer", () => cache.update(next, nextOrigin, nextSelected)); renderUpload(change);',
          ],
          [
            "if (resource) resource.update(solid, nextOrigin, nextSelected);",
            'if (resource) renderSync("update", () => resource!.update(solid, nextOrigin, nextSelected));',
          ],
          [
            "resource!.draw(projection, outline, windows);",
            'renderSync("draw", () => resource!.draw(projection, outline, windows)); renderGpu(canvas);',
          ],
        ];
      } else return;
      for (const [from, to] of edits) {
        if (!source.includes(from)) throw new Error(`Render profiler no longer matches ${from}`);
        source = source.replaceAll(from, to);
      }
      return {
        code:
          'import { renderSync, renderUpload, renderGpu } from "/benchmarks/render-trace.ts";\n' +
          source,
        map: null,
      };
    },
  };
}
