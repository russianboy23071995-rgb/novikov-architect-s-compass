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
      } else if (path.endsWith("/src/components/cad/useSolidInference.ts")) {
        // Snapping during render: hovered edge and the candidate shown with the cursor.
        edits = [
          [
            "context.sourceQuery!(cursor, 1, 10, hover.references)",
            'renderTimed("edge-sources", context.sourceQuery!, cursor, 1, 10, hover.references)',
          ],
          [
            "candidate: client ? (resolve(client, shift)?.candidate ?? null) : null,",
            'candidate: client ? (renderSync("render-resolve", () => resolve(client, shift))?.candidate ?? null) : null,',
          ],
          [
            "const inverse = plane.value.toPlane(position);",
            'const inverse = renderSync("to-plane", () => plane.value.toPlane(position));',
          ],
          [
            "guideDirections: advanceGuideDirections(inverse.value.point, active, hover.guideDirections),",
            'guideDirections: renderSync("guides", () => advanceGuideDirections(inverse.value.point, active, hover.guideDirections)),',
          ],
        ];
      } else if (path.endsWith("/src/rendering/viewport/wall-preview-context.ts")) {
        edits = [
          [
            "acceptCandidate: (c) => visible(c.worldPoint),",
            'acceptCandidate: (c) => renderSync("accept-candidate", () => visible(c.worldPoint)),',
          ],
          [
            "acceptReference: (r) => isOrigin(r) || (valid(r) && visible(r.point)),",
            'acceptReference: (r) => renderSync("accept-reference", () => isOrigin(r) || (valid(r) && visible(r.point))),',
          ],
        ];
      } else if (path.endsWith("/src/application/tools/snapping.ts")) {
        edits = [
          [
            "return (policy?.resolve ?? querySnap)(cursor, request);",
            'return renderSync("tool-snap", () => (policy?.resolve ?? querySnap)(cursor, request));',
          ],
        ];
      } else if (path.endsWith("/src/application/direct-edit/snapping.ts")) {
        edits = [
          [
            "const direction = editDirection(session);",
            'const direction = renderSync("edit-direction", () => editDirection(session));',
          ],
          [
            "const references = editSnapReferences(session, context.references);",
            'const references = renderSync("edit-references", () => editSnapReferences(session, context.references));',
          ],
          [
            "const tReference = tAxisReference(session, cursor, context);",
            'const tReference = renderSync("t-reference", () => tAxisReference(session, cursor, context));',
          ],
          [
            "const point = boundedEdgeTarget(session, project(result.point));",
            'const point = renderSync("bounded", () => boundedEdgeTarget(session, project(result.point)));',
          ],
        ];
      } else if (path.endsWith("/src/application/walls/t-axis-snap.ts")) {
        edits = [
          [
            "const result = querySnap(cursor, {",
            'const result = renderTimed("query-snap", querySnap, cursor, {',
          ],
        ];
      } else if (path.endsWith("/src/constraints/snapping/engine.ts")) {
        edits = [
          [
            "references: context.sourceQuery(",
            'references: renderTimed("snap-sources", context.sourceQuery,',
          ],
          [
            "const candidates = collectSnapCandidates(cursor, context, constrain).filter(",
            'const candidates = renderTimed("snap-collect", collectSnapCandidates, cursor, context, constrain).filter(',
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
          'import { renderSync, renderUpload, renderGpu, renderTimed } from "/benchmarks/render-trace.ts";\n' +
          source,
        map: null,
      };
    },
  };
}
