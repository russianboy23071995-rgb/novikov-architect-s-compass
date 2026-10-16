import test from "node:test";
import assert from "node:assert/strict";
import { createImageResourcePool } from "./resource-pool.ts";
import { createImageAssetHandle } from "../../domain/elements/reference/model.ts";

function asset(id: string, width = 100) {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, 100);
  return createImageAssetHandle({
    id,
    mimeType: "image/png",
    pixelWidth: width,
    pixelHeight: 100,
    data: Buffer.from(bytes).toString("base64"),
  });
}
function harness(bytes = 1024, entries = 64) {
  const blobs: { bytes: Uint8Array; mime: string }[] = [],
    revoked: string[] = [];
  const pool = createImageResourcePool(
    {
      create: (bytes, mime) => {
        blobs.push({ bytes, mime });
        return `blob:${blobs.length}`;
      },
      revoke: (url) => revoked.push(url),
    },
    { bytes, entries },
  );
  return { pool, blobs, revoked };
}
test("five views reuse twenty assets without recreating sources; bytes remain exact", () => {
  const { pool, blobs, revoked } = harness();
  const assets = Array.from({ length: 20 }, (_, i) => asset(String(i), i + 1));
  pool.setSources(assets);
  for (const floor of [0, 1, 2, 3, 4, 0, 1, 0, 1, 4, 2, 3]) {
    const leases = assets.slice(floor * 4, floor * 4 + 4).map((a) => pool.acquire(a)!);
    assert.ok(leases.every(Boolean));
    leases.forEach((l) => l.release());
  }
  assert.equal(blobs.length, 20);
  assert.equal(revoked.length, 0);
  assert.equal(pool.stats().bytes, 480);
  assert.equal(pool.stats().hits, 28);
  for (let i = 0; i < assets.length; i++) {
    assert.deepEqual(blobs[i]!.bytes, new Uint8Array(Buffer.from(assets[i]!.data, "base64")));
    assert.equal(blobs[i]!.mime, "image/png");
  }
});
test("hard byte limit protects pinned resources and permits fallback", () => {
  const { pool, revoked } = harness(24);
  const a = asset("a"),
    b = asset("b");
  pool.setSources([a, b]);
  const first = pool.acquire(a)!;
  assert.equal(pool.acquire(b), undefined);
  assert.equal(pool.stats().bytes, 24);
  assert.deepEqual(revoked, []);
  first.release();
  assert.ok(pool.acquire(b));
  assert.deepEqual(revoked, [first.url]);
});
test("entry limit evicts least recently used idle resource, not active users", () => {
  const { pool, revoked } = harness(1024, 2);
  const a = asset("a"),
    b = asset("b"),
    c = asset("c");
  pool.setSources([a, b, c]);
  const la = pool.acquire(a)!;
  la.release();
  const lb = pool.acquire(b)!;
  lb.release();
  pool.acquire(a)!.release();
  pool.acquire(c)!.release();
  assert.deepEqual(revoked, [lb.url]);
  assert.equal(pool.stats().entries, 2);
});
test("replacement with same ID, removal and undo never return stale sources", () => {
  const { pool, revoked } = harness();
  const old = asset("same"),
    next = asset("same", 200);
  pool.setSources([old]);
  const a = pool.acquire(old)!;
  pool.setSources([next]);
  const b = pool.acquire(next)!;
  assert.notEqual(a.url, b.url);
  assert.deepEqual(revoked, []);
  a.release();
  a.release();
  assert.deepEqual(revoked, [a.url]);
  b.release();
  pool.setSources([]);
  assert.equal(pool.stats().entries, 0);
  pool.setSources([old]); // Undo: still valid immutable payload, new resource lease.
  assert.notEqual(pool.acquire(old)!.url, a.url);
});
test("untrusted lookalikes and storage-valid invalid headers never become blob URLs", () => {
  const { pool, blobs } = harness();
  const good = asset("a");
  assert.equal(pool.acquire(Object.freeze({ ...good })), undefined);
  assert.equal(pool.acquire(createImageAssetHandle({ ...good, pixelWidth: 101 })), undefined);
  assert.equal(pool.acquire(createImageAssetHandle({ ...good, data: "AAAA" })), undefined);
  assert.equal(blobs.length, 0);
});
test("clear frees idle resources and defers active revocation until last release", () => {
  const { pool, revoked } = harness();
  const a = asset("a"),
    b = asset("b");
  pool.setSources([a, b]);
  const first = pool.acquire(a)!,
    second = pool.acquire(a)!;
  pool.acquire(b)!.release();
  pool.clear();
  assert.equal(revoked.length, 1);
  first.release();
  assert.equal(revoked.length, 1);
  second.release();
  second.release();
  assert.equal(revoked.length, 2);
  assert.equal(pool.stats().bytes, 0);
});
test("oversized resources and failed allocation leave no retained resource", () => {
  const a = asset("a");
  assert.equal(harness(1).pool.acquire(a), undefined);
  const pool = createImageResourcePool({
    create: () => {
      throw Error("allocation failed");
    },
    revoke: () => assert.fail(),
  });
  assert.equal(pool.acquire(a), undefined);
  assert.equal(pool.stats().entries, 0);
  assert.equal(pool.stats().bytes, 0);
});
