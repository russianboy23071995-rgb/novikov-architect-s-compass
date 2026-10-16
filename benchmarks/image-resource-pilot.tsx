/* eslint-disable react-refresh/only-export-components -- Isolated production benchmark; no Fast Refresh. */
import { useLayoutEffect, useRef, type SVGProps } from "react";
import type { ImageAsset } from "../src/domain/elements/reference/model";
import type { Project } from "../src/domain/project/schema";
import { checkedImageUrl } from "../src/interop/images/import";
import { createImageResourcePool } from "../src/interop/images/resource-pool";

const enabled =
  import.meta.env.MODE === "image-resources" &&
  new URLSearchParams(location.search).get("imageResources") === "bounded";
const pool = createImageResourcePool({
  create: (bytes, type) => URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type })),
  revoke: (url) => URL.revokeObjectURL(url),
});
export const imageResourcePilotStats = () => ({ enabled, ...pool.stats() });
// This module is injected only by the explicit diagnostic build plugin.
export function usePilotImageSources(project: Project) {
  useLayoutEffect(() => {
    if (enabled) pool.setSources(project.assets);
  }, [project.assets]);
  useLayoutEffect(
    () => () => {
      if (enabled) pool.clear();
    },
    [],
  );
}
addEventListener("pagehide", () => pool.clear());

export function PilotReferenceImage({
  asset,
  ...props
}: SVGProps<SVGImageElement> & { asset: ImageAsset }) {
  const image = useRef<SVGImageElement>(null);
  useLayoutEffect(() => {
    if (!enabled || !image.current) return;
    const element = image.current;
    const lease = pool.acquire(asset);
    const url = lease?.url ?? checkedImageUrl(asset);
    if (url) element.setAttribute("href", url);
    else element.removeAttribute("href");
    return () => {
      element.removeAttribute("href");
      lease?.release();
    };
  }, [asset]);
  return <image {...props} ref={image} href={enabled ? undefined : checkedImageUrl(asset)} />;
}
