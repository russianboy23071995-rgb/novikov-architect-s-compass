import type { Plugin } from "vite";
/** Diagnostic-only build transform; keeps existing read checkpoints and validation. */
export function recoveryReadInstrumentation(): Plugin {
  return {
    name: "diagnostic-recovery-read",
    enforce: "pre",
    apply: "build",
    transform(source, id) {
      const path = id.split("?")[0]!.replaceAll("\\", "/");
      let edits: [string, string][] = [];
      if (path.endsWith("/src/application/project-files/recovery-catalog.ts")) {
        edits = [
          [
            "await catalog.v2.project(id).read()",
            'await recoveryAsync("storage-read", () => catalog.v2!.project(id).read())',
          ],
        ];
      } else if (path.endsWith("/src/interop/project-file/recovery-codec.ts")) {
        edits = [
          [
            "const encoded = payloadHashInput(p);",
            'const encoded = recoverySync("hash-buffer", () => payloadHashInput(p));',
          ],
          [
            "return restoreCheckedSnapshot(doc, control);",
            "return restoreCheckedSnapshot(doc, { ...control, measure: (phase, ms) => { recoveryMeasure(phase, ms); control.measure?.(phase, ms); } });",
          ],
          ["check(doc);", 'recoverySync("budget", () => check(doc));'],
          [
            "await bounded.restore(...args)",
            'await recoveryAsync("bounded-restore", () => bounded.restore(...args))',
          ],
          [
            "assertValidatedProjectSize(validateProject(project));",
            'recoverySync("final-validation-budget", () => assertValidatedProjectSize(validateProject(project)));',
          ],
        ];
      } else return;
      for (const [from, to] of edits) {
        if (!source.includes(from)) throw new Error(`Recovery profiler no longer matches ${from}`);
        source = source.replaceAll(from, to);
      }
      return {
        code:
          'import { recoveryAsync, recoverySync, recoveryMeasure } from "/benchmarks/recovery-read-trace.ts";\n' +
          source,
        map: null,
      };
    },
  };
}
