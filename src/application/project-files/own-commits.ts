import type { Project } from "../../domain/project/schema.ts";
import { isRecoverySnapshotSealed, type RecoverySnapshotV2 } from "./recovery-v2.ts";

/** A recovery record this session committed itself or already restored in full: the revision,
 * the validated project it encodes and a private copy of its valid snapshot (`fallback`: the
 * predecessor was the valid one). The status display may confirm such a record, and a writer
 * prepared again may continue from it, without decoding and hashing every image again
 * (docs/performance/RECOVERY_STATUS.md, RECOVERY_CHECKS.md). Restores never use it.
 */
type OwnCommit = {
  revision: string;
  savedAt: string;
  project: Project;
  current: RecoverySnapshotV2;
  fallback?: boolean;
};
const commits = new Map<string, OwnCommit>();

/** Containers copied, strings (image data) shared: storage-side changes cannot reach it. */
export function plainCopy<T>(value: T): T {
  // A sealed snapshot is already a deeply frozen private copy.
  if (isRecoverySnapshotSealed(value)) return value;
  if (Array.isArray(value)) return value.map(plainCopy) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, plainCopy(entry)]),
    ) as T;
  return value;
}

export function rememberOwnRecoveryCommit(projectId: string, commit: OwnCommit): void {
  commits.set(projectId, { ...commit, current: plainCopy(commit.current) });
}

/** The own commit only while the stored record still is that revision of that project. */
export function ownRecoveryCommit(projectId: string, raw: unknown): OwnCommit | undefined {
  const own = commits.get(projectId);
  if (!own || !raw || typeof raw !== "object") return undefined;
  const record = raw as { projectId?: unknown; revision?: unknown };
  return record.projectId === projectId && record.revision === own.revision ? own : undefined;
}
