import type { Point2 } from "../../geometry/primitives/point.ts";

/** Shared tool input: degrees counter-clockwise from +X, metres from a pinned origin. */
export function resolvePolarInput(
  origin: Point2,
  aim: Point2 | null,
  angle: number | null,
  length: number | null,
) {
  if (
    ![
      origin.x,
      origin.y,
      ...(aim ? [aim.x, aim.y] : []),
      ...(angle === null ? [] : [angle]),
      ...(length === null ? [] : [length]),
    ].every(Number.isFinite)
  )
    throw new Error("Ungültiger Winkel oder Abstand.");
  const dx = aim ? aim.x - origin.x : 0,
    dy = aim ? aim.y - origin.y : 0;
  if (angle === null && (!aim || Math.hypot(dx, dy) === 0))
    throw new Error("Richtung mit der Maus wählen oder Winkel eingeben.");
  const degrees =
    angle === null
      ? ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
      : ((angle % 360) + 360) % 360;
  const radians = (degrees * Math.PI) / 180;
  const direction =
    angle === null
      ? { x: dx / Math.hypot(dx, dy), y: dy / Math.hypot(dx, dy) }
      : { x: Math.cos(radians), y: Math.sin(radians) };
  // Exact cardinal directions avoid trigonometric drift at 90-degree axes.
  if (degrees % 90 === 0)
    Object.assign(
      direction,
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
      ][degrees / 90],
    );
  if (length === null && !aim) throw new Error("Länge eingeben oder mit der Maus bestimmen.");
  const metres =
    length ??
    (angle === null ? Math.hypot(dx, dy) : Math.max(0, dx * direction.x + dy * direction.y));
  const point = { x: origin.x + metres * direction.x, y: origin.y + metres * direction.y };
  if (![point.x, point.y].every(Number.isFinite))
    throw new Error("Bewegung liegt außerhalb des gültigen Zahlenbereichs.");
  return { point, degrees, metres };
}
