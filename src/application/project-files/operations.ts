import type { Project } from "../../domain/project/schema.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { assertProjectFileSize, PROJECT_FILE_LIMIT } from "../../interop/project-file/size.ts";
import { ensureDocumentFolder } from "../views/documents.ts";

export type ProjectFileSource = { name: string; size: number; text(): Promise<string> };
export type DownloadPort = (text: string, filename: string) => void;

/** Preparation never publishes a model or changes history. Cancellation discards this result. */
export async function prepareProjectOpen(file: ProjectFileSource) {
  if (file.size > PROJECT_FILE_LIMIT) throw new Error("Projektdatei ist größer als 10 MB.");
  const project = ensureDocumentFolder(readProjectFile(await file.text()));
  assertProjectFileSize(serializeProject(project));
  return { name: file.name, project };
}

/** A browser download request cannot confirm durable storage or mark a project saved. */
export function requestProjectDownload(project: Project, download: DownloadPort) {
  const text = serializeProject(project);
  assertProjectFileSize(text);
  download(text, "novikov-project.json");
  return { status: "download-requested" as const };
}
