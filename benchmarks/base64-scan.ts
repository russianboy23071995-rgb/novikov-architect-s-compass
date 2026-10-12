import { previousCanonicalBase64 } from "./base64-baseline.ts";
import { isCanonicalBase64 } from "../src/domain/elements/reference/base64.ts";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const rows = [];
for (const length of [1024, 1024 * 1024, 4 * 1024 * 1024, 10 * 1024 * 1024]) {
  const value = alphabet.repeat(Math.ceil(length / 64)).slice(0, length);
  const oldMs: number[] = [],
    newMs: number[] = [];
  for (let run = 0; run < 9; run++) {
    const methods =
      run % 2
        ? ([
            ["new", isCanonicalBase64],
            ["old", previousCanonicalBase64],
          ] as const)
        : ([
            ["old", previousCanonicalBase64],
            ["new", isCanonicalBase64],
          ] as const);
    for (const [name, check] of methods) {
      const start = performance.now();
      if (!check(value)) throw new Error("valid input rejected");
      const duration = performance.now() - start;
      if (run > 1) (name === "old" ? oldMs : newMs).push(duration);
    }
  }
  rows.push({ length, oldMs, newMs });
}
console.log(JSON.stringify({ node: process.version, platform: process.platform, rows }, null, 2));
