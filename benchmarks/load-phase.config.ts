import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
const targets: Record<string, string[]> = {
  "/src/application/direct-edit/controller.ts": ["editingReducer"],
  "/src/lib/bim/history.ts": ["commitProject"],
  "/src/domain/project/schema.ts": ["validateProject"],
  "/src/rendering/viewport/plan-scene.ts": ["derivePlanScene"],
  "/src/interop/images/import.ts": ["checkedImageUrl", "checkImageUrl", "imageHeader"],
};
const plugin: Plugin = {
  name: "load-phase-diagnostic",
  apply: "serve",
  enforce: "pre",
  transform(source, id) {
    const entry = Object.entries(targets).find(([path]) =>
      id.replaceAll("\\", "/").split("?")[0]!.endsWith(path),
    );
    if (!entry) return;
    let code = source;
    if (entry[0].endsWith("/images/import.ts")) {
      for (const [before, after] of [
        [
          "const binary = atob(asset.data);",
          'const binary = trace("atob", () => atob(asset.data));',
        ],
        [
          "const bytes = binaryBytes(binary);",
          'const bytes = trace("byte-conversion", () => binaryBytes(binary));',
        ],
      ]) {
        if (code.split(before!).length !== 2)
          throw new Error("Image phase instrumentation mismatch");
        code = code.replace(before!, after!);
      }
    }
    for (const name of entry[1]) {
      const prefix = code.includes(`export function ${name}(`) ? "export " : "";
      const needle = `${prefix}function ${name}(`;
      if (code.split(needle).length !== 2) throw new Error(`Instrumentation mismatch: ${name}`);
      code = code.replace(needle, `function __raw_${name}(`);
      code += `\n${prefix}function ${name}(...args:Parameters<typeof __raw_${name}>){return trace("${name}",()=>__raw_${name}(...args));}\n`;
    }
    return { code: 'import {trace} from "/benchmarks/load-phase-trace.ts";\n' + code, map: null };
  },
};
export default defineConfig({
  plugins: [plugin, react(), tailwind()],
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 8083, strictPort: true },
});
