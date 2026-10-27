import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const normalize = (p) => p.split(path.sep).join("/");
const production = (p) => /\.(ts|tsx)$/.test(p) && !/\.(test|spec|d)\.tsx?$/.test(p);

/** Parse syntax, including re-exports, import types, require and literal dynamic imports. */
function specifiers(text, file, issues) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const result = new Set();
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier)
      result.add(node.moduleSpecifier.text);
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      result.add(node.argument.literal.text);
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference))
      result.add(node.moduleReference.expression?.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteralLike(argument)) result.add(argument.text);
      else issues.add(`${file}: non-literal import/require cannot be checked`);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return [...result].filter(Boolean);
}

// UTF-8 text read as Latin-1/Windows-1252 and saved again: capital A with tilde followed by a
// continuation character (umlauts, sharp s), or a-circumflex + euro sign (dashes, quotes, ellipsis).
const MOJIBAKE = /\u00C3[\u0080-\u00BF\u0152\u0153\u0160\u0178\u2013\u2014\u201E]|\u00E2\u20AC/;

/** Read-only graph: never execute production modules or load user project data. */
export function buildGraph(root) {
  root = path.resolve(root);
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  if (config.error)
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const files = fs
    .readdirSync(path.join(root, "src"), { recursive: true })
    .map((f) => `src/${normalize(f)}`)
    .filter(production)
    .sort();
  const fileSet = new Set(files);
  const issues = new Set();
  const edges = new Map();
  for (const file of files) {
    const absolute = path.join(root, file);
    const text = fs.readFileSync(absolute, "utf8");
    // Broken UTF-8 in production texts (AUD14-07, docs/AUD14_ABGLEICH.md); tests may hold probes.
    text.split("\n").forEach((line, i) => {
      if (MOJIBAKE.test(line)) issues.add(`${file}:${i + 1}: broken UTF-8 text (mojibake)`);
    });
    // Emitted JS respects TS type elision (also mixed imports) rather than guessing
    // that every source-level import creates a runtime dependency.
    const emitted = ts.transpileModule(text, {
      fileName: absolute,
      compilerOptions: { ...parsed.options, noEmit: false, declaration: false },
    }).outputText;
    const runtime = new Set(specifiers(emitted, file, issues));
    for (const specifier of new Set([...specifiers(text, file, issues), ...runtime])) {
      const resolved = ts.resolveModuleName(
        specifier,
        absolute,
        parsed.options,
        ts.sys,
      ).resolvedModule;
      const internal = resolved && normalize(path.relative(root, resolved.resolvedFileName));
      const local = specifier.startsWith(".") || specifier.startsWith("@/");
      if (local && !resolved && !/\.(css|svg|png|jpg|jpeg|webp|woff2?)(\?.*)?$/.test(specifier))
        issues.add(`${file}: unresolved local import ${specifier}`);
      if (internal?.startsWith("src/") && !fileSet.has(internal))
        issues.add(`${file}: production imports excluded source ${internal}`);
      const to = internal && fileSet.has(internal) ? internal : specifier;
      const key = `${file} -> ${to}`;
      edges.set(key, {
        from: file,
        to,
        runtime: runtime.has(specifier) || edges.get(key)?.runtime === true,
        internal: fileSet.has(to),
      });
    }
  }
  return {
    files,
    edges: [...edges.values()].sort((a, b) => edgeKey(a).localeCompare(edgeKey(b))),
    issues: [...issues].sort(),
  };
}

export const edgeKey = ({ from, to }) => `${from} -> ${to}`;
const layer = (file) => (file.startsWith("src/lib/bim/") ? "legacy" : file.split("/")[1]);
const core = new Set(["domain", "geometry", "constraints"]);

export function forbidden(edge) {
  const from = layer(edge.from),
    to = layer(edge.to);
  if (
    (core.has(from) || ["application", "interop", "legacy"].includes(from)) &&
    !edge.internal &&
    /^(react(?:-dom)?(?:\/|$)|@react|@radix-ui|three(?:\/|$))/.test(edge.to)
  )
    return true;
  if (core.has(from)) {
    if (edge.internal && !core.has(to)) return true;
    if (
      !edge.internal &&
      /^(react(?:-dom)?(?:\/|$)|@react|@radix-ui|@tanstack|three(?:\/|$)|node:|fs$|path$)/.test(
        edge.to,
      )
    )
      return true;
  }
  if (edge.internal && to === "legacy" && from !== "legacy") return true;
  if (
    ["application", "interop", "legacy"].includes(from) &&
    ["components", "rendering", "hooks", "routes"].includes(to)
  )
    return true;
  if (from === "application" && to === "interop") return true;
  if (from === "legacy" && ["application", "interop"].includes(to)) return true;
  // Adapters may reference Application ports as types, not orchestrate actions.
  if (from === "interop" && to === "application" && edge.runtime) return true;
  return false;
}

/** Exact cyclic edges, not just SCC node sets: new chords also fail the gate. */
export function cyclicEdges(graph) {
  const adjacency = new Map(graph.files.map((f) => [f, []]));
  const runtime = graph.edges.filter((e) => e.internal && e.runtime);
  for (const e of runtime) adjacency.get(e.from).push(e.to);
  function reaches(start, goal, seen = new Set()) {
    if (start === goal) return true;
    if (seen.has(start)) return false;
    seen.add(start);
    return (adjacency.get(start) || []).some((next) => reaches(next, goal, seen));
  }
  return runtime
    .filter((e) => reaches(e.to, e.from))
    .map(edgeKey)
    .sort();
}

export function audit(graph, exceptions) {
  const problems = [...graph.issues];
  for (const [kind, actual] of [
    ["boundaries", graph.edges.filter(forbidden).map(edgeKey)],
    ["cycles", cyclicEdges(graph)],
  ]) {
    const allowed = new Set();
    for (const entry of exceptions[kind] || []) {
      if (!entry.owner || !entry.removal || !entry.reason || !entry.edges?.length)
        problems.push(`Invalid ${kind} exception metadata`);
      for (const key of entry.edges || []) {
        if (allowed.has(key)) problems.push(`Duplicate ${kind} exception: ${key}`);
        allowed.add(key);
      }
    }
    const found = new Set(actual);
    for (const key of found) if (!allowed.has(key)) problems.push(`New ${kind}: ${key}`);
    for (const key of allowed)
      if (!found.has(key)) problems.push(`Remove stale ${kind} exception: ${key}`);
  }
  return problems.sort();
}
