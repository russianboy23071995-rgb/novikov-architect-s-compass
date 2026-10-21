import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { audit, buildGraph, cyclicEdges } from "./architecture-graph.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const graph = buildGraph(root);
const exceptions = JSON.parse(
  fs.readFileSync(new URL("./architecture-exceptions.json", import.meta.url), "utf8"),
);
const problems = audit(graph, exceptions);
console.log(
  `Architecture: ${graph.files.length} production files, ${graph.edges.filter((e) => e.internal).length} internal edges, ${cyclicEdges(graph).length} known cyclic edges.`,
);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "PASS: no new forbidden dependencies or runtime cycles; exceptions are exact and current.",
  );
