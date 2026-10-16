import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";

for (const compressed of [false, true]) {
  test(`trace aggregates repeated sources without payloads (${compressed ? "gzip" : "json"})`, () => {
    const dir = mkdtempSync(join(tmpdir(), "novikov-trace-"));
    try {
      const event = (name, ts, dur, data = {}, extra = {}) => ({
        name,
        ts,
        dur,
        pid: 1,
        tid: 2,
        ph: "X",
        args: { data },
        ...extra,
      });
      const url = "data:image/png;base64,PRIVATE_PAYLOAD";
      const traceEvents = [
        event("ResourceSendRequest", 1, 0, { url }),
        event("EventDispatch", 100, 100, { type: "dblclick" }),
        event("v8::Debugger::AsyncTaskRun", 110, 50),
        event("v8::Debugger::AsyncTaskRun", 120, 20),
        event("ResourceSendRequest", 125, 0, { url }),
        event("ResourceSendRequest", 130, 0, { url }, { tid: 3 }),
        event("v8::Debugger::AsyncTaskRun", 150, 100),
        event("ResourceSendRequest", 170, 0, { url: `${url}2` }),
      ];
      const raw = Buffer.from(JSON.stringify({ traceEvents }));
      const path = join(dir, "trace.json");
      writeFileSync(path, compressed ? gzipSync(raw) : raw);
      const output = execFileSync(process.execPath, ["benchmarks/trace-image-reloads.mjs", path], {
        encoding: "utf8",
      });
      assert.ok(!output.includes("PRIVATE_PAYLOAD"));
      const result = JSON.parse(output);
      assert.equal(result.rows[0].imageRequests, 2);
      assert.equal(result.rows[0].previouslyRequestedInTrace, 1);
      assert.equal(result.rows[0].imageContainingAsyncMs, 0.09);
      assert.equal(result.distinctImageSources, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
