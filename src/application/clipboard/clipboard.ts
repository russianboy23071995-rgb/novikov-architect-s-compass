import type { Project } from "../../domain/project/schema.ts";
import { replaceStorey, storeyOf } from "../../domain/storeys/access.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import {
  ELEMENT_KINDS,
  elementKinds,
  storeyElements,
  type ElementKind,
  type ElementOf,
} from "../../domain/elements/registry.ts";
import { nextRoomNumber } from "../../domain/elements/room/model.ts";
import type { ElementTarget } from "../selection/target.ts";

type Storey = Project["storeys"][number];
type Item = { kind: ElementKind; element: ElementOf<ElementKind> };

/**
 * App-internal clipboard content (docs/KONTEXTMENUE.md, decision X): deep copies of the copied
 * elements, kind by kind through the element registry, so new kinds are copied too. Elements
 * hosted by a wall (windows, doors: field `wallId`) travel only with their wall; corner and T
 * connections only when all their walls are copied.
 */
export type ClipboardContent = Readonly<{
  items: readonly Item[];
  wallJoins: Storey["wallJoins"];
  wallTJunctions: Storey["wallTJunctions"];
  /** Hosted elements left out because their wall was not copied. */
  skippedHosted: number;
}>;

const hosted = (element: object): element is { wallId: string } =>
  "wallId" in element && typeof (element as { wallId: unknown }).wallId === "string";

/** Copy of the selection (any storey). Throws a readable message when nothing can be copied. */
export function copySelection(
  project: Project,
  targets: readonly ElementTarget[],
): ClipboardContent {
  const selected = new Set(targets.map((t) => `${t.kind}:${t.id}`));
  const items: Item[] = [];
  const joins: Storey["wallJoins"][number][] = [];
  const tJunctions: Storey["wallTJunctions"][number][] = [];
  let skippedHosted = 0;
  for (const storey of project.storeys) {
    const walls = new Set(
      storey.walls.filter((w) => selected.has(`wall:${w.id}`)).map((w) => w.id),
    );
    for (const kind of elementKinds)
      for (const element of storeyElements(storey, kind) as readonly ElementOf<ElementKind>[]) {
        const chosen = selected.has(`${kind}:${element.id}`);
        if (hosted(element)) {
          // Openings come with their copied wall; alone they would duplicate in place.
          if (walls.has(element.wallId)) items.push({ kind, element: structuredClone(element) });
          else if (chosen) skippedHosted++;
          continue;
        }
        if (chosen) items.push({ kind, element: structuredClone(element) });
      }
    joins.push(
      ...storey.wallJoins.filter((j) => walls.has(j.first.wallId) && walls.has(j.second.wallId)),
    );
    tJunctions.push(
      ...storey.wallTJunctions.filter(
        (t) => walls.has(t.hostWallId) && walls.has(t.incoming.wallId),
      ),
    );
  }
  if (!items.length)
    throw new Error(
      skippedHosted
        ? "Fenster und Türen werden nur zusammen mit ihrer Wand kopiert."
        : "Bitte zuerst Elemente auswählen.",
    );
  return Object.freeze({
    items,
    wallJoins: structuredClone(joins),
    wallTJunctions: structuredClone(tJunctions),
    skippedHosted,
  });
}

/**
 * Pastes the clipboard at the same position into the working storey (decision W): every
 * element gets a new id, hosted elements follow their new wall, rooms get the next free
 * numbers, connections are remapped. One checked change (one undo step); returns the new
 * project and the pasted targets for the selection.
 */
export function pasteClipboard(
  project: Project,
  content: ClipboardContent,
  newId: (kind: ElementKind) => string,
): { project: Project; targets: ElementTarget[] } {
  const ids = new Map<string, string>();
  for (const { kind, element } of content.items) ids.set(element.id, newId(kind));
  const wallId = (id: string) => ids.get(id) ?? id;
  let storey: Storey = { ...storeyOf(project) };
  const rooms = project.storeys.flatMap((s) => s.rooms ?? []);
  const targets: ElementTarget[] = [];
  for (const { kind, element } of content.items) {
    const copy = structuredClone(element) as ElementOf<ElementKind> & Record<string, unknown>;
    copy.id = ids.get(element.id)!;
    if (hosted(copy)) copy.wallId = wallId(copy.wallId);
    if (kind === "room") {
      copy.number = nextRoomNumber(rooms);
      rooms.push(copy as ElementOf<"room">);
    }
    const list = ELEMENT_KINDS[kind].list;
    storey = {
      ...storey,
      [list]: [...((storey[list] as readonly unknown[] | undefined) ?? []), copy],
    } as Storey;
    targets.push({ kind, id: copy.id } as ElementTarget);
  }
  storey = {
    ...storey,
    wallJoins: [
      ...storey.wallJoins,
      ...content.wallJoins.map((j) => ({
        first: { ...j.first, wallId: wallId(j.first.wallId) },
        second: { ...j.second, wallId: wallId(j.second.wallId) },
      })),
    ],
    wallTJunctions: [
      ...storey.wallTJunctions,
      ...content.wallTJunctions.map((t) => ({
        hostWallId: wallId(t.hostWallId),
        incoming: { ...t.incoming, wallId: wallId(t.incoming.wallId) },
      })),
    ],
  };
  try {
    return { project: validateLike(project, replaceStorey(project, storey)), targets };
  } catch (error) {
    // Walls pasted exactly onto existing wall corners (e.g. in the source storey itself).
    if (error instanceof Error && error.message.includes("Mehrfachanschluss"))
      throw new Error(
        "Einfügen an derselben Stelle nicht möglich: Die Wände würden genau auf bestehenden Wandecken liegen. In ein anderes Geschoss einfügen oder die Vorlage vorher verschieben.",
      );
    throw error;
  }
}

/** Short German summary for the notice: "3 Elemente kopiert". */
export function clipboardSummary(content: ClipboardContent, verb: string): string {
  const n = content.items.length;
  const text = `${n} ${n === 1 ? "Element" : "Elemente"} ${verb}`;
  return content.skippedHosted
    ? `${text}; ${content.skippedHosted} Fenster/Türen ohne ihre Wand nicht übernommen`
    : text;
}
