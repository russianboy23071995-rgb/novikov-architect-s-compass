import type { PlanCamera } from "../../rendering/viewport/plan-camera.ts";

/**
 * Zoom and position of each plan view for this session (docs/LAYOUTS.md, KA1): the plan of all
 * storeys, every layout, Plankopf and drawing document keeps its own. A view that comes back
 * takes its camera up again instead of fitting anew. Never part of the project file.
 */
const cameras = new Map<string, PlanCamera>();
const LIMIT = 200;

export function rememberCamera(key: string, camera: PlanCamera) {
  cameras.delete(key);
  cameras.set(key, { center: { ...camera.center }, pixelsPerMetre: camera.pixelsPerMetre });
  // Oldest views go first; a deleted layout's camera thus leaves on its own.
  while (cameras.size > LIMIT) cameras.delete(cameras.keys().next().value!);
}

export function recallCamera(key: string | undefined): PlanCamera | null {
  const camera = key ? cameras.get(key) : undefined;
  return camera ? { center: { ...camera.center }, pixelsPerMetre: camera.pixelsPerMetre } : null;
}
