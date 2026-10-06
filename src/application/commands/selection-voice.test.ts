import test from "node:test";
import assert from "node:assert/strict";
import { startSelectionVoice, type VoiceSelectionContext } from "./selection-voice.ts";
import {
  previewSelectionCommand,
  applySelectionCommand,
  type SelectionCommandPreview,
} from "./selection-command.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { selectionIndex } from "../selection/state.ts";
import { normalizeSpeech, type Recognition } from "../../lib/bim/voice.ts";
class Fake implements Recognition {
  static latest: Fake;
  lang = "";
  continuous = true;
  interimResults = true;
  aborted = false;
  onresult: Recognition["onresult"] = null;
  onerror: Recognition["onerror"] = null;
  onend: Recognition["onend"] = null;
  constructor() {
    Fake.latest = this;
  }
  start() {}
  abort() {
    this.aborted = true;
  }
}
function setup() {
  const project = createExampleProject();
  const context: VoiceSelectionContext = {
    project,
    targets: [...selectionIndex(project).values()],
    visibility: createLayerVisibilityPolicy(project, ALL_LAYERS_VISIBLE),
  };
  let current = context,
    ended = 0;
  const previews: SelectionCommandPreview[] = [],
    errors: string[] = [],
    transcripts: string[] = [];
  const stop = startSelectionVoice(Fake, context, () => current, {
    transcript: (t) => transcripts.push(t),
    preview: (p) => previews.push(p),
    error: (e) => errors.push(e),
    end: () => ended++,
  });
  const recognition = Fake.latest;
  return {
    context,
    previews,
    errors,
    transcripts,
    recognition,
    stop,
    ended: () => ended,
    change: (next: VoiceSelectionContext) => {
      current = next;
    },
  };
}
const utterance = (transcript: string, isFinal = true) => ({
  results: [{ isFinal, 0: { transcript } }],
});
test("group speech produces exactly the text preview, leaves model unchanged and needs explicit acceptance", () => {
  const s = setup(),
    before = JSON.stringify(s.context.project);
  s.recognition.onresult!(utterance("Auswahl um zwei Meter bei neunzig Grad verschieben.", false));
  assert.equal(s.previews.length, 0);
  s.recognition.onresult!(utterance("Auswahl um zwei Meter bei neunzig Grad verschieben."));
  assert.equal(s.previews.length, 1);
  const c = s.context;
  assert.deepEqual(
    s.previews[0],
    previewSelectionCommand(
      c.project,
      c.targets,
      c.visibility,
      "auswahl um 2 m bei 90 grad verschieben",
    ),
  );
  assert.equal(JSON.stringify(c.project), before);
  assert.equal(s.recognition.aborted, true);
  assert.equal(s.ended(), 1);
  assert.equal(
    applySelectionCommand(c.project, c.targets, c.visibility, s.previews[0]!).storey.walls[0]!.start
      .y,
    2,
  );
});
test("model, selection, visibility and returned-selection revisions reject late results even before effect cleanup", () => {
  for (const kind of ["model", "selection", "visibility", "return"] as const) {
    const s = setup(),
      c = s.context;
    const next =
      kind === "model"
        ? { ...c, project: { ...c.project } }
        : kind === "selection"
          ? { ...c, targets: c.targets.slice(0, 1) }
          : kind === "visibility"
            ? { ...c, visibility: createLayerVisibilityPolicy(c.project, ALL_LAYERS_VISIBLE) }
            : { ...c };
    s.change(next);
    s.recognition.onresult!(utterance("Auswahl um 2 m bei 90 Grad verschieben"));
    assert.equal(s.previews.length, 0);
    assert.equal(s.transcripts.length, 0);
    assert.equal(s.recognition.aborted, true);
  }
});
test("explicit cancel rejects captured delayed callbacks and releases recognition once", () => {
  const s = setup(),
    late = s.recognition.onresult!;
  s.stop();
  s.stop();
  late(utterance("Auswahl um 2 m bei 90 Grad verschieben"));
  assert.equal(s.previews.length, 0);
  assert.equal(s.ended(), 1);
});
test("invalid speech remains editable, errors never create a preview", () => {
  const s = setup();
  s.recognition.onresult!(utterance("Auswahl um zwei Meter bei 566 Grad verschieben"));
  assert.match(s.transcripts[0]!, /566/);
  assert.equal(s.errors.length, 1);
  assert.equal(s.previews.length, 0);
});
test("network failure ends recording; stale errors are suppressed", () => {
  const s = setup();
  s.recognition.onerror!({ error: "network" });
  assert.match(s.errors[0]!, /nicht erreichbar/);
  assert.equal(s.ended(), 1);
  const stale = setup();
  stale.change({ ...stale.context });
  stale.recognition.onerror!({ error: "network" });
  assert.equal(stale.errors.length, 0);
  assert.equal(stale.ended(), 1);
});
test("explicit angular number words normalize without adding free-form interpretation", () => {
  for (const [word, angle] of [
    ["fünfundvierzig", 45],
    ["neunzig", 90],
    ["hundertachtzig", 180],
    ["zweihundertsiebzig", 270],
    ["dreihundertsechzig", 360],
  ] as const)
    assert.equal(
      normalizeSpeech(`Auswahl um zwei Komma fünf Meter bei ${word} Grad verschieben.`),
      `auswahl um 2,5 m bei ${angle} grad verschieben`,
    );
  assert.match(normalizeSpeech("Auswahl um minus zwei Meter"), /minus/);
});
