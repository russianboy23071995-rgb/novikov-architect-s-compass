/** Isolated Node capacity probe. No product limits or storage are changed.
 * One size/path per process; parent watchdog bounds time and RSS. Ctrl+C stops children.
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { deflateSync, inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { readProjectFile } from "../src/lib/bim/history.ts";
import { splitProject, pack, unpack, restoreProject } from "./asset-contract.ts";

const MiB = 1024 * 1024;
function crc(b) {
  let c = 0xffffffff;
  for (const v of b) {
    c ^= v;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type);
  const b = Buffer.alloc(data.length + 12);
  b.writeUInt32BE(data.length);
  t.copy(b, 4);
  data.copy(b, 8);
  b.writeUInt32BE(crc(b.subarray(4, -4)), b.length - 4);
  return b;
}
function png(seed) {
  const width = 768,
    stride = width * 4 + 1,
    raw = Buffer.alloc(stride * width);
  let state = seed;
  for (let y = 0; y < width; y++)
    for (let x = 1; x < stride; x++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      raw[y * stride + x] = state >>> 24;
    }
  const compressed = deflateSync(raw, { level: 1 });
  if (!inflateSync(compressed).equals(raw)) throw Error("PNG codec mismatch");
  const h = Buffer.alloc(13);
  h.writeUInt32BE(width);
  h.writeUInt32BE(width, 4);
  h[8] = 8;
  h[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", h),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const digest = (s) => createHash("sha256").update(s).digest("hex");
async function worker(size, mode) {
  const report = {
    size,
    mode,
    node: process.version,
    phases: [],
    history: [],
    checks: [],
    status: "running",
  };
  const budget = {
    modelBytes: 32 * MiB,
    payloadBytes: 300 * MiB,
    pixels: 100_000_000,
    packageBytes: 310 * MiB,
  };
  const memory = () => {
    const m = process.memoryUsage();
    return {
      rss: m.rss,
      heapUsed: m.heapUsed,
      external: m.external,
      maxRss: process.resourceUsage().maxRSS * 1024,
    };
  };
  async function phase(name, fn) {
    report.activePhase = name;
    const start = performance.now();
    let timerDelay;
    const timer = new Promise((resolve) =>
      setTimeout(() => {
        timerDelay = performance.now() - start;
        resolve();
      }, 0),
    );
    const result = await fn();
    await timer;
    report.phases.push({
      name,
      ms: performance.now() - start,
      timerDelayMs: timerDelay,
      ...memory(),
    });
    process.stdout.write(JSON.stringify({ progress: name, ...memory() }) + "\n");
    return result;
  }
  try {
    let project = await phase("fixture", () => {
      const p = recoveryFixture("large-capacity", 10000);
      let sum = 0,
        i = 0;
      while (sum < size * MiB) {
        const data = png(++i).toString("base64");
        sum += data.length;
        p.assets.push(
          createImageAssetHandle({
            id: `a${i}`,
            mimeType: "image/png",
            pixelWidth: 768,
            pixelHeight: 768,
            data,
          }),
        );
        p.storey.references.push({
          id: `r${i}`,
          kind: "image-reference",
          assetId: `a${i}`,
          layerId: p.defaultLayerIds.line,
          origin: { x: i * 8, y: 0 },
          rotation: 0,
          metresPerPixel: 0.01,
        });
      }
      return validateProject(p);
    });
    report.assets = project.assets.length;
    report.pixels = report.assets * 768 * 768;
    // Both paths start with the SAME validated handles, full JSON comparison is independent.
    let inline = JSON.stringify(project);
    report.inlineBytes = Buffer.byteLength(inline);
    const expected = digest(inline);
    try {
      readProjectFile(inline);
      throw Error("Product limit unexpectedly admitted probe");
    } catch (e) {
      if (!String(e).includes("32 MiB")) throw e;
    }
    report.checks.push("product rejects >32MiB");
    inline = null;
    let doc;
    if (mode === "split") doc = await phase("split", () => splitProject(project, budget));
    const snapshots = [];
    for (let i = 1; i <= 100; i++) {
      project = validateProject({
        ...project,
        storey: {
          ...project.storey,
          lines: project.storey.lines.map((l, j) =>
            j === 0 ? { ...l, color: i % 2 ? "#112233" : "#334455" } : l,
          ),
        },
      });
      snapshots.push(
        mode === "inline"
          ? project
          : { model: { ...project, assets: doc.model.assets }, blobs: doc.blobs },
      );
      if ([1, 10, 50, 100].includes(i)) {
        global.gc?.();
        const row = { count: i, ...memory() };
        const start = performance.now();
        const text =
          mode === "inline" ? JSON.stringify(project) : JSON.stringify(snapshots.at(-1).model);
        row.serializationMs = performance.now() - start;
        row.serializedBytes = Buffer.byteLength(text);
        report.history.push(row);
        process.stdout.write(JSON.stringify({ progress: `history-${i}`, ...memory() }) + "\n");
      }
    }
    report.checks.push("100 geometry-validated snapshots; shared payload identity");
    if (
      mode === "inline"
        ? snapshots[0].assets[0] !== project.assets[0]
        : snapshots[0].blobs !== doc.blobs
    )
      throw Error("Payload identity lost");
    // Return geometry to fixture value (the even final colour already matches fixture).
    if (digest(JSON.stringify(project)) !== expected) throw Error("History content mismatch");
    snapshots.length = 0;
    global.gc?.();
    let text = await phase("write", () =>
      mode === "inline" ? JSON.stringify(project) : pack(doc, budget),
    );
    report.serializedBytes = Buffer.byteLength(text);
    let loaded = await phase("read", async () =>
      mode === "inline"
        ? validateProject(JSON.parse(text))
        : restoreProject(await unpack(text, budget)),
    );
    if (digest(JSON.stringify(loaded)) !== expected) throw Error("Roundtrip mismatch");
    loaded = null;
    report.checks.push("full project SHA256 roundtrip equal");
    global.gc?.();
    // Existing envelope shape, memory only: NOT IndexedDB nor durable disk I/O.
    let recovery = await phase("recoveryEnvelopeWrite", () =>
      JSON.stringify({
        version: 1,
        current: { savedAt: "2026-10-12T00:00:00Z", json: text },
        previous: { savedAt: "2026-10-11T00:00:00Z", json: text },
      }),
    );
    report.recoveryBytes = Buffer.byteLength(recovery);
    text = null;
    global.gc?.();
    await phase("recoveryEnvelopeRead", () => {
      const parsed = JSON.parse(recovery);
      if (parsed.current.json !== parsed.previous.json) throw Error("Envelope mismatch");
    });
    report.checks.push("two-snapshot envelope content equal");
    recovery = null;
    report.status = "completed";
  } catch (e) {
    report.status = "failed";
    report.error = String(e);
  }
  report.finalMemory = memory();
  process.stdout.write(JSON.stringify({ result: report }) + "\n");
}
if (process.argv[2] === "--worker") {
  const size = Number(process.argv[3]),
    mode = process.argv[4];
  if (![50, 100, 250].includes(size) || !["inline", "split"].includes(mode))
    throw Error("Invalid profile");
  await worker(size, mode);
} else {
  const size = Number(process.argv[2]),
    output = process.argv[3];
  if (![50, 100, 250].includes(size) || !output)
    throw Error(
      "Usage: node --experimental-strip-types benchmarks/large-asset-capacity.mjs 50|100|250 output.json",
    );
  const results = [];
  for (const mode of ["inline", "split"]) {
    const result = await new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        [
          "--expose-gc",
          "--max-old-space-size=1536",
          "--experimental-strip-types",
          fileURLToPath(import.meta.url),
          "--worker",
          String(size),
          mode,
        ],
        { stdio: ["ignore", "pipe", "pipe"] },
      );
      let pending = "",
        final,
        reason = "",
        errors = "";
      const cancel = () => {
        reason = "cancelled";
        child.kill();
      };
      process.once("SIGINT", cancel);
      const watchdog = setTimeout(() => {
        reason = "180s deadline";
        child.kill();
      }, 180000);
      child.stdout.on("data", (data) => {
        pending += data;
        let end;
        while ((end = pending.indexOf("\n")) >= 0) {
          const line = pending.slice(0, end);
          pending = pending.slice(end + 1);
          const msg = JSON.parse(line);
          if (msg.result) final = msg.result;
          else {
            console.log(size, mode, msg.progress, Math.round(msg.rss / MiB) + " MiB RSS");
            if (msg.rss > 2400 * MiB) {
              reason = "RSS checkpoint above 2400 MiB";
              child.kill();
            }
          }
        }
      });
      child.stderr.on("data", (d) => {
        errors = (errors + d).slice(-2000);
      });
      child.on("error", (e) => {
        reason = String(e);
      });
      child.on("exit", (code, signal) => {
        clearTimeout(watchdog);
        process.removeListener("SIGINT", cancel);
        resolve(final ?? { size, mode, status: "stopped", reason, code, signal, errors });
      });
    });
    results.push(result);
    writeFileSync(
      output,
      JSON.stringify(
        {
          date: new Date().toISOString(),
          hardware: { logicalCpus: cpus().length, totalMemory: totalmem() },
          results,
        },
        null,
        2,
      ),
    );
    if (result.reason === "cancelled") break;
  }
  console.log("Report:", output);
}
