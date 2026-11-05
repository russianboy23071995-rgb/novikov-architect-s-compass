// T junction models for the Archicad acceptance (user decision 27.10.2026,
// docs/T_IFC_ACCEPTANCE.md): every T the program creates today, built through the normal
// application actions, plus analytic expectations that do not use the wall derivation, and a
// small reader for the regular IFC export.
import { createProject } from "../src/application/projects/create.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { previewTConnection } from "../src/application/walls/t-connections.ts";
import type { Project } from "../src/domain/project/schema.ts";

type Point = { x: number; y: number };
const HOST = { thickness: 0.3, height: 3 };
const INCOMING = { thickness: 0.24, height: 3 };
const WINDOW = { width: 1, height: 1.2, sillHeight: 0.9 };

export type WallExpectation = {
  /** Area of the plan contour from axis length and thickness only (symmetric miters cancel). */
  area: number;
  thickness: number;
  windows: number;
};
export type TVariant = {
  name: string;
  label: string;
  expected: Record<string, WallExpectation>;
  /** Pairs [incoming, host] that must touch along an edge without overlapping. */
  contacts: [string, string][];
  build: (project: Project, prefix: string, ox: number) => Project;
};

const connect = (p: Project, host: string, incoming: string) =>
  previewTConnection(p, p, {
    projectId: p.id,
    kind: "connect",
    relation: { hostWallId: host, incoming: { wallId: incoming, endpoint: 1 } },
  });
const window = (p: Project, id: string, wallId: string, position: number) =>
  addWindow(p, { id, wallId, position, ...WINDOW });

/** Oblique T: host 30 m along x, incoming 8 m long, meeting the host axis at x = 5. */
function angled(degrees: number): TVariant {
  const r = (degrees * Math.PI) / 180;
  const length = 8;
  const name = `t-${String(degrees).padStart(2, "0")}`;
  // Incoming ends on the host face: axis length minus (host thickness / 2) / sin.
  const incomingAxis = length - HOST.thickness / 2 / Math.sin(r);
  return {
    name,
    label: `T ${degrees}°`,
    expected: {
      H: { area: 30 * HOST.thickness, thickness: HOST.thickness, windows: 1 },
      N: { area: incomingAxis * INCOMING.thickness, thickness: INCOMING.thickness, windows: 1 },
    },
    contacts: [["N", "H"]],
    build(p, prefix, ox) {
      p = addWall(p, {
        id: `${prefix}H`,
        start: { x: ox, y: 0 },
        end: { x: ox + 30, y: 0 },
        ...HOST,
      });
      p = addWall(p, {
        id: `${prefix}N`,
        start: { x: ox + 5 + length * Math.cos(r), y: length * Math.sin(r) },
        end: { x: ox + 5, y: 0 },
        ...INCOMING,
      });
      p = connect(p, `${prefix}H`, `${prefix}N`);
      // Windows away from the contact: host at x = 20, incoming 2 m from its free end.
      p = window(p, `${prefix}window-H`, `${prefix}H`, 20 / 30);
      return window(p, `${prefix}window-N`, `${prefix}N`, 2 / length);
    },
  };
}

/** Right angle in the middle of a 10 m host. */
const middle: TVariant = {
  name: "t-mitte",
  label: "T 90° in Wandmitte",
  expected: {
    H: { area: 10 * HOST.thickness, thickness: HOST.thickness, windows: 1 },
    N: {
      area: (4 - HOST.thickness / 2) * INCOMING.thickness,
      thickness: INCOMING.thickness,
      windows: 1,
    },
  },
  contacts: [["N", "H"]],
  build(p, prefix, ox) {
    p = addWall(p, {
      id: `${prefix}H`,
      start: { x: ox, y: 0 },
      end: { x: ox + 10, y: 0 },
      ...HOST,
    });
    p = addWall(p, {
      id: `${prefix}N`,
      start: { x: ox + 5, y: 4 },
      end: { x: ox + 5, y: 0 },
      ...INCOMING,
    });
    p = connect(p, `${prefix}H`, `${prefix}N`);
    p = window(p, `${prefix}window-H`, `${prefix}H`, 0.2);
    return window(p, `${prefix}window-N`, `${prefix}N`, 0.4);
  },
};

/** Two incoming walls from both sides of the host at x = 4 and x = 7. */
const bothSides: TVariant = {
  name: "t-beidseitig",
  label: "T von beiden Seiten",
  expected: {
    H: { area: 10 * HOST.thickness, thickness: HOST.thickness, windows: 0 },
    N: {
      area: (4 - HOST.thickness / 2) * INCOMING.thickness,
      thickness: INCOMING.thickness,
      windows: 1,
    },
    S: {
      area: (4 - HOST.thickness / 2) * INCOMING.thickness,
      thickness: INCOMING.thickness,
      windows: 1,
    },
  },
  contacts: [
    ["N", "H"],
    ["S", "H"],
  ],
  build(p, prefix, ox) {
    p = addWall(p, {
      id: `${prefix}H`,
      start: { x: ox, y: 0 },
      end: { x: ox + 10, y: 0 },
      ...HOST,
    });
    for (const [id, x, y] of [
      ["N", 4, 4],
      ["S", 7, -4],
    ] as const) {
      p = addWall(p, {
        id: `${prefix}${id}`,
        start: { x: ox + x, y },
        end: { x: ox + x, y: 0 },
        ...INCOMING,
      });
      p = connect(p, `${prefix}H`, `${prefix}${id}`);
      p = window(p, `${prefix}window-${id}`, `${prefix}${id}`, 0.4);
    }
    return p;
  },
};

/** A T on a host whose other end forms a 120° corner with E (same thickness, centred). */
const cornerHost: TVariant = {
  name: "t-ecke-120",
  label: "T an Hauptwand mit 120°-Ecke",
  expected: {
    H: { area: 10 * HOST.thickness, thickness: HOST.thickness, windows: 0 },
    E: { area: 4 * HOST.thickness, thickness: HOST.thickness, windows: 0 },
    N: {
      area: (4 - HOST.thickness / 2) * INCOMING.thickness,
      thickness: INCOMING.thickness,
      windows: 1,
    },
  },
  contacts: [
    ["N", "H"],
    ["E", "H"],
  ],
  build(p, prefix, ox) {
    const r = (120 * Math.PI) / 180;
    p = addWall(p, {
      id: `${prefix}H`,
      start: { x: ox, y: 0 },
      end: { x: ox + 10, y: 0 },
      ...HOST,
    });
    p = addWall(p, {
      id: `${prefix}E`,
      start: { x: ox, y: 0 },
      end: { x: ox + 4 * Math.cos(r), y: -4 * Math.sin(r) },
      ...HOST,
    });
    p = addWall(p, {
      id: `${prefix}N`,
      start: { x: ox + 5, y: 4 },
      end: { x: ox + 5, y: 0 },
      ...INCOMING,
    });
    p = connect(p, `${prefix}H`, `${prefix}N`);
    return window(p, `${prefix}window-N`, `${prefix}N`, 0.4);
  },
};

export const T_ACCEPTANCE_HEIGHT = HOST.height;
export const T_ACCEPTANCE_WINDOW = WINDOW;
export const tAcceptanceVariants = (): TVariant[] => [
  ...[90, 60, 45, 30, 15, 5].map(angled),
  middle,
  bothSides,
  cornerHost,
];

/** One project per variant; wall ids without prefix. */
export function tVariantProject(variant: TVariant): Project {
  return variant.build(createProject(`novikov-${variant.name}`, "eg"), "", 0);
}
/** All variants side by side, 40 m apart along x; ids prefixed with the variant name. */
export function tAcceptanceProject(): Project {
  return tAcceptanceVariants().reduce(
    (p, variant, i) => variant.build(p, `${variant.name}-`, i * 40),
    createProject("novikov-t-anschluss-test", "eg"),
  );
}

// --- regular IFC export reader (only the entities NOVIKOV writes) -------------------------
type Entity = { type: string; args: string[] };
function splitArgs(text: string): string[] {
  const out: string[] = [];
  let depth = 0,
    quoted = false,
    current = "";
  for (const c of text) {
    if (c === "'") quoted = !quoted;
    if (!quoted && c === "(") depth++;
    if (!quoted && c === ")") depth--;
    if (!quoted && c === "," && depth === 0) {
      out.push(current);
      current = "";
    } else current += c;
  }
  out.push(current);
  return out.map((s) => s.trim());
}
const list = (arg: string) => splitArgs(arg.slice(1, -1));
const label = (arg: string) => arg.slice(1, -1);

export type IfcWall = {
  name: string;
  /** Profile in plan coordinates (placement applied), counter-clockwise as written. */
  profile: Point[];
  depth: number;
  openings: { name: string; width: number; height: number; thickness: number; x: number }[];
};
export function readIfcWalls(step: string): IfcWall[] {
  const entities = new Map<string, Entity>();
  for (const line of step.split("\n")) {
    const m = /^(#\d+)=([A-Z0-9]+)\((.*)\);$/.exec(line);
    if (m) entities.set(m[1]!, { type: m[2]!, args: splitArgs(m[3]!) });
  }
  const get = (ref: string, type?: string) => {
    const e = entities.get(ref);
    if (!e || (type && e.type !== type)) throw new Error(`Expected ${type} at ${ref}`);
    return e;
  };
  const numbers = (ref: string) => list(get(ref).args[0]!).map(Number);
  // Plan transform of a local placement chain: translation plus rotation about z.
  const transform = (ref: string): { o: Point; d: Point } => {
    if (ref === "$") return { o: { x: 0, y: 0 }, d: { x: 1, y: 0 } };
    const placement = get(ref, "IFCLOCALPLACEMENT");
    const parent = transform(placement.args[0]!);
    const axis = get(placement.args[1]!, "IFCAXIS2PLACEMENT3D");
    const [x, y] = numbers(axis.args[0]!);
    const [dx, dy] = numbers(axis.args[2]!);
    const apply = (p: Point) => ({
      x: parent.o.x + parent.d.x * p.x - parent.d.y * p.y,
      y: parent.o.y + parent.d.y * p.x + parent.d.x * p.y,
    });
    return {
      o: apply({ x: x!, y: y! }),
      d: { x: parent.d.x * dx! - parent.d.y * dy!, y: parent.d.y * dx! + parent.d.x * dy! },
    };
  };
  const solidOf = (shapeRef: string) => {
    const shape = get(shapeRef, "IFCPRODUCTDEFINITIONSHAPE");
    const rep = get(list(shape.args[2]!)[0]!, "IFCSHAPEREPRESENTATION");
    return get(list(rep.args[3]!)[0]!, "IFCEXTRUDEDAREASOLID");
  };
  const voids = [...entities.values()].filter((e) => e.type === "IFCRELVOIDSELEMENT");
  const walls: IfcWall[] = [];
  for (const [ref, e] of entities) {
    if (e.type !== "IFCWALL") continue;
    const t = transform(e.args[5]!);
    const solid = solidOf(e.args[6]!);
    const profile = get(solid.args[0]!);
    if (profile.type !== "IFCARBITRARYCLOSEDPROFILEDEF") throw new Error("Expected wall profile");
    const points = list(get(profile.args[2]!, "IFCPOLYLINE").args[0]!).map((p) => {
      const [x, y] = numbers(p);
      return { x: t.o.x + t.d.x * x! - t.d.y * y!, y: t.o.y + t.d.y * x! + t.d.x * y! };
    });
    points.pop(); // closing point repeats the first
    const openings = voids
      .filter((v) => v.args[4] === ref)
      .map((v) => {
        const opening = get(v.args[5]!, "IFCOPENINGELEMENT");
        const box = get(solidOf(opening.args[6]!).args[0]!, "IFCRECTANGLEPROFILEDEF");
        const local = get(opening.args[5]!, "IFCLOCALPLACEMENT");
        const [x] = numbers(get(local.args[1]!, "IFCAXIS2PLACEMENT3D").args[0]!);
        return {
          name: label(opening.args[2]!),
          width: Number(box.args[3]),
          thickness: Number(box.args[4]),
          height: Number(solidOf(opening.args[6]!).args[3]),
          x: x!,
        };
      });
    walls.push({
      name: label(e.args[2]!),
      profile: points,
      depth: Number(solid.args[3]),
      openings,
    });
  }
  return walls;
}

// --- plan geometry checks -----------------------------------------------------------------
export const polygonArea = (ring: readonly Point[]) =>
  ring.reduce((sum, p, i) => {
    const q = ring[(i + 1) % ring.length]!;
    return sum + p.x * q.y - q.x * p.y;
  }, 0) / 2;
export function isConvex(ring: readonly Point[]) {
  return ring.every((p, i) => {
    const q = ring[(i + 1) % ring.length]!,
      r = ring[(i + 2) % ring.length]!;
    return (q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x) >= -1e-12;
  });
}
/** Area of subject ∩ clip for a convex, counter-clockwise clip polygon (Sutherland–Hodgman). */
export function overlapArea(subject: readonly Point[], clip: readonly Point[]) {
  let output = [...subject];
  for (let i = 0; i < clip.length && output.length; i++) {
    const a = clip[i]!,
      b = clip[(i + 1) % clip.length]!;
    const side = (p: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j]!,
        q = input[(j + 1) % input.length]!;
      const sp = side(p),
        sq = side(q);
      if (sp >= 0) output.push(p);
      if (sp >= 0 !== sq >= 0) {
        const t = sp / (sp - sq);
        output.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) });
      }
    }
  }
  return output.length < 3 ? 0 : Math.abs(polygonArea(output));
}
/** Distance of a point to the boundary of a ring. */
export function boundaryDistance(p: Point, ring: readonly Point[]) {
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!,
      b = ring[(i + 1) % ring.length]!;
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
  }
  return best;
}
