// Diagnostic context-event wrapper around the production resource implementation.
import { createMatrixResources } from "../src/rendering/viewport/solid-renderer.ts";
import type { DisplaySurfaces } from "../src/rendering/viewport/layer-display.ts";
import type { Vector3 } from "../src/geometry/projections/orthographic.ts";
import type { ProjectionState } from "../src/rendering/viewport/projection-state.ts";
import type { OutlineEdge } from "../src/rendering/viewport/selection-outline.ts";
/** Own GPU resources per canvas, keep only the latest immutable display snapshot. */
export function createMatrixRenderer(
  canvas: HTMLCanvasElement,
  initial: DisplaySurfaces,
  initialOrigin: Vector3,
) {
  let solid = initial,
    origin: Vector3 = [...initialOrigin],
    selected = new Set<string>();
  let disposed = false,
    lost = false,
    builds = 0;
  const build = () => {
    builds++;
    return createMatrixResources(canvas, solid, origin, selected);
  };
  let resource: ReturnType<typeof createMatrixResources> | null = build();
  const lose = (event: Event) => {
    event.preventDefault();
    lost = true;
    resource = null;
  };
  const restore = () => {
    if (!disposed) {
      lost = false;
      resource = build();
    }
  };
  canvas.addEventListener("webglcontextlost", lose);
  canvas.addEventListener("webglcontextrestored", restore);
  return {
    get builds() {
      return builds;
    },
    get available() {
      return !disposed && !lost && !!resource;
    },
    update(
      next: DisplaySurfaces,
      nextOrigin: Vector3,
      nextSelected: ReadonlySet<string> = selected,
    ) {
      if (disposed) throw Error("Disposed renderer");
      const unchanged =
        solid === next &&
        origin.every((v, i) => v === nextOrigin[i]) &&
        selected.size === nextSelected.size &&
        [...selected].every((id) => nextSelected.has(id));
      if (unchanged) return;
      solid = next;
      origin = [...nextOrigin];
      selected = new Set(nextSelected);
      resource?.dispose();
      resource = null;
      if (!lost) resource = build();
    },
    draw(
      projection: ProjectionState,
      outline: OutlineEdge[] = [],
      windowOutline: OutlineEdge[] = [],
    ) {
      resource?.draw(projection, outline, windowOutline);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      resource?.dispose();
      resource = null;
      canvas.removeEventListener("webglcontextlost", lose);
      canvas.removeEventListener("webglcontextrestored", restore);
    },
  };
}
