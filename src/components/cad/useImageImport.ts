import { useMemo, useRef, useState } from "react";
import { importImage } from "@/interop/images/import";
import { imageDpi, metresPerPixelAtScale } from "@/interop/images/dpi";
import type { ImageAsset } from "@/domain/elements/reference/model";
import type { Project } from "@/domain/project/schema";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import { previewCreateReference } from "@/application/references/actions";
import type { ToolInteraction } from "@/application/tools/interaction";
import { querySnap } from "@/constraints/snapping/engine";
import { parseMetres } from "@/core/units/metres";

/**
 * Defaults of the underlay tool (docs/BILDUNTERLAGE.md, B1): the size of a new underlay from a
 * width in metres or from the plan scale and the scan resolution, and how it shows.
 */
export type UnderlayDefaults = {
  size: "width" | "scale";
  width: string;
  denominator: string;
  dpi: string;
  /** Percent, 5–100. */
  opacity: number;
  grayscale: boolean;
};
export const UNDERLAY_DEFAULTS: UnderlayDefaults = {
  size: "width",
  width: "5",
  denominator: "100",
  dpi: "300",
  opacity: 50,
  grayscale: false,
};

/** Metres per pixel of a new underlay from the defaults; throws a message for the bar. */
export function underlayMetresPerPixel(defaults: UnderlayDefaults, pixelWidth: number): number {
  if (defaults.size === "width") {
    const metres = parseMetres(defaults.width);
    if (!Number.isFinite(metres) || metres <= 0)
      throw new Error("Positive Bildbreite in Metern eingeben.");
    return metres / pixelWidth;
  }
  const denominator = Number(defaults.denominator.trim().replace(",", "."));
  const dpi = Number(defaults.dpi.trim().replace(",", "."));
  if (!Number.isFinite(denominator) || denominator <= 0)
    throw new Error("Maßstab eingeben, z. B. 100 für 1:100.");
  if (!Number.isFinite(dpi) || dpi <= 0) throw new Error("Auflösung in dpi eingeben, z. B. 300.");
  return metresPerPixelAtScale(denominator, dpi);
}

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
    /** The resolution the file states, if any. */
    fileDpi: number | null;
  } | null>(null);
  const [defaults, setDefaults] = useState<UnderlayDefaults>(UNDERLAY_DEFAULTS);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const epoch = useRef(0);
  const latest = useRef({ project, visibility, draft, defaults, commit });
  latest.current = { project, visibility, draft, defaults, commit };
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
      const fileDpi = imageDpi(new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer()));
      const asset = await importImage(file, `asset-${crypto.randomUUID()}`);
      if (
        token !== epoch.current ||
        latest.current.project !== base ||
        latest.current.visibility !== policy
      )
        return;
      // A scan that states its resolution: the scale field takes it (B1).
      if (fileDpi) setDefaults((d) => ({ ...d, dpi: String(fileDpi).replace(".", ",") }));
      setDraft({
        base,
        visibility: policy,
        asset,
        id: `reference-${crypto.randomUUID()}`,
        fileDpi,
      });
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
        now.defaults !== defaults
      )
        throw new Error("Importkontext geändert.");
      const metresPerPixel = underlayMetresPerPixel(defaults, active.asset.pixelWidth);
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
          metresPerPixel,
          // Half transparent by default, so the drawing on top stays readable (B2).
          ...(defaults.opacity < 100 ? { opacity: defaults.opacity / 100 } : {}),
          ...(defaults.grayscale ? { grayscale: true } : {}),
        },
      });
    };
    return {
      identity: { active, defaults },
      origin: { x: 0, y: 0 },
      input: null,
      click: "confirm",
      snapping: { origin: null, sources: (r) => [...r], resolve: querySnap },
      preview: () => {
        throw new Error("Größe in Werkzeugeigenschaften eingeben.");
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
  }, [active, defaults, project, visibility]);
  return {
    begin,
    cancel,
    defaults,
    setDefaults,
    error,
    busy,
    active: !!active,
    fileDpi: active?.fileDpi ?? null,
    pixels: active ? { width: active.asset.pixelWidth, height: active.asset.pixelHeight } : null,
    adapter,
  };
}
