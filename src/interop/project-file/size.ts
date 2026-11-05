import { storeyStorageData } from "../../domain/project/storage-data.ts";
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
 * The only cache is by storey object identity, and only for owned immutable snapshots.
 */
export function validatedProjectByteLength(
  project: Project,
  storeyBytes?: StoreyByteCache,
): number {
  const encoder = new TextEncoder();
  const bytes = (value: unknown) => encoder.encode(JSON.stringify(value)).byteLength;
  // The storey array serializes as "[" + storeys joined by "," + "]"; the frame with an empty
  // array already holds both brackets, so add each storey and the separators between them.
  const frame = bytes({
    ...project,
    storeys: [],
    assets: project.assets.map((asset) => ({ ...asset, data: "" })),
  });
  const storeys = project.storeys.reduce((sum, storey) => {
    let size = storeyBytes?.get(storey);
    if (size === undefined) {
      size = bytes(storeyStorageData(storey));
      storeyBytes?.set(storey, size);
    }
    return sum + size;
  }, 0);
  return (
    frame +
    storeys +
    project.storeys.length -
    1 +
    project.assets.reduce((sum, asset) => sum + asset.data.length, 0)
  );
}

/** Byte lengths by storey object. Pass one only for deeply immutable owned snapshots:
 * identity then fixes content, so a cached length can never describe changed data.
 */
export type StoreyByteCache = WeakMap<object, number>;

export function assertValidatedProjectSize(project: Project, storeyBytes?: StoreyByteCache): void {
  if (validatedProjectByteLength(project, storeyBytes) > PROJECT_FILE_LIMIT)
    throw new ProjectFileSizeError();
}
