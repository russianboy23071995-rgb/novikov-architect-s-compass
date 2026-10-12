export const PROJECT_FILE_LIMIT = 10 * 1024 * 1024;
export function assertProjectFileSize(text: string): void {
  if (new TextEncoder().encode(text).byteLength > PROJECT_FILE_LIMIT)
    throw new Error("Projektdatei ist größer als 10 MB.");
}
