import type { Project } from "../../domain/project/schema.ts";
import type { ImageAsset } from "../../domain/elements/reference/model.ts";
import { parseRecoveryRecord, prepareRecoverySnapshot } from "./recovery.ts";

export type RecoveryPayload = Omit<ImageAsset, "id">;
export type RecoveryManifest = Omit<Project, "assets"> & { assets: { id: string; key: string }[] };
export type RecoveryDocument = {
  model: RecoveryManifest;
  blobs: Readonly<Record<string, Readonly<RecoveryPayload>>>;
};
export type RecoverySnapshotV2 = { savedAt: string; document: RecoveryDocument };
export type RecoveryRecordV2 = {
  version: 2;
  projectId: string;
  revision: string;
  current: RecoverySnapshotV2;
  previous?: RecoverySnapshotV2;
};
/** Storage returns an owned consistent snapshot, never live mutable store objects. */
export interface RecoveryV2Storage {
  read(): Promise<{ legacy: string | null; record: unknown | null }>;
  /** Compare BOTH tokens and publish assets/current/previous atomically. Keep V1 untouched.
   * Resolve only after commit; reject/abort must leave the published state unchanged.
   * Once committed, a late abort must not turn success into failure.
   */
  publish(
    expected: { legacy: string | null; revision: string | null },
    next: RecoveryRecordV2,
    signal?: AbortSignal,
  ): Promise<void>;
}
/** Codec owns full payload schema/header/hash, model validation and resource budgets.
 * Production adapters must reuse the checked codec, not trust persisted handle flags.
 */
export interface RecoveryV2Codec {
  prepare(project: Project): Promise<RecoveryDocument>;
  restore(document: RecoveryDocument, control: { signal?: AbortSignal }): Promise<Project>;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid recovery record");
  return value as Record<string, unknown>;
}
export function parseRecoveryV2(raw: unknown): RecoveryRecordV2 {
  const r = object(raw);
  if (r["version"] !== 2) throw new Error("Unsupported recovery version");
  if (
    typeof r["projectId"] !== "string" ||
    !r["projectId"] ||
    typeof r["revision"] !== "string" ||
    !r["revision"]
  )
    throw new Error("Invalid recovery context");
  // Snapshot contents deliberately checked separately to permit a valid predecessor.
  return r as unknown as RecoveryRecordV2;
}
async function restoreSnapshot(
  snapshot: RecoverySnapshotV2,
  id: string,
  codec: RecoveryV2Codec,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const s = object(snapshot);
  if (typeof s["savedAt"] !== "string" || !Number.isFinite(Date.parse(s["savedAt"])))
    throw new Error("Invalid savedAt");
  const doc = object(s["document"]),
    model = object(doc["model"]);
  object(doc["blobs"]);
  if (!Array.isArray(model["assets"])) throw new Error("Invalid asset links");
  for (const raw of model["assets"]) {
    const link = object(raw);
    if (
      typeof link["id"] !== "string" ||
      !link["id"] ||
      typeof link["key"] !== "string" ||
      !link["key"]
    )
      throw new Error("Invalid asset link");
  }
  const project = await codec.restore(s["document"] as RecoveryDocument, signal ? { signal } : {});
  signal?.throwIfAborted();
  if (project.id !== id) throw new Error("Recovery project mismatch");
  return { project, savedAt: s["savedAt"] };
}
export async function restoreRecoveryV2(
  raw: unknown,
  projectId: string,
  codec: RecoveryV2Codec,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const record = parseRecoveryV2(raw);
  if (record.projectId !== projectId) throw new Error("Recovery project mismatch");
  try {
    return {
      ...(await restoreSnapshot(record.current, projectId, codec, signal)),
      fallback: false,
      revision: record.revision,
    };
  } catch (error) {
    signal?.throwIfAborted();
    if (!record.previous) throw error;
    return {
      ...(await restoreSnapshot(record.previous, projectId, codec, signal)),
      fallback: true,
      revision: record.revision,
    };
  }
}
/** Explicit migration only. Does not delete V1, mount a model or change project history. */
export async function migrateRecoveryV1(
  storage: RecoveryV2Storage,
  projectId: string,
  codec: RecoveryV2Codec,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const source = await storage.read();
  signal?.throwIfAborted();
  if (source.record !== null) {
    await restoreRecoveryV2(source.record, projectId, codec, signal);
    return { status: "existing" as const };
  }
  if (source.legacy === null) return { status: "empty" as const };
  const legacy = parseRecoveryRecord(source.legacy);
  const valid: Awaited<ReturnType<typeof prepareRecoverySnapshot>>[] = [];
  for (const snapshot of [legacy.current, legacy.previous]) {
    signal?.throwIfAborted();
    if (!snapshot) continue;
    let candidate: Awaited<ReturnType<typeof prepareRecoverySnapshot>>;
    try {
      candidate = await prepareRecoverySnapshot(snapshot);
    } catch {
      signal?.throwIfAborted();
      continue;
    }
    // A foreign slot is a context conflict, not a corrupt snapshot to discard.
    if (candidate.project.id !== projectId) throw new Error("Recovery project mismatch");
    valid.push(candidate);
  }
  if (!valid.length) throw new Error("No valid legacy recovery snapshot");
  const snapshots: RecoverySnapshotV2[] = [];
  for (const candidate of valid) {
    signal?.throwIfAborted();
    const snapshot = {
      savedAt: candidate.savedAt,
      document: await codec.prepare(candidate.project),
    };
    await restoreSnapshot(snapshot, projectId, codec, signal);
    snapshots.push(snapshot);
  }
  signal?.throwIfAborted();
  const next: RecoveryRecordV2 = {
    version: 2,
    projectId,
    revision: crypto.randomUUID(),
    current: snapshots[0]!,
    ...(snapshots[1] ? { previous: snapshots[1] } : {}),
  };
  await storage.publish({ legacy: source.legacy, revision: null }, next, signal);
  return { status: "migrated" as const, revision: next.revision };
}
