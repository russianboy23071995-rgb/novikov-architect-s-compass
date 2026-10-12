import type { Plugin } from "vite";
export function workspaceLoadInstrumentation(): Plugin {
  return {
    name: "diagnostic-workspace-load",
    enforce: "pre",
    apply: "serve",
    transform(source, id) {
      const path = id.split("?")[0]!.replaceAll("\\", "/");
      if (path.endsWith("/src/interop/images/import.ts")) {
        const marker = "function checkImageUrl(";
        if (source.split(marker).length !== 2) throw new Error("Image profiler no longer matches");
        return {
          code:
            'import { profileReducer } from "/benchmarks/workspace-load-trace.ts";\n' +
            source.replace(marker, "function measuredCheckImageUrl(") +
            '\nfunction checkImageUrl(...args: Parameters<typeof measuredCheckImageUrl>) { return profileReducer("image-url-validation", () => measuredCheckImageUrl(...args)); }',
          map: null,
        };
      }
      const name = path.endsWith("/src/components/cad/ProjectNavigator.tsx")
        ? "ProjectNavigator"
        : path.endsWith("/src/components/cad/BimPlan.tsx")
          ? "BimPlan"
          : path.endsWith("/src/application/direct-edit/controller.ts")
            ? "editingReducer"
            : null;
      if (!name) return;
      const marker = `export function ${name}(`;
      if (source.split(marker).length !== 2)
        throw new Error(`Workspace profiler no longer matches ${name}`);
      let code = source.replace(marker, `function measured${name}(`);
      if (name === "editingReducer") {
        code = 'import { profileReducer } from "/benchmarks/workspace-load-trace.ts";\n' + code;
        code += `\nexport function editingReducer(...args: Parameters<typeof measurededitingReducer>) { return profileReducer(args[1].type, () => measurededitingReducer(...args)); }`;
      } else {
        code =
          'import { Profiler as LoadProfiler } from "react";\nimport { profileWorkspace } from "/benchmarks/workspace-load-trace.ts";\n' +
          code;
        code += `\nexport function ${name}(props: Parameters<typeof measured${name}>[0]) { const Content = measured${name}; return <LoadProfiler id="${name}" onRender={profileWorkspace}><Content {...props} /></LoadProfiler>; }`;
      }
      return { code, map: null };
    },
  };
}
