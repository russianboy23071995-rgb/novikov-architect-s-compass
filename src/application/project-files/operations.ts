import { validateProject, type Project } from "../../domain/project/schema.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import {
  assertValidatedProjectSize,
  PROJECT_FILE_LIMIT,
  PROJECT_FILE_SIZE_ERROR,
} from "../../interop/project-file/size.ts";
import { ensureDocumentFolder } from "../views/documents.ts";

export type ProjectFileSource = { name: string; size: number; text(): Promise<string> };
export type DownloadPort = (text: string, filename: string) => void;

/** Preparation never publishes a model or changes history. Cancellation discards this result. */
export async function prepareProjectOpen(file: ProjectFileSource) {
  if (file.size > PROJECT_FILE_LIMIT) throw new Error(PROJECT_FILE_SIZE_ERROR);
  const project = ensureDocumentFolder(readProjectFile(await file.text()));
  assertValidatedProjectSize(validateProject(project));
  return { name: file.name, project };
}

/** A browser download request cannot confirm durable storage or mark a project saved. */
export function requestProjectDownload(project: Project, download: DownloadPort) {
  // serializeProject already validates the model and enforces the exact UTF-8 budget.
  const text = serializeProject(project);
  download(text, "novikov-project.json");
  return { status: "download-requested" as const };
}
