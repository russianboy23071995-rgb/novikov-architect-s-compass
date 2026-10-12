/** Isolated storage experiment; never imported by product code. */
import { z } from "zod";
import { validateProject, type Project } from "../src/lib/bim/model.ts";
import { readProjectFile } from "../src/lib/bim/history.ts";
import { imageAssetSchema, type ImageAsset } from "../src/domain/elements/reference/model.ts";
import { imageHeader } from "../src/interop/images/import.ts";
export type Payload = Omit<ImageAsset, "id">;
export type Manifest = Omit<Project, "assets"> & { assets: { id: string; key: string }[] };
export type Document = { model: Manifest; blobs: Readonly<Record<string, Readonly<Payload>>> };
export type Budget = {
  modelBytes: number;
  payloadBytes: number;
  pixels: number;
  packageBytes: number;
};
// Diagnostic budgets only, not new supported product limits.
export const probeBudget: Budget = {
  modelBytes: 10 * 1024 * 1024,
  payloadBytes: 10 * 1024 * 1024,
  pixels: 16_000_000,
  packageBytes: 10 * 1024 * 1024,
};
const bytes = (s: string) => new TextEncoder().encode(s).length;
function checkBudget(b: Budget) {
  for (const n of Object.values(b))
    if (!Number.isSafeInteger(n) || n <= 0) throw new Error("Invalid budget");
}
function freeze<T>(v: T): T {
  if (v && typeof v === "object") {
    for (const c of Object.values(v)) freeze(c);
    Object.freeze(v);
  }
  return v;
}
function payload(raw: unknown): Payload {
  const shape = z
    .object({
      mimeType: z.unknown(),
      pixelWidth: z.unknown(),
      pixelHeight: z.unknown(),
      data: z.unknown(),
    })
    .strict()
    .parse(raw);
  const { id: _id, ...p } = imageAssetSchema.parse({ id: "payload", ...shape });
  const header = imageHeader(Uint8Array.from(atob(p.data), (c) => c.charCodeAt(0)));
  if (
    header.mimeType !== p.mimeType ||
    header.width !== p.pixelWidth ||
    header.height !== p.pixelHeight
  )
    throw new Error("Image header mismatch");
  return p;
}
async function keyOf(p: Payload) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify([p.mimeType, p.pixelWidth, p.pixelHeight, p.data])),
  );
  return Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, "0")).join("");
}
function check(model: Manifest, blobs: Document["blobs"], b: Budget) {
  checkBudget(b);
  if (bytes(JSON.stringify(model)) > b.modelBytes) throw new Error("Model budget exceeded");
  let encoded = 0,
    pixels = 0;
  for (const p of Object.values(blobs)) {
    encoded += p.data.length;
    pixels += p.pixelWidth * p.pixelHeight;
  }
  if (encoded > b.payloadBytes || pixels > b.pixels) throw new Error("Payload budget exceeded");
}
export function restoreProject(doc: Document): Project {
  return validateProject({
    ...doc.model,
    assets: doc.model.assets.map((a) => {
      const p = doc.blobs[a.key];
      if (!p) throw new Error("Missing asset payload");
      return { ...p, id: a.id };
    }),
  });
}
export async function splitProject(input: Project, b: Budget = probeBudget): Promise<Document> {
  const validated = validateProject(input),
    blobs: Record<string, Payload> = Object.create(null),
    assets = [];
  for (const asset of validated.assets) {
    const { id, ...raw } = asset,
      p = payload(raw),
      key = await keyOf(p);
    blobs[key] ??= p;
    assets.push({ id, key });
  }
  const model = { ...validated, assets };
  check(model, blobs, b);
  return freeze({ model, blobs });
}
export async function migrateLegacy(text: string, b: Budget = probeBudget) {
  return splitProject(readProjectFile(text), b);
}
/** Explicit prototype version; not a proposed production schemaVersion 10. */
export function pack(doc: Document, b: Budget = probeBudget) {
  check(doc.model, doc.blobs, b);
  restoreProject(doc);
  const text = JSON.stringify({
    format: "novikov-asset-experiment",
    revision: 1,
    model: doc.model,
    blobs: Object.entries(doc.blobs).map(([key, payload]) => ({ key, payload })),
  });
  if (bytes(text) > b.packageBytes) throw new Error("Package budget exceeded");
  return text;
}
export async function unpack(text: string, b: Budget = probeBudget): Promise<Document> {
  checkBudget(b);
  if (bytes(text) > b.packageBytes) throw new Error("Package budget exceeded");
  const link = z
    .object({ id: z.string().min(1), key: z.string().regex(/^[a-f0-9]{64}$/) })
    .strict();
  const parsed = z
    .object({
      format: z.literal("novikov-asset-experiment"),
      revision: z.literal(1),
      model: z.object({ assets: z.array(link) }).passthrough(),
      blobs: z.array(
        z.object({ key: z.string().regex(/^[a-f0-9]{64}$/), payload: z.unknown() }).strict(),
      ),
    })
    .strict()
    .parse(JSON.parse(text));
  const blobs: Record<string, Payload> = Object.create(null);
  // Reject aggregate budgets before decoding/hashing the payloads.
  let size = 0,
    pixels = 0;
  for (const entry of parsed.blobs) {
    const p = imageAssetSchema.parse({ ...(entry.payload as object), id: "payload" });
    size += p.data.length;
    pixels += p.pixelWidth * p.pixelHeight;
    if (size > b.payloadBytes || pixels > b.pixels) throw new Error("Payload budget exceeded");
  }
  for (const entry of parsed.blobs) {
    if (blobs[entry.key]) throw new Error("Duplicate payload key");
    const p = payload(entry.payload);
    if ((await keyOf(p)) !== entry.key) throw new Error("Payload integrity mismatch");
    blobs[entry.key] = p;
  }
  const model = parsed.model as Manifest;
  check(model, blobs, b);
  const doc = { model, blobs };
  restoreProject(doc);
  return freeze(doc);
}
