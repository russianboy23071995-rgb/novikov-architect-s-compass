import {
  PROJECT_RASTER_PIXEL_LIMIT,
  assertProjectRasterBudget,
  rasterPixels,
} from "../../domain/project/raster-budget.ts";
import { migrateProjectData } from "./load.ts";
import { payloadHashInput } from "./payload-hash-input.ts";
/** Shared checked asset codec. Limits are supplied by the caller, not product defaults. */
import { z } from "zod";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import {
  imageAssetSchema,
  createImageAssetHandle,
  reidentifyImageAssetHandle,
  type ImageAsset,
} from "../../domain/elements/reference/model.ts";
import { imageHeader } from "../images/import.ts";
import { assertValidatedProjectSize, PROJECT_FILE_LIMIT } from "./size.ts";
import type {
  RecoveryPayload as Payload,
  RecoveryDocument as Document,
} from "../../application/project-files/recovery-v2.ts";
export type ReadProbe = { legacy?: boolean; measure?: (phase: string, ms: number) => void };
export function verifyPayload(raw: unknown, probe: ReadProbe = {}): Payload {
  const { id: _id, ...payload } = verifyPayloadImage(raw, probe, false);
  return payload;
}
/** Own the validated copy before any asynchronous integrity check. */
function verifyPayloadImage(raw: unknown, probe: ReadProbe, own: boolean): ImageAsset {
  const started = performance.now();
  const shape = z
    .object({
      mimeType: z.unknown(),
      pixelWidth: z.unknown(),
      pixelHeight: z.unknown(),
      data: z.unknown(),
    })
    .strict()
    .parse(raw);
  const input = { id: "payload", ...shape };
  const p = own ? createImageAssetHandle(input) : imageAssetSchema.parse(input);
  probe.measure?.("schema", performance.now() - started);
  const decodeStart = performance.now();
  const binary = atob(p.data);
  const decoded = probe.legacy ? Uint8Array.from(binary, (c) => c.charCodeAt(0)) : binary;
  probe.measure?.("decode", performance.now() - decodeStart);
  const headerStart = performance.now();
  const header = imageHeader(decoded);
  if (
    header.mimeType !== p.mimeType ||
    header.width !== p.pixelWidth ||
    header.height !== p.pixelHeight
  )
    throw new Error("Image header mismatch");
  probe.measure?.("header", performance.now() - headerStart);
  return p;
}
export async function payloadKey(p: Payload, probe: ReadProbe = {}) {
  const started = performance.now();
  const encoded = payloadHashInput(p);
  probe.measure?.("hashInput", performance.now() - started);
  const hashStart = performance.now();
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  probe.measure?.("hash", performance.now() - hashStart);
  return Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, "0")).join("");
}
export type ReadControl = ReadProbe & {
  signal?: AbortSignal;
  schedule?: () => Promise<void>;
};
/** A real task boundary, not just a resolved promise. No transaction spans this wait. */
export async function readCheckpoint(control: ReadControl) {
  control.signal?.throwIfAborted();
  await (control.schedule?.() ?? new Promise<void>((resolve) => setTimeout(resolve, 0)));
  control.signal?.throwIfAborted();
}
/** Owned DB snapshot only. Reuse existing handle capability, never trust persisted flags. */
export async function restoreCheckedSnapshot(
  doc: Document,
  probe: ReadControl = {},
): Promise<Project> {
  await readCheckpoint(probe);
  const groups = new Map<string, { id: string; index: number }[]>();
  doc.model.assets.forEach((a, index) => {
    const group = groups.get(a.key) ?? [];
    group.push({ id: a.id, index });
    groups.set(a.key, group);
  });
  const assets: ImageAsset[] = new Array(doc.model.assets.length);
  for (const [key, links] of groups) {
    const raw = doc.blobs[key];
    if (!raw) throw new Error("Missing asset");
    const payload = verifyPayloadImage(raw, probe, true);
    if ((await payloadKey(payload, probe)) !== key) throw new Error("Asset integrity mismatch");
    for (const link of links) {
      const handleStart = performance.now();
      assets[link.index] = reidentifyImageAssetHandle(payload, link.id);
      probe.measure?.("handles", performance.now() - handleStart);
      await readCheckpoint(probe);
    }
  }
  const validateStart = performance.now();
  const project = migrateProjectData({ ...doc.model, assets });
  probe.measure?.("model", performance.now() - validateStart);
  await readCheckpoint(probe);
  return project;
}
export function createAssetPreparation({
  maxBytes,
  maxPixels,
}: {
  maxBytes: number;
  maxPixels: number;
}) {
  if (![maxBytes, maxPixels].every((n) => Number.isSafeInteger(n) && n > 0))
    throw new Error("Invalid asset budget");
  const cache = new WeakMap<ImageAsset, { key: string; payload: Payload }>();
  let hashes = 0;
  return {
    get hashes() {
      return hashes;
    },
    async prepare(input: Project): Promise<Document> {
      const project = validateProject(input);
      const blobs: Record<string, Payload> = Object.create(null);
      const assets = [];
      let size = 0,
        pixels = 0;
      for (const asset of project.assets) {
        size += asset.data.length;
        pixels += asset.pixelWidth * asset.pixelHeight;
        if (size > maxBytes || pixels > maxPixels) throw new Error("Asset budget exceeded");
        let entry = cache.get(asset);
        if (!entry) {
          const { id: _id, ...raw } = asset;
          const payload = Object.freeze(verifyPayload(raw));
          entry = { key: await payloadKey(payload), payload };
          hashes++;
          cache.set(asset, entry);
        }
        blobs[entry.key] = entry.payload;
        assets.push({ id: asset.id, key: entry.key });
      }
      return { model: { ...project, assets }, blobs };
    },
  };
}

/** Explicit ingress budgets; no implicit increase of supported product capacity. */
export function createBoundedRecoveryCodec(limits: {
  modelBytes: number;
  payloadBytes: number;
  pixels: number;
}) {
  const budget = { ...limits };
  if (!Object.values(budget).every((n) => Number.isSafeInteger(n) && n > 0))
    throw new Error("Invalid recovery budget");
  const preparation = createAssetPreparation({
    maxBytes: budget.payloadBytes,
    maxPixels: budget.pixels,
  });
  const check = (doc: Document) => {
    if (new TextEncoder().encode(JSON.stringify(doc.model)).length > budget.modelBytes)
      throw new Error("Model budget exceeded");
    const linked = doc.model.assets.map((a) => {
      const payload = doc.blobs[a.key];
      if (!payload) throw new Error("Missing asset");
      return payload;
    });
    if (
      rasterPixels(linked) > budget.pixels ||
      linked.reduce(
        (sum, p) => sum + (typeof p.data === "string" ? p.data.length : budget.payloadBytes + 1),
        0,
      ) > budget.payloadBytes
    )
      throw new Error("Linked asset budget exceeded");
    let bytes = 0,
      pixels = 0;
    for (const p of Object.values(doc.blobs)) {
      if (
        !p ||
        typeof p.data !== "string" ||
        !Number.isSafeInteger(p.pixelWidth) ||
        !Number.isSafeInteger(p.pixelHeight) ||
        p.pixelWidth <= 0 ||
        p.pixelHeight <= 0
      )
        throw new Error("Invalid payload budget input");
      bytes += p.data.length;
      pixels += p.pixelWidth * p.pixelHeight;
      if (bytes > budget.payloadBytes || !Number.isSafeInteger(pixels) || pixels > budget.pixels)
        throw new Error("Payload budget exceeded");
    }
  };
  return {
    async prepare(project: Project) {
      const doc = await preparation.prepare(project);
      check(doc);
      return doc;
    },
    async restore(doc: Document, control: ReadControl = {}) {
      control.signal?.throwIfAborted();
      check(doc);
      return restoreCheckedSnapshot(doc, control);
    },
  };
}

/** Product budgets over fully validated snapshots, without serializing image payloads. */
export function createProjectRecoveryCodec() {
  const bounded = createBoundedRecoveryCodec({
    modelBytes: PROJECT_FILE_LIMIT,
    payloadBytes: PROJECT_FILE_LIMIT,
    pixels: PROJECT_RASTER_PIXEL_LIMIT,
  });
  return {
    async prepare(input: Project) {
      const project = validateProject(input);
      assertValidatedProjectSize(project);
      assertProjectRasterBudget(project);
      return bounded.prepare(project);
    },
    async restore(...args: Parameters<typeof bounded.restore>) {
      const project = await bounded.restore(...args);
      // Preserve the full validation previously performed by serializeProject.
      assertValidatedProjectSize(validateProject(project));
      return project;
    },
  };
}
