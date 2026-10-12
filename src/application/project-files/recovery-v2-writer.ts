import { validateProject, type Project } from "../../domain/project/schema.ts";
import {
  parseRecoveryV2,
  restoreRecoveryV2,
  type RecoveryV2Storage,
  type RecoveryV2Codec,
  type RecoverySnapshotV2,
  type RecoveryRecordV2,
} from "./recovery-v2.ts";

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
  let revision: string | null = null,
    previous: RecoverySnapshotV2 | undefined;
  if (source.record !== null) {
    const result = await restoreRecoveryV2(source.record, projectId, codec, signal);
    const record = parseRecoveryV2(source.record);
    previous = structuredClone(result.fallback ? record.previous! : record.current);
    revision = record.revision;
  } else if (source.legacy !== null) throw new Error("Explicit V1 migration required");
  let busy = false;
  return {
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
        const project = validateProject(input);
        if (project.id !== projectId) throw new Error("Recovery project mismatch");
        const savedAt = now.toISOString();
        const document = await codec.prepare(project);
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
        return { savedAt, revision };
      } finally {
        busy = false;
      }
    },
  };
}
