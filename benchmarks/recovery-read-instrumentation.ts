import type { Plugin } from "vite";
/** Diagnostic-only build transform; keeps existing read checkpoints and validation. */
export function recoveryReadInstrumentation(): Plugin {
  return {
    name: "diagnostic-recovery-read",
    enforce: "pre",
    apply: "build",
    transform(source, id) {
      const path = id.split("?")[0]!.replaceAll("\\", "/");
      // A third entry marks an edit that only one code version contains (before/after builds).
      let edits: [string, string, "optional"?][] = [];
      if (path.endsWith("/src/application/project-files/recovery-catalog.ts")) {
        edits = [
          [
            "await catalog.v2.project(id).read()",
            'await recoveryAsync("storage-read", () => catalog.v2!.project(id).read())',
          ],
          // Caller attribution of full checks (docs/performance/RECOVERY_CHECKS.md).
          [
            "const result = await restoreRecoveryV2(source.record, id, catalog.v2.codec);",
            'const result = await recoveryCheck(options.trustOwnCommit ? "status" : "read", () => restoreRecoveryV2(source.record!, id, catalog.v2!.codec));',
          ],
        ];
      } else if (path.endsWith("/src/interop/project-file/recovery-v2-storage.ts")) {
        // Save path: copy, full check of current and previous, transaction (autosave image checks).
        edits = [
          [
            "const next = structuredClone(input);",
            'const next = recoverySync("publish-clone", () => structuredClone(input));',
            "optional",
          ],
          [
            "const { current, previous, ...record } = input;",
            "const cloneStart = performance.now(); const { current, previous, ...record } = input;",
            "optional",
          ],
          [
            "...(previous ? { previous: sealRecoverySnapshot(previous) } : {}),\n      };",
            '...(previous ? { previous: sealRecoverySnapshot(previous) } : {}),\n      }; recoveryMeasure("publish-clone", performance.now() - cloneStart);',
            "optional",
          ],
          [
            "await validate(next.current);",
            'await recoveryAsync("publish-validate-current", () => validate(next.current));',
          ],
          [
            "if (next.previous) await validate(next.previous);",
            'if (next.previous) await recoveryAsync("publish-validate-previous", () => validate(next.previous!)); const transactionStart = performance.now();',
          ],
          [
            "        oldHead.onsuccess = check;\n      });\n",
            '        oldHead.onsuccess = check;\n      });\n      recoveryMeasure("publish-transaction", performance.now() - transactionStart);\n',
          ],
        ];
      } else if (path.endsWith("/src/application/project-files/recovery-v2-writer.ts")) {
        edits = [
          [
            "const candidate = validateProject(input);",
            'const candidate = recoverySync("save-validate", () => validateProject(input));',
            "optional",
          ],
          [
            "const candidate = isOwnedProjectSnapshot(input) ? input : validateProject(input);",
            'const candidate = recoverySync("save-validate", () => isOwnedProjectSnapshot(input) ? input : validateProject(input));',
            "optional",
          ],
          [
            "const document = await codec.prepare(candidate);",
            'const document = await recoveryAsync("save-prepare", () => codec.prepare(candidate));',
          ],
          [
            "current: sealRecoverySnapshot({ savedAt, document }),",
            'current: recoverySync("save-seal", () => sealRecoverySnapshot({ savedAt, document })),',
            "optional",
          ],
          [
            "await restoreRecoveryV2(source.record, projectId, codec, signal);",
            'await recoveryCheck("writer-prepare", () => restoreRecoveryV2(source.record, projectId, codec, signal));',
          ],
        ];
      } else if (path.endsWith("/src/application/project-files/autosave.ts")) {
        edits = [
          [
            "const result = prepareLease(catalog, project!.id);",
            'recoveryEvent("lease-acquire", `${state.enabled}/${state.error}/${!!lease}`); const result = prepareLease(catalog, project!.id);',
          ],
          [
            "const active = await (lease ?? acquire());",
            'recoveryEvent(lease ? "save-with-lease" : "save-without-lease", `${manual}/${state.error}`); const active = await (lease ?? acquire());',
          ],
          [
            "      const switched = !project || next.id !== project.id || context !== nextContext;",
            '      const switched = !project || next.id !== project.id || context !== nextContext; if (switched) recoveryEvent("switched", `${!project}/${next.id !== project?.id}/${context !== nextContext}`);',
          ],
        ];
      } else if (path.endsWith("/src/application/project-files/recovery-v2.ts")) {
        edits = [
          [
            "await restoreRecoveryV2(source.record, projectId, codec, signal);",
            'await recoveryCheck("migrate", () => restoreRecoveryV2(source.record, projectId, codec, signal));',
          ],
        ];
      } else if (path.endsWith("/src/interop/project-file/recovery-retention.ts")) {
        edits = [
          [
            "await restoreRecoveryV2({ ...record, previous: undefined }, entry.key, codec, signal);",
            'await recoveryCheck("retention", () => restoreRecoveryV2({ ...record, previous: undefined }, entry.key, codec, signal));',
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
            "optional",
          ],
          [
            "return (control.prepared && preparedProject(doc)) || restoreCheckedSnapshot(doc, control);",
            "return (control.prepared && preparedProject(doc)) || restoreCheckedSnapshot(doc, { ...control, measure: (phase, ms) => { recoveryMeasure(phase, ms); control.measure?.(phase, ms); } });",
            "optional",
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
      for (const [from, to, optional] of edits) {
        if (!source.includes(from)) {
          if (optional) continue;
          throw new Error(`Recovery profiler no longer matches ${from}`);
        }
        source = source.replaceAll(from, to);
      }
      return {
        code:
          'import { recoveryAsync, recoverySync, recoveryMeasure, recoveryCheck, recoveryEvent } from "/benchmarks/recovery-read-trace.ts";\n' +
          source,
        map: null,
      };
    },
  };
}
