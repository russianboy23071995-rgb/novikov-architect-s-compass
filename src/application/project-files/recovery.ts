import { assertProjectRasterBudget } from "../../domain/project/raster-budget.ts";
import type { Project } from "../../domain/project/schema.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { assertProjectFileSize } from "../../interop/project-file/size.ts";
import { prepareProjectOpen } from "./operations.ts";

export interface RecoveryStorage {
  read(): Promise<string | null>;
  /** Atomic compare-and-replace; failure must preserve the old record. */
  replace(expected: string | null, next: string): Promise<void>;
}
export type Snapshot = { savedAt: string; json: string };
export type RecordData = { version: 1; current: Snapshot; previous?: Snapshot };
export function parseRecoveryRecord(raw: string): RecordData {
  let data: RecordData;
  try {
    data = JSON.parse(raw) as RecordData;
  } catch {
    throw new Error("Wiederherstellungsdatensatz beschädigt. Vorhandene Daten bleiben erhalten.");
  }
  if (data?.version !== 1)
    throw new Error("Ungültiger Wiederherstellungsdatensatz. Vorhandene Daten bleiben erhalten.");
  return data;
}
export async function prepareRecoverySnapshot(snapshot: Snapshot) {
  if (
    !snapshot ||
    typeof snapshot.json !== "string" ||
    typeof snapshot.savedAt !== "string" ||
    !Number.isFinite(Date.parse(snapshot.savedAt))
  )
    throw new Error("Ungültiger Wiederherstellungsstand.");
  const candidate = await prepareProjectOpen({
    name: "Lokaler Wiederherstellungsstand",
    size: new TextEncoder().encode(snapshot.json).length,
    text: async () => snapshot.json,
  });
  return { ...candidate, savedAt: snapshot.savedAt };
}
async function usable(data: RecordData) {
  try {
    return {
      ...(await prepareRecoverySnapshot(data.current)),
      snapshot: data.current,
      fallback: false,
    };
  } catch (error) {
    if (!data.previous) throw error;
    return {
      ...(await prepareRecoverySnapshot(data.previous)),
      snapshot: data.previous,
      fallback: true,
    };
  }
}
export async function readRecovery(storage: RecoveryStorage) {
  const raw = await storage.read();
  if (raw === null) return null;
  const { snapshot: _snapshot, ...candidate } = await usable(parseRecoveryRecord(raw));
  return candidate;
}

/** A private, byte-bound revision. Only committed writes advance its trusted predecessor. */
export async function prepareRecoveryWriter(storage: RecoveryStorage, projectId: string) {
  let expected = await storage.read();
  const candidate = expected === null ? undefined : await usable(parseRecoveryRecord(expected));
  if (candidate && candidate.project.id !== projectId)
    throw new Error("Wiederherstellungsstand gehört zu einem anderen Projekt.");
  let previous = candidate?.snapshot;
  let project = candidate?.project;
  let busy = false;
  return {
    get project() {
      return project;
    },
    async save(nextProject: Project, isCurrent: () => boolean, now = new Date()) {
      if (busy) throw new Error("Eine lokale Sicherung läuft bereits.");
      if (nextProject.id !== projectId) throw new Error("Projektkontext geändert.");
      busy = true;
      try {
        // Every new content still crosses the full validation/size boundary.
        assertProjectRasterBudget(nextProject);
        const json = serializeProject(nextProject);
        assertProjectFileSize(json);
        const current: Snapshot = { savedAt: now.toISOString(), json };
        const next = JSON.stringify({ version: 1, current, ...(previous ? { previous } : {}) });
        if (!isCurrent()) throw new Error("Sicherung vor Schreibbeginn abgebrochen.");
        await storage.replace(expected, next);
        expected = next;
        previous = current;
        project = nextProject;
        return { savedAt: current.savedAt };
      } finally {
        busy = false;
      }
    },
  };
}
export async function saveRecovery(project: Project, storage: RecoveryStorage, now = new Date()) {
  const json = serializeProject(project);
  assertProjectFileSize(json);
  const savedAt = now.toISOString();
  const expected = await storage.read();
  const previous =
    expected === null ? undefined : (await usable(parseRecoveryRecord(expected))).snapshot;
  const next: RecordData = {
    version: 1,
    current: { savedAt, json },
    ...(previous ? { previous } : {}),
  };
  await storage.replace(expected, JSON.stringify(next));
  return { savedAt };
}
