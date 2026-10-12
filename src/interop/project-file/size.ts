/** Aggregate portable project budget; independent from individual image ingress. */
export const PROJECT_FILE_LIMIT = 32 * 1024 * 1024;
export const PROJECT_FILE_SIZE_ERROR = "Projektdatei ist größer als 32 MiB.";
export function assertProjectFileSize(text: string): void {
  if (new TextEncoder().encode(text).byteLength > PROJECT_FILE_LIMIT)
    throw new Error(PROJECT_FILE_SIZE_ERROR);
}
