// Local Chrome trace analysis. Emits aggregates only, never URLs or image payloads.
// Usage: node benchmarks/trace-image-reloads.mjs <trace.json[.gz]>
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";

const input = readFileSync(process.argv[2]);
const raw = input[0] === 31 && input[1] === 139 ? gunzipSync(input) : input;
const events = JSON.parse(raw.toString()).traceEvents;
const requests = events
  .filter((e) => e.name === "ResourceSendRequest" && e.args?.data?.url?.startsWith("data:image/"))
  .sort((a, b) => a.ts - b.ts);
const seen = new Set();
const sources = new Map();
for (const event of requests) {
  const url = event.args.data.url;
  const key = createHash("sha256").update(url).digest("hex");
  sources.set(event, { repeated: seen.has(key), characters: url.length });
  seen.add(key);
}
const clicks = events.filter(
  (e) => e.name === "EventDispatch" && e.args?.data?.type === "dblclick" && e.dur > 0,
);
const rows = clicks.map((click, index) => {
  const within = (e) =>
    e.pid === click.pid && e.tid === click.tid && e.ts >= click.ts && e.ts < click.ts + click.dur;
  const images = requests.filter(within);
  const tasks = events.filter(
    (e) => within(e) && e.name === "v8::Debugger::AsyncTaskRun" && e.ph === "X" && e.dur > 0,
  );
  const imageTasks = tasks.filter((task) =>
    images.some((e) => e.ts >= task.ts && e.ts < task.ts + task.dur),
  );
  // Merge intervals: nested/overlapping spans must not be added twice.
  const spans = imageTasks
    .map((e) => [e.ts, Math.min(e.ts + e.dur, click.ts + click.dur)])
    .sort((a, b) => a[0] - b[0]);
  let duration = 0,
    end = -Infinity;
  for (const [start, stop] of spans) {
    duration += Math.max(0, stop - Math.max(start, end));
    end = Math.max(end, stop);
  }
  return {
    index: index + 1,
    eventMs: click.dur / 1000,
    imageRequests: images.length,
    previouslyRequestedInTrace: images.filter((e) => sources.get(e).repeated).length,
    sourceCharacters: images.reduce((sum, e) => sum + sources.get(e).characters, 0),
    imageContainingAsyncSpans: imageTasks.length,
    imageContainingAsyncMs: duration / 1000,
  };
});
console.log(
  JSON.stringify(
    {
      traceSha256: createHash("sha256").update(input).digest("hex"),
      scope:
        "EventDispatch durations, not frame times. Async spans contain image requests but are not exclusive decoder CPU time. Repeated means observed earlier in this trace only.",
      distinctImageSources: seen.size,
      embeddedImageRequests: requests.length,
      rows,
    },
    null,
    2,
  ),
);
