import { useMemo, useRef, useState } from "react";
import { importImage } from "@/interop/images/import";
import type { ImageAsset } from "@/domain/elements/reference/model";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import { previewCreateReference } from "@/application/references/actions";
import type { ToolInteraction } from "@/application/tools/interaction";
import { querySnap } from "@/constraints/snapping/engine";
import { parseMetres } from "@/core/units/metres";
export function useImageImport(
  project: Project,
  visibility: LayerVisibilityPolicy,
  commit: (p: Project, id: string) => void,
) {
  const [draft, setDraft] = useState<{
    base: Project;
    visibility: LayerVisibilityPolicy;
    asset: ImageAsset;
    id: string;
  } | null>(null);
  const [width, setWidth] = useState("5");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const epoch = useRef(0);
  const latest = useRef({ project, visibility, draft, width, commit });
  latest.current = { project, visibility, draft, width, commit };
  const cancel = () => {
    epoch.current++;
    setDraft(null);
    setBusy(false);
    setError("");
  };
  const begin = async (file: File) => {
    cancel();
    const token = epoch.current;
    const base = project,
      policy = visibility;
    setBusy(true);
    try {
      const asset = await importImage(file, `asset-${crypto.randomUUID()}`);
      if (
        token !== epoch.current ||
        latest.current.project !== base ||
        latest.current.visibility !== policy
      )
        return;
      setDraft({ base, visibility: policy, asset, id: `reference-${crypto.randomUUID()}` });
    } catch (e) {
      if (token === epoch.current)
        setError(e instanceof Error ? e.message : "Bildimport fehlgeschlagen.");
    } finally {
      if (token === epoch.current) setBusy(false);
    }
  };
  const active = draft?.base === project && draft.visibility === visibility ? draft : null;
  const adapter = useMemo<ToolInteraction | null>(() => {
    if (!active) return null;
    const preview = (point: { x: number; y: number }) => {
      const now = latest.current;
      if (
        now.project !== active.base ||
        now.visibility !== active.visibility ||
        now.draft !== active ||
        now.width !== width
      )
        throw new Error("Importkontext geändert.");
      const metres = parseMetres(width);
      if (!Number.isFinite(metres) || metres <= 0)
        throw new Error("Positive Bildbreite in Metern eingeben.");
      const layerId = project.defaultLayerIds.line;
      if (visibility.context.hiddenLayerIds.includes(layerId))
        throw new Error("Ebene 2D-Zeichnungen zuerst einblenden.");
      return previewCreateReference(project, now.project, {
        projectId: project.id,
        asset: active.asset,
        reference: {
          id: active.id,
          kind: "image-reference",
          assetId: active.asset.id,
          layerId,
          origin: point,
          rotation: 0,
          metresPerPixel: metres / active.asset.pixelWidth,
        },
      });
    };
    return {
      identity: { active, width },
      origin: { x: 0, y: 0 },
      input: null,
      click: "confirm",
      snapping: { origin: null, sources: (r) => [...r], resolve: querySnap },
      preview: () => {
        throw new Error("Breite in Werkzeugeigenschaften eingeben.");
      },
      previewProject: preview,
      validate: (p) => {
        preview(p);
      },
      commit: (p) => {
        const next = preview(p);
        latest.current.commit(next, active.id);
        cancel();
      },
      cancel,
    };
  }, [active, width, project, visibility]);
  return { begin, cancel, width, setWidth, error, busy, active: !!active, adapter };
}
