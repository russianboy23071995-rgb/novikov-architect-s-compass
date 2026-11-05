import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { PlanText } from "../../domain/elements/text/model.ts";

/** The standard Textelemente layer; texts use it unless a layer is chosen (docs/TEXT.md). */
export function defaultTextLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "text");
  if (!id) throw new Error("Die Standardebene Textelemente fehlt.");
  return id;
}

/** Shared text creation for tool and future AI adapters; full validation, own snapshot. */
export function addText(
  project: Project,
  text: Omit<PlanText, "layerId"> & { layerId?: string },
): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      texts: [
        ...(storeyOf(project).texts ?? []),
        { ...text, layerId: text.layerId ?? defaultTextLayerId(project) },
      ],
    }),
  });
}

/** One checked change of a text (content, font, size, alignment, rotation, colour, layer). */
export function updateText(
  project: Project,
  textId: string,
  changes: Partial<Omit<PlanText, "id">>,
): Project {
  const texts = storeyOf(project).texts ?? [];
  if (!texts.some((t) => t.id === textId)) throw new Error(`Unbekannter Text: ${textId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      texts: texts.map((t) => (t.id === textId ? { ...t, ...changes, id: t.id } : t)),
    }),
  });
}
