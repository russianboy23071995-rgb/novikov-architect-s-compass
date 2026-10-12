import type { Plugin } from "vite";
/** Development-only measurement of the exact production renderer body. */
export function solidInstrumentation(): Plugin {
  return {
    name: "diagnostic-solid-phases",
    enforce: "pre",
    apply: "serve",
    transform(source, id) {
      if (!id.replaceAll("\\", "/").endsWith("/benchmarks/legacy-solid-renderer.ts")) return;
      let code = source.replaceAll("\r\n", "\n");
      const replace = (before: string, after: string) => {
        if (code.split(before).length !== 2) throw Error("Solid diagnostic drift: " + before);
        code = code.replace(before, after);
      };
      replace(
        "const data: number[] = [];",
        'const data = tracePhase("solid-projection-pack", () => { const data: number[] = [];',
      );
      replace(
        "gl.bindBuffer(gl.ARRAY_BUFFER, buffer);",
        "return data; });\n      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);",
      );
      replace(
        "gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);",
        'tracePhase("solid-buffer-submit", () => gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW));',
      );
      return {
        code: 'import { tracePhase } from "/benchmarks/movement-trace.ts";\n' + code,
        map: null,
      };
    },
  };
}
