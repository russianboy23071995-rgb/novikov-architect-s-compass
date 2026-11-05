import { useState } from "react";
import { chooseObject, type ObjectToolDefaults } from "@/application/objects/defaults";
import {
  OBJECT_CATALOG,
  OBJECT_CATALOG_IDS,
  OBJECT_GENRES,
  searchObjects,
  type ObjectCatalogId,
  type ObjectGenre,
} from "@/domain/elements/object/catalog";
import { objectRule } from "@/domain/elements/object/rules";
import type { Layer } from "@/domain/layers/model";
import type { Material } from "@/domain/elements/wall/assembly";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FloatingPanel } from "./FloatingPanel";
import { ObjectFields } from "./ObjectFields";
import { ObjectAxonometricPreview, ObjectPlanPreview } from "./ObjectPreview";

const GENRES = Object.keys(OBJECT_GENRES) as ObjectGenre[];
const inGenre = (genre: ObjectGenre) =>
  OBJECT_CATALOG_IDS.filter((id) => OBJECT_CATALOG[id].genre === genre);
const startSize = (catalogId: ObjectCatalogId) => ({
  catalogId,
  ...OBJECT_CATALOG[catalogId].size,
  options: objectRule(catalogId)?.options ?? {},
});

/**
 * Library window (docs/OBJEKTBIBLIOTHEK.md, M1): genres on the left, the entries with previews
 * in the middle, 2D and 3D preview and the values on the right. "Platzieren" or a double click
 * on an entry closes it; the object then hangs at the cursor. The search field looks through
 * all genres (M3); Enter takes the first hit, a click on a genre leaves the search.
 */
export function LibraryWindow({
  value,
  onChange,
  onPlace,
  onClose,
  layers,
  materials,
}: {
  value: ObjectToolDefaults;
  onChange: (value: ObjectToolDefaults) => void;
  onPlace: () => void;
  onClose: () => void;
  layers: readonly Layer[];
  materials: readonly Material[];
}) {
  const [genre, setGenre] = useState<ObjectGenre>(OBJECT_CATALOG[value.catalogId].genre);
  const [query, setQuery] = useState("");
  const entry = OBJECT_CATALOG[value.catalogId];
  const searching = query.trim() !== "";
  const entries = searching ? searchObjects(query) : inGenre(genre);
  const choose = (id: ObjectCatalogId) => {
    onChange(chooseObject(value, id));
    setGenre(OBJECT_CATALOG[id].genre);
  };
  return (
    <FloatingPanel open centered title="Bibliothek" onClose={onClose} width={900} height={600}>
      <div className="grid h-full min-h-0 grid-cols-[170px_minmax(0,1fr)_280px]">
        <nav aria-label="Gattungen" className="space-y-0.5 overflow-auto border-r p-2">
          <input
            type="search"
            autoFocus
            aria-label="Katalog durchsuchen"
            placeholder="Suchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && entries[0]) choose(entries[0]);
            }}
            className="mb-1.5 w-full rounded border bg-background px-2 py-1 text-sm"
          />
          {GENRES.map((id) => (
            <button
              key={id}
              type="button"
              aria-current={!searching && id === genre ? "true" : undefined}
              onClick={() => {
                setGenre(id);
                setQuery("");
              }}
              className={cn(
                "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm",
                !searching && id === genre ? "bg-accent font-medium" : "hover:bg-accent/50",
              )}
            >
              {OBJECT_GENRES[id]}
              <span className="text-xs text-muted-foreground">{inGenre(id).length}</span>
            </button>
          ))}
        </nav>
        <ul
          aria-label={searching ? "Suchergebnis" : OBJECT_GENRES[genre]}
          className="grid auto-rows-min grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2 overflow-auto p-3"
        >
          {searching && !entries.length && (
            <li role="status" className="col-span-full text-sm text-muted-foreground">
              Nichts gefunden für „{query.trim()}“.
            </li>
          )}
          {entries.map((id) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={id === value.catalogId}
                onClick={() => choose(id)}
                onDoubleClick={() => {
                  choose(id);
                  onPlace();
                }}
                className={cn(
                  "w-full rounded border p-2 text-left text-xs",
                  id === value.catalogId ? "border-primary bg-accent" : "hover:bg-accent/50",
                )}
              >
                <ObjectPlanPreview object={startSize(id)} className="mb-1 h-20 w-full" />
                {OBJECT_CATALOG[id].name}
              </button>
            </li>
          ))}
        </ul>
        <aside aria-label="Auswahl" className="flex min-h-0 flex-col gap-2 border-l p-3">
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
            <h3 className="text-sm font-semibold">{entry.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              <figure className="rounded border p-1">
                <ObjectPlanPreview object={value} className="h-28 w-full" />
                <figcaption className="text-center text-xs text-muted-foreground">2D</figcaption>
              </figure>
              <figure className="rounded border p-1">
                <ObjectAxonometricPreview object={value} className="h-28 w-full" />
                <figcaption className="text-center text-xs text-muted-foreground">3D</figcaption>
              </figure>
            </div>
            <ObjectFields
              key={value.catalogId}
              label="Objekt im Katalog"
              value={value}
              onChange={onChange}
              layers={layers}
              materials={materials}
            />
          </div>
          <Button size="sm" className="shrink-0" onClick={onPlace}>
            Platzieren
          </Button>
        </aside>
      </div>
    </FloatingPanel>
  );
}
