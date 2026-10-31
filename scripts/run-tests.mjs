// npm test: runs the registered test files (package.json "testFiles") in one node --test run.
// The list lives outside the script line because Windows cmd limits a command line to 8191
// characters; spawning node directly has no such limit.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { testFiles } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
if (!Array.isArray(testFiles) || testFiles.length === 0)
  throw new Error('package.json "testFiles" fehlt oder ist leer.');
const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--test", ...testFiles, ...process.argv.slice(2)],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
