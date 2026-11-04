import {
  railingMembers,
  type Railing,
  type RailingMember,
} from "../../domain/elements/railing/model.ts";

type Vec3 = [number, number, number];
/** A railing face in the storey solid; `railing` keeps it out of every wall-only path. */
export type RailingFace = { wallId: string; vertices: Vec3[]; normal: Vec3; railing: true };

/** The four plan corners of a member, counterclockwise. */
export function railingMemberCorners(member: RailingMember): { x: number; y: number }[] {
  const dx = member.end.x - member.start.x,
    dy = member.end.y - member.start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = (-dy / length) * (member.width / 2),
    ny = (dx / length) * (member.width / 2);
  return [
    { x: member.start.x - nx, y: member.start.y - ny },
    { x: member.end.x - nx, y: member.end.y - ny },
    { x: member.end.x + nx, y: member.end.y + ny },
    { x: member.start.x + nx, y: member.start.y + ny },
  ];
}

/**
 * Closed boxes of every member of one railing (docs/GELAENDER.md), relative to the storey floor
 * at `elevation`. Members may touch or overlap (posts and rails); each is a closed box of its
 * own, the volume is their sum.
 */
export function railingBody(
  railing: Pick<Railing, "id" | "points" | "height" | "baseOffset" | "postSpacing" | "infill">,
  elevation: number,
): { faces: RailingFace[]; volume: number } {
  const faces: RailingFace[] = [];
  let volume = 0;
  for (const member of railingMembers(railing)) {
    const ring = railingMemberCorners(member);
    const bottom = elevation + member.bottom,
      top = elevation + member.top;
    if (top - bottom <= 1e-9) continue;
    const at = (p: { x: number; y: number }, z: number): Vec3 => [p.x, p.y, z];
    faces.push({
      wallId: railing.id,
      vertices: ring.map((p) => at(p, top)),
      normal: [0, 0, 1],
      railing: true,
    });
    faces.push({
      wallId: railing.id,
      vertices: [...ring].reverse().map((p) => at(p, bottom)),
      normal: [0, 0, -1],
      railing: true,
    });
    for (let i = 0; i < 4; i++) {
      const a = ring[i]!,
        b = ring[(i + 1) % 4]!;
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      faces.push({
        wallId: railing.id,
        vertices: [at(a, bottom), at(b, bottom), at(b, top), at(a, top)],
        normal: [(b.y - a.y) / length, -(b.x - a.x) / length, 0],
        railing: true,
      });
    }
    const length = Math.hypot(member.end.x - member.start.x, member.end.y - member.start.y);
    volume += length * member.width * (top - bottom);
  }
  return { faces, volume };
}
