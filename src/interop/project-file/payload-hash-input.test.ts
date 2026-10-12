import test from "node:test";
import assert from "node:assert/strict";
import { payloadHashInput } from "./payload-hash-input.ts";
import { payloadKey } from "./recovery-codec.ts";
import { createImageAssetHandle } from "../../domain/elements/reference/model.ts";
import type { RecoveryPayload } from "../../application/project-files/recovery-v2.ts";
const full = (p: RecoveryPayload) =>
  new TextEncoder().encode(JSON.stringify([p.mimeType, p.pixelWidth, p.pixelHeight, p.data]));
const asset = {
  id: "a",
  mimeType: "image/png" as const,
  pixelWidth: 1,
  pixelHeight: 1,
  data: "AA==",
};

test("registered hash bytes and SHA-256 equal the previous format across budgets and padding", async () => {
  for (const mimeType of ["image/png", "image/jpeg"] as const)
    for (const [pixelWidth, pixelHeight] of [
      [1, 1],
      [16384, 1],
      [4000, 4000],
    ])
      for (const data of [
        "AA==",
        "AAE=",
        "AAEC",
        Buffer.from(Array.from({ length: 256 }, (_, i) => i)).toString("base64"),
        "A".repeat(10 * 1024 * 1024),
      ]) {
        const p = createImageAssetHandle({ ...asset, mimeType, pixelWidth, pixelHeight, data });
        const expected = full(p);
        assert.deepEqual(payloadHashInput(p), expected);
        const hash = await crypto.subtle.digest("SHA-256", expected);
        assert.equal(await payloadKey(p), Buffer.from(hash).toString("hex"));
        assert.deepEqual(payloadHashInput(createImageAssetHandle({ ...p, id: "other" })), expected);
      }
});

test("only exact handle identity uses direct encoding; all other inputs retain JSON semantics", (t) => {
  const h = createImageAssetHandle(asset);
  const encode = t.mock.method(TextEncoder.prototype, "encodeInto");
  payloadHashInput(h);
  assert.equal(encode.mock.callCount(), 2);
  const candidates = [
    { ...h },
    JSON.parse(JSON.stringify(h)),
    Object.freeze({ ...h }),
    new Proxy(h, {}),
    { ...h, data: 'ä😀"\\\n\u0000\ud800' },
    { ...h, data: "not base64" },
    { ...h, mimeType: 'bad"mime' },
    { ...h, pixelWidth: NaN, pixelHeight: Infinity },
    {
      ...h,
      get data() {
        return '\\quoted"';
      },
    },
  ];
  for (const p of candidates)
    assert.deepEqual(payloadHashInput(p as RecoveryPayload), full(p as RecoveryPayload));
  assert.equal(encode.mock.callCount(), 2);
});
