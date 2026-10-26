import { validateProject, type Project } from "../../domain/project/schema.ts";
import {
  parseRecoveryV2,
  restoreRecoveryV2,
  type RecoveryV2Storage,
  type RecoveryV2Codec,
  type RecoverySnapshotV2,
  type RecoveryRecordV2,
} from "./recovery-v2.ts";
import { ownRecoveryCommit, plainCopy, rememberOwnRecoveryCommit } from "./own-commits.ts";
import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";

/** One session owns its expected revision. Only a completed commit advances it. */
export async function prepareRecoveryV2Writer(
  storage: RecoveryV2Storage,
  projectId: string,
  codec: RecoveryV2Codec,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  const source = await storage.read();
  signal?.throwIfAborted();
  let project: Project | undefined;
  let revision: string | null = null,
    previous: RecoverySnapshotV2 | undefined;
  // A record this session committed itself (same revision) needs no second full check when a
  // writer is prepared again, e.g. reopening the file or undoing across a file open
  // (docs/performance/RECOVERY_CHECKS.md). Foreign revisions are still restored in full.
  const own = ownRecoveryCommit(projectId, source.record);
  if (own) {
    // Structure and version are still checked (cheap; no images are decoded).
    if (parseRecoveryV2(source.record).projectId !== projectId)
      throw new Error("Recovery project mismatch");
    project = own.project;
    // The written snapshot as this session holds it, not the stored copy: a store-side change
    // at the same revision must not become the next fallback.
    previous = plainCopy(own.current);
    revision = own.revision;
  } else if (source.record !== null) {
    const result = await restoreRecoveryV2(source.record, projectId, codec, signal);
    project = result.project;
    const record = parseRecoveryV2(source.record);
    previous = structuredClone(result.fallback ? record.previous! : record.current);
    revision = record.revision;
    rememberOwnRecoveryCommit(projectId, { ...result, current: previous });
  } else if (source.legacy !== null) throw new Error("Explicit V1 migration required");
  let busy = false;
  return {
    get project() {
      return project;
    },
    async save(input: Project, isCurrent: () => boolean, abort?: AbortSignal, now = new Date()) {
      if (busy) throw new Error("Recovery save already running");
      busy = true;
      try {
        const check = () => {
          abort?.throwIfAborted();
          if (!isCurrent()) throw new Error("Recovery context changed");
        };
        check();
        // Domain validation owns a stable model snapshot and preserves checked asset handles.
        const candidate = validateProject(input);
        if (candidate.id !== projectId) throw new Error("Recovery project mismatch");
        const savedAt = now.toISOString();
        const document = await codec.prepare(candidate);
        check();
        const next: RecoveryRecordV2 = {
          version: 2,
          projectId,
          revision: crypto.randomUUID(),
          current: { savedAt, document },
          ...(previous ? { previous } : {}),
        };
        await storage.publish({ legacy: source.legacy, revision }, next, abort, isCurrent);
        // Do not re-check cancellation after commit: the write already succeeded.
        revision = next.revision;
        previous = next.current;
        project = candidate;
        // An owned input keeps its identity, so the status display compares without re-validating.
        rememberOwnRecoveryCommit(projectId, {
          revision: next.revision,
          savedAt,
          project: isOwnedProjectSnapshot(input) ? input : candidate,
          current: next.current,
        });
        return { savedAt, revision };
      } finally {
        busy = false;
      }
    },
  };
}
