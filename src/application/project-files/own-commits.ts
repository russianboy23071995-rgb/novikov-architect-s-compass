import type { Project } from "../../domain/project/schema.ts";

/** A recovery record this session committed itself: the revision written and the validated
 * project it encodes. The status display may confirm such a record without decoding and
 * hashing every image again (docs/performance/RECOVERY_STATUS.md). Restores never use it.
 */
type OwnCommit = { revision: string; savedAt: string; project: Project };
const commits = new Map<string, OwnCommit>();

export function rememberOwnRecoveryCommit(projectId: string, commit: OwnCommit): void {
  commits.set(projectId, commit);
}

/** The own commit only while the stored record still is that revision of that project. */
export function ownRecoveryCommit(projectId: string, raw: unknown): OwnCommit | undefined {
  const own = commits.get(projectId);
  if (!own || !raw || typeof raw !== "object") return undefined;
  const record = raw as { projectId?: unknown; revision?: unknown };
  return record.projectId === projectId && record.revision === own.revision ? own : undefined;
}
