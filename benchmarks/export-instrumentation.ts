import type { Plugin } from "vite";
export function exportInstrumentation(): Plugin {
  return {
    name: "diagnostic-export-phases",
    enforce: "pre",
    apply: "build",
    transform(source, id) {
      const path = id.split("?")[0]!.replaceAll("\\", "/");
      let pairs: [string, string][] = [];
      if (path.endsWith("/src/lib/bim/model.ts"))
        pairs = [
          [
            "JSON.stringify(validateProject(project))",
            'measureExport("stringify", () => JSON.stringify(measureExport("validate", () => validateProject(project))))',
          ],
        ];
      if (path.endsWith("/src/interop/project-file/size.ts"))
        pairs = [
          [
            "new TextEncoder().encode(text).byteLength",
            'measureExport("utf8-size", () => new TextEncoder().encode(text).byteLength)',
          ],
        ];
      if (path.endsWith("/src/interop/project-file/browser-download.ts"))
        pairs = [
          [
            'URL.createObjectURL(new Blob([text], { type: "application/json" }))',
            'measureExport("blob-and-url", () => URL.createObjectURL(new Blob([text], { type: "application/json" })))',
          ],
        ];
      if (!pairs.length) return;
      let code = source;
      for (const [before, after] of pairs) {
        if (code.split(before).length !== 2) throw new Error(`Export profiler mismatch: ${path}`);
        code = code.replace(before, after);
      }
      return {
        code: 'import { measureExport } from "/benchmarks/export-trace.ts";\n' + code,
        map: null,
      };
    },
  };
}
