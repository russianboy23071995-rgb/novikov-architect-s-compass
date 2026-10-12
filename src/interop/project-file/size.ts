import type { Project } from "../../domain/project/schema.ts";
/** Aggregate portable project budget; independent from individual image ingress. */
export const PROJECT_FILE_LIMIT = 128 * 1024 * 1024;
export const PROJECT_FILE_SIZE_ERROR = "Projektdatei ist größer als 128 MiB.";
export function assertProjectFileSize(text: string): void {
  if (new TextEncoder().encode(text).byteLength > PROJECT_FILE_LIMIT)
    throw new Error(PROJECT_FILE_SIZE_ERROR);
}

/** Only after full schema validation: canonical base64 is ASCII and needs no JSON escaping.
 * Keep every field and empty data string in the structural JSON, then add payload lengths.
 * No cache keyed by mutable project/asset IDs; changes and duplicate payloads all count.
 */
export function validatedProjectByteLength(project: Project): number {
  const structure = {
    ...project,
    assets: project.assets.map((asset) => ({ ...asset, data: "" })),
  };
  return (
    new TextEncoder().encode(JSON.stringify(structure)).byteLength +
    project.assets.reduce((bytes, asset) => bytes + asset.data.length, 0)
  );
}

export function assertValidatedProjectSize(project: Project): void {
  if (validatedProjectByteLength(project) > PROJECT_FILE_LIMIT)
    throw new Error(PROJECT_FILE_SIZE_ERROR);
}
