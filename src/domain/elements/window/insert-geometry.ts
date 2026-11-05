import type { BimWindow, Wall } from "../../project/schema.ts";
import type { Door } from "../door/model.ts";
import { doorOpening } from "../door/model.ts";
import { wallLength } from "../../project/schema.ts";
import { SASH_DEFAULTS, type SashOperation } from "./insert.ts";

// Parts of window and door elements as wall-local boxes (docs/FENSTER_TUEREN.md, FT2–FT4):
// the one source for 3D, section, plan symbol and IFC.

/** Glass pane thickness of a fixed light; the pane sits in the middle of the frame depth. */
export const GLASS_THICKNESS = 0.024;
/** Thickness of the window boards inside and outside. */
export const SILL_THICKNESS = { inside: 0.025, outside: 0.03 } as const;

/**
 * Parts of an element: jambs and rails of the frame, glass, window boards, door leaf; mullion
 * or transom between sashes and the sash frames (FL2).
 */
export type InsertPart = "jamb" | "rail" | "glass" | "sill" | "leaf" | "mullion" | "sash";
/** Wall-local box: x along the wall, y across (left positive), z from the wall base. */
export type InsertBox = {
  part: InsertPart;
  x: [number, number];
  y: [number, number];
  z: [number, number];
  /**
   * Pane of a sash (FL3): how it opens and on which end of x it is hinged, for the opening
   * symbol in views. `outside`: -1 or 1, the y side of the wall that is outside.
   */
  opening?: { operation: SashOperation; hingeAtMaxX: boolean; outside: -1 | 1 };
};

function span(opening: { position: number; width: number }, wall: Wall) {
  const length = wallLength(wall);
  return {
    l: opening.position * length - opening.width / 2,
    r: opening.position * length + opening.width / 2,
  };
}

export function windowInsertBoxes(window: BimWindow, wall: Wall): InsertBox[] {
  const insert = window.insert!;
  const { l, r } = span(window, wall);
  const b = window.sillHeight,
    t = window.sillHeight + window.height;
  const half = wall.thickness / 2;
  // The outside face: right of the wall direction is y < 0.
  const out = insert.exterior === "right" ? -1 : 1;
  const d = insert.frameDepth;
  // Frame across the wall, measured from the outside towards the inside.
  const from =
    insert.location === "centre"
      ? -d / 2
      : insert.location === "outside"
        ? -half + insert.offset
        : half - insert.offset - d;
  const across = (a: number, c: number): [number, number] => (out < 0 ? [a, c] : [-c, -a]);
  const frame = across(from, from + d);
  const w = insert.frameWidth;
  const boxes: InsertBox[] = [
    { part: "jamb", x: [l, l + w], y: frame, z: [b, t] },
    { part: "jamb", x: [r - w, r], y: frame, z: [b, t] },
    { part: "rail", x: [l + w, r - w], y: frame, z: [b, b + w] },
    { part: "rail", x: [l + w, r - w], y: frame, z: [t - w, t] },
  ];
  const mid = from + d / 2;
  const pane = across(mid - GLASS_THICKNESS / 2, mid + GLASS_THICKNESS / 2);
  // Inside the frame: a fixed light, or sashes with mullion or transom (FL2). Sashes sit in the
  // frame depth with their own frame ring; each carries its pane.
  const x0 = l + w,
    x1 = r - w,
    z0 = b + w,
    z1 = t - w;
  const sashes: { x: [number, number]; z: [number, number] }[] = [];
  if (insert.division === "fixed") boxes.push({ part: "glass", x: [x0, x1], y: pane, z: [z0, z1] });
  else {
    const bar = insert.mullionWidth ?? SASH_DEFAULTS.mullionWidth;
    if (insert.division === "double") {
      const centre = (x0 + x1) / 2;
      boxes.push({
        part: "mullion",
        x: [centre - bar / 2, centre + bar / 2],
        y: frame,
        z: [z0, z1],
      });
      sashes.push(
        { x: [x0, centre - bar / 2], z: [z0, z1] },
        { x: [centre + bar / 2, x1], z: [z0, z1] },
      );
    } else if (insert.division === "transom") {
      const top = z1 - (insert.transomHeight ?? SASH_DEFAULTS.transomHeight);
      boxes.push({ part: "mullion", x: [x0, x1], y: frame, z: [top - bar, top] });
      boxes.push({ part: "glass", x: [x0, x1], y: pane, z: [top, z1] });
      sashes.push({ x: [x0, x1], z: [z0, top - bar] });
    } else sashes.push({ x: [x0, x1], z: [z0, z1] });
    const s = insert.sashWidth ?? SASH_DEFAULTS.sashWidth;
    // Sashes are numbered left to right seen from inside. With the outside to the right of the
    // wall direction the inside looks towards -y, so its left is +x: the order runs down in x.
    const leftIsMaxX = out < 0;
    const ordered = leftIsMaxX ? [...sashes].reverse() : sashes;
    ordered.forEach(({ x: [sx0, sx1], z: [sz0, sz1] }, index) => {
      const sash = insert.sashes?.[index];
      boxes.push(
        { part: "sash", x: [sx0, sx0 + s], y: frame, z: [sz0, sz1] },
        { part: "sash", x: [sx1 - s, sx1], y: frame, z: [sz0, sz1] },
        { part: "sash", x: [sx0 + s, sx1 - s], y: frame, z: [sz0, sz0 + s] },
        { part: "sash", x: [sx0 + s, sx1 - s], y: frame, z: [sz1 - s, sz1] },
        {
          part: "glass",
          x: [sx0 + s, sx1 - s],
          y: pane,
          z: [sz0 + s, sz1 - s],
          ...(sash
            ? {
                opening: {
                  operation: sash.operation,
                  hingeAtMaxX: (sash.hinge === "left") === leftIsMaxX,
                  outside: out,
                },
              }
            : {}),
        },
      );
    });
  }
  // Window boards: from the frame to the wall face plus the projection, on the opening floor.
  if (insert.sillOutside)
    boxes.push({
      part: "sill",
      x: [l, r],
      y: across(-half - insert.sillOutside.projection, from),
      z: [b, b + SILL_THICKNESS.outside],
    });
  if (insert.sillInside)
    boxes.push({
      part: "sill",
      x: [l, r],
      y: across(from + d, half + insert.sillInside.projection),
      z: [b, b + SILL_THICKNESS.inside],
    });
  return boxes;
}

export function doorInsertBoxes(door: Door, wall: Wall): InsertBox[] {
  const insert = door.insert!;
  const opening = doorOpening(door, wall);
  const { l, r } = span(opening, wall);
  const b = opening.sillHeight,
    t = opening.sillHeight + opening.height;
  const half = wall.thickness / 2;
  // Frame and leaf flush with the wall face of the side the leaf opens to.
  const side = door.opensTo === "left" ? 1 : -1;
  const depth = insert.frameDepth ?? wall.thickness;
  const across = (inner: number, outer: number): [number, number] => {
    const a = side * (half - outer),
      c = side * (half - inner);
    return a < c ? [a, c] : [c, a];
  };
  const frame = across(0, depth);
  const w = insert.frameWidth;
  return [
    { part: "jamb", x: [l, l + w], y: frame, z: [b, t] },
    { part: "jamb", x: [r - w, r], y: frame, z: [b, t] },
    { part: "rail", x: [l + w, r - w], y: frame, z: [t - w, t] },
    { part: "leaf", x: [l + w, r - w], y: across(0, insert.leafThickness), z: [b, t - w] },
  ];
}
