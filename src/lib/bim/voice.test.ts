import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpeech, recognitionConstructor, startVoice } from "./voice.ts";
import type { Recognition } from "./voice.ts";
import { previewCommand } from "./commands.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";

class FakeRecognition implements Recognition {
  static latest: FakeRecognition;
  lang = "";
  continuous = true;
  interimResults = true;
  aborted = false;
  onresult: Recognition["onresult"] = null;
  onerror: Recognition["onerror"] = null;
  onend: Recognition["onend"] = null;
  constructor() {
    FakeRecognition.latest = this;
  }
  start() {}
  abort() {
    this.aborted = true;
  }
}
function session() {
  const results: string[] = [],
    errors: string[] = [];
  let ended = 0;
  const cancel = startVoice(FakeRecognition, {
    result: (t) => results.push(t),
    error: (t) => errors.push(t),
    end: () => ended++,
  });
  return { r: FakeRecognition.latest, results, errors, cancel, ended: () => ended };
}
test("feature detection supports standard and prefixed constructors without requiring a browser", () => {
  assert.equal(recognitionConstructor({}), undefined);
  assert.equal(
    recognitionConstructor({ webkitSpeechRecognition: FakeRecognition }),
    FakeRecognition,
  );
  assert.equal(recognitionConstructor({ SpeechRecognition: FakeRecognition }), FakeRecognition);
});
test("one German utterance accepts only a final result and closes microphone", () => {
  const s = session();
  assert.equal(s.r.lang, "de-DE");
  assert.equal(s.r.continuous, false);
  assert.equal(s.r.interimResults, false);
  s.r.onresult!({ results: [{ isFinal: false, 0: { transcript: "Wand" } }] });
  assert.equal(s.results.length, 0);
  s.r.onresult!({ results: [{ isFinal: true, 0: { transcript: "Wandlänge sechs Meter" } }] });
  assert.deepEqual(s.results, ["Wandlänge sechs Meter"]);
  assert.equal(s.r.aborted, true);
  assert.equal(s.ended(), 1);
});
test("cancel rejects delayed results and duplicate cancellation", () => {
  const s = session();
  const late = s.r.onresult!;
  s.cancel();
  s.cancel();
  late({ results: [{ isFinal: true, 0: { transcript: "Wandhöhe 5 m" } }] });
  assert.deepEqual(s.results, []);
  assert.equal(s.ended(), 1);
});
test("permissions, network and microphone errors are visible and terminal", () => {
  for (const error of [
    "not-allowed",
    "service-not-allowed",
    "audio-capture",
    "no-speech",
    "network",
    "unknown",
  ]) {
    const s = session();
    s.r.onerror!({ error });
    assert.equal(s.errors.length, 1);
    assert.equal(s.r.aborted, true);
    assert.equal(s.r.onresult, null);
  }
});
test("empty recognition and synchronous start errors do not leave recording active", () => {
  const s = session();
  s.r.onend!();
  assert.equal(s.errors.length, 1);
  assert.equal(s.ended(), 1);
  class Broken extends FakeRecognition {
    override start() {
      throw new Error("blocked");
    }
  }
  let ended = false;
  let message = "";
  startVoice(Broken, {
    result: () => assert.fail(),
    error: (t) => (message = t),
    end: () => {
      ended = true;
    },
  });
  assert.equal(ended, true);
  assert.match(message, /nicht gestartet/);
});
test("spoken units, simple numbers and decimal commas use existing model validation", () => {
  const p = createExampleProject();
  assert.equal(normalizeSpeech("Wandhöhe auf drei Komma fünf Meter."), "wandhöhe auf 3,5 m");
  const result = previewCommand(
    p,
    { kind: "wall", id: "wall-1" },
    normalizeSpeech("Wandlänge auf sechs Meter!"),
  );
  assert.equal(result.result.storey.walls[0]!.end.x, 6);
  assert.equal(normalizeSpeech("Wandstärke 360 Millimeter"), "wandstärke 360 mm");
  assert.throws(() =>
    previewCommand(
      p,
      { kind: "wall", id: "wall-1" },
      normalizeSpeech("Wandlänge auf minus zwei Meter"),
    ),
  );
});
test("hundreds of walls do not change the selected stable ID target", () => {
  const p = createExampleProject();
  const template = p.storey.walls[0]!;
  for (let i = 0; i < 300; i++)
    p.storey.walls.push({
      ...template,
      id: `extra-${i}`,
      start: { x: i * 5, y: 5 },
      end: { x: i * 5 + 3, y: 5 },
    });
  const result = previewCommand(
    p,
    { kind: "wall", id: "extra-237" },
    normalizeSpeech("Wandhöhe vier Meter"),
  ).result;
  assert.equal(result.storey.walls.find((w) => w.id === "extra-237")!.height, 4);
  assert.equal(result.storey.walls.filter((w) => w.height !== 2.8).length, 1);
});

test("recording has a bounded lifetime", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const s = session();
  context.mock.timers.tick(20000);
  assert.equal(s.r.aborted, true);
  assert.match(s.errors[0]!, /20 Sekunden/);
});
