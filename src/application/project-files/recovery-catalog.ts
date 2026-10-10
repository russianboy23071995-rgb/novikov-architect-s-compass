import type { Project } from "../../domain/project/schema.ts";
import {
  parseRecoveryRecord,
  prepareRecoverySnapshot,
  readRecovery,
  saveRecovery,
  type RecoveryStorage,
  type Snapshot,
  type RecordData,
} from "./recovery.ts";

export type RecoverySummary = { projectId: string; savedAt: string };
export interface RecoveryCatalog {
  legacy: RecoveryStorage;
  project(id: string): RecoveryStorage;
  list(): Promise<RecoverySummary[]>;
}

async function readLegacyProjects(catalog: RecoveryCatalog) {
  const warnings: string[] = [];
  const raw = await catalog.legacy.read();
  const grouped = new Map<string, Snapshot[]>();
  if (!raw) return { grouped, warnings };
  try {
    const old = parseRecoveryRecord(raw);
    for (const snapshot of [old.current, old.previous]) {
      if (!snapshot) continue;
      try {
        const candidate = await prepareRecoverySnapshot(snapshot);
        const entries = grouped.get(candidate.project.id) ?? [];
        entries.push(snapshot);
        grouped.set(candidate.project.id, entries);
      } catch {
        warnings.push(
          "Ein alter Wiederherstellungsstand ist beschädigt; Originaldaten bleiben erhalten.",
        );
      }
    }
  } catch {
    warnings.push(
      "Alter Wiederherstellungsdatensatz nicht lesbar; Originaldaten bleiben erhalten.",
    );
  }
  return { grouped, warnings };
}
/** Copy, never delete, the old slot. Current and previous may belong to different projects. */
export async function migrateLegacyRecovery(catalog: RecoveryCatalog): Promise<string[]> {
  const { grouped, warnings } = await readLegacyProjects(catalog);
  for (const [id, snapshots] of grouped) {
    const storage = catalog.project(id);
    if ((await storage.read()) !== null) continue;
    const record: RecordData = {
      version: 1,
      current: snapshots[0]!,
      ...(snapshots[1] ? { previous: snapshots[1] } : {}),
    };
    try {
      await storage.replace(null, JSON.stringify(record));
    } catch (error) {
      // Another tab may already have imported/saved this project. Never overwrite it.
      if ((await storage.read()) === null) throw error;
    }
  }
  return warnings;
}
export async function listRecoveryProjects(catalog: RecoveryCatalog) {
  let migrationWarning: string | undefined;
  try {
    await migrateLegacyRecovery(catalog);
  } catch {
    migrationWarning =
      "Übernahme alter Stände nicht abgeschlossen. Vorhandene Stände bleiben prüfbar; erneutes Öffnen versucht die Übernahme erneut.";
  }
  const result = await queryRecoveryProjects(catalog);
  if (migrationWarning) result.warnings.push(migrationWarning);
  return result;
}
export async function readProjectRecovery(catalog: RecoveryCatalog, id: string) {
  const storage = catalog.project(id);
  const raw = await storage.read();
  if (raw === null) {
    const { grouped } = await readLegacyProjects(catalog);
    const snapshot = grouped.get(id)?.[0];
    return snapshot ? { ...(await prepareRecoverySnapshot(snapshot)), fallback: false } : null;
  }
  const candidate = await readRecovery({ read: async () => raw, replace: storage.replace });
  if (candidate && candidate.project.id !== id)
    throw new Error("Wiederherstellungsstand gehört zu einem anderen Projekt.");
  return candidate;
}
export async function saveProjectRecovery(
  project: Project,
  catalog: RecoveryCatalog,
  now = new Date(),
) {
  await migrateLegacyRecovery(catalog);
  await readProjectRecovery(catalog, project.id);
  return saveRecovery(project, catalog.project(project.id), now);
}

/** Startup stays read-only, including legacy fallback; migration is deferred to the panel. */
export async function queryRecoveryProjects(catalog: RecoveryCatalog) {
  const projects = await catalog.list();
  const warnings: string[] = [];
  try {
    const legacy = await readLegacyProjects(catalog);
    warnings.push(...legacy.warnings);
    for (const [projectId, snapshots] of legacy.grouped) {
      if (!projects.some((p) => p.projectId === projectId))
        projects.push({ projectId, savedAt: snapshots[0]!.savedAt });
    }
  } catch {
    warnings.push("Alter Wiederherstellungsstand nicht lesbar; Originaldaten bleiben erhalten.");
  }

  projects.sort(
    (a, b) => b.savedAt.localeCompare(a.savedAt) || a.projectId.localeCompare(b.projectId),
  );
  return { projects, warnings };
}
