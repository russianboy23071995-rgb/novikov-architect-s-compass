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
