import { PROJECT_MIN_READ_VERSION, PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { ProjectFileSizeError } from "../../interop/project-file/size.ts";
import { deserializeProject } from "./model.ts";
import type { Project } from "../../domain/project/schema.ts";
export { PROJECT_FILE_LIMIT } from "../../interop/project-file/size.ts";

/** File bridge only: the history lives in application/history/project-history.ts. */
export function readProjectFile(text: string): Project {
  try {
    return deserializeProject(text);
  } catch (error) {
    if (error instanceof ProjectFileSizeError) throw error;
    throw new Error(
      `Ungültige Projektdatei: erwartet wird ein NOVIKOV-JSON-Projekt (Version ${PROJECT_MIN_READ_VERSION} bis ${PROJECT_SCHEMA_VERSION}, Meter) mit gültigen Bauteilen.`,
    );
  }
}
