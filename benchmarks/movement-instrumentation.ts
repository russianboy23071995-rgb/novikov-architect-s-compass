import type { Plugin } from "vite";
function replaceOnce(source: string, before: string, after: string) {
  if (source.split(before).length !== 2)
    throw new Error(`Diagnostic instrumentation no longer matches: ${before}`);
  return source.replace(before, after);
}
export function movementInstrumentation(): Plugin {
  const functions: Record<string, [string, string][]> = {
    "/src/geometry/solids/profile-openings.ts": [
      ["extrudeProfileWithOpenings", "profile-extrusion"],
    ],
    "/src/interop/images/import.ts": [["checkedImageUrl", "image-url"]],
    "/src/application/selection/move.ts": [
      ["previewSelectionGeometry", "selection-preview"],
      ["previewSelectionMove", "selection-materialize"],
    ],
    "/src/domain/project/prepared-translation.ts": [["prepareTranslation", "selection-prepare"]],
    "/src/rendering/viewport/plan-scene.ts": [["derivePlanScene", "plan-scene"]],
    "/src/components/cad/PlanSceneRun.tsx": [["PlanSceneContent", "plan-run"]],
    "/src/domain/project/schema.ts": [["validateProject", "project-validation"]],
    "/src/domain/elements/wall/connections.ts": [["connectedWallSolids", "wall-solids"]],
    "/src/rendering/viewport/wall-plan-outline.ts": [["wallPlanOutlines", "plan-outlines"]],
    "/src/rendering/viewport/layer-display.ts": [["visiblePlanGeometry", "plan-visibility"]],
    "/src/application/tools/interaction.ts": [["evaluateInteraction", "precision-preview"]],
  };
  return {
    name: "diagnostic-movement-phases",
    enforce: "pre",
    apply: "serve",
    transform(source, id) {
      const path = id.split("?")[0]!.replaceAll(String.fromCharCode(92), "/");
      const entries = Object.entries(functions).find(([suffix]) => path.endsWith(suffix))?.[1];
      let code = source.replaceAll("\r\n", "\n");
      if (entries)
        for (const [name, phase] of entries) {
          const raw = `__diagnostic_${name}`;
          code = replaceOnce(code, `export function ${name}(`, `function ${raw}(`);
          code += `\nexport function ${name}(...args: Parameters<typeof ${raw}>) { return tracePhase("${phase}", () => ${raw}(...args)); }\n`;
        }
      else if (path.endsWith("/src/components/cad/BimPlan.tsx")) {
        code = replaceOnce(
          code,
          "const resolvePointer = (point: Point, shift = shiftHeld) =>\n    resolveLockedSnap(",
          'const resolvePointer = (point: Point, shift = shiftHeld) => tracePhase("snap", () =>\n    resolveLockedSnap(',
        );
        code = replaceOnce(
          code,
          "{ ortho, shift, featureSnap: endpointSnap },\n    );",
          "{ ortho, shift, featureSnap: endpointSnap },\n    ));",
        );
      } else return;
      return {
        code: 'import { tracePhase } from "/benchmarks/movement-trace.ts";\n' + code,
        map: null,
      };
    },
  };
}
