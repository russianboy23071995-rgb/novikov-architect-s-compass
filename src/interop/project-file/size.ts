import { projectStorageData } from "../../domain/project/storage-data.ts";
import type { Project } from "../../domain/project/schema.ts";
/** Aggregate portable project budget; independent from individual image ingress. */
export const PROJECT_FILE_LIMIT = 128 * 1024 * 1024;
export const PROJECT_FILE_SIZE_ERROR = "Projektdatei ist größer als 128 MiB.";
/** Distinguishes the public size error from parse/schema failures at UI adapters. */
export class ProjectFileSizeError extends Error {
  constructor() {
    super(PROJECT_FILE_SIZE_ERROR);
    this.name = "ProjectFileSizeError";
  }
}
export function assertProjectFileSize(text: string): void {
  if (new TextEncoder().encode(text).byteLength > PROJECT_FILE_LIMIT)
    throw new ProjectFileSizeError();
}

/** Only after full schema validation: canonical base64 is ASCII and needs no JSON escaping.
 * Keep every field and empty data string in the structural JSON, then add payload lengths.
 * No cache keyed by mutable project/asset IDs; changes and duplicate payloads all count.
 */
export function validatedProjectByteLength(project: Project): number {
  const structure = {
    ...projectStorageData(project),
    assets: project.assets.map((asset) => ({ ...asset, data: "" })),
  };
  return (
    new TextEncoder().encode(JSON.stringify(structure)).byteLength +
    project.assets.reduce((bytes, asset) => bytes + asset.data.length, 0)
  );
}

export function assertValidatedProjectSize(project: Project): void {
  if (validatedProjectByteLength(project) > PROJECT_FILE_LIMIT) throw new ProjectFileSizeError();
}
