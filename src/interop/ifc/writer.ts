import { stairGeometry } from "../../domain/elements/stair/model.ts";
import { stairBody } from "../../domain/elements/stair/body.ts";
import { columnLevels } from "../../domain/elements/column/model.ts";
import { IFC_RENOVATION_STATUS, wallRenovation } from "../../domain/elements/wall/renovation.ts";
import { wallBase } from "../../domain/elements/wall/heights.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { validateSimplePolygon } from "../../geometry/polygons/simple-polygon.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { validateProject, wallLength } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { doorDinHand, doorOpening, type Door } from "../../domain/elements/door/model.ts";
import { slabLevels } from "../../domain/elements/slab/model.ts";
import {
  doorInsertBoxes,
  windowInsertBoxes,
  type InsertBox,
} from "../../domain/elements/window/insert-geometry.ts";
import type { DoorInsert, WindowInsert } from "../../domain/elements/window/insert.ts";
import { roofBody } from "../../domain/elements/roof/body.ts";
import { localTrimPlane } from "../../domain/elements/wall/roof-trim.ts";
import { trimExtrusionBelowPlane } from "../../geometry/solids/plane-trim.ts";
import { extrudeProfileWithOpenings } from "../../geometry/solids/profile-openings.ts";
import {
  roomClearHeights,
  roomHeightLineResults,
  storeyCeilingSources,
} from "../../domain/elements/room/heights.ts";
import type { HeightLine } from "../../domain/elements/room/height-line.ts";

/** ASCII property name part of a height line: "2.30 m OuterSkin FinishedFloor". */
function heightLineName(line: Pick<HeightLine, "height" | "lower" | "upper">) {
  return `${line.height.toFixed(2)} m ${line.upper === "outerSkin" ? "OuterSkin" : "Underside"} ${line.lower === "rawFloor" ? "RawFloor" : "FinishedFloor"}`;
}

/** IFC4 IfcDoorTypeOperationEnum for a single swing leaf. Facing the swing side (door +Y),
 * the wall start lies left when the leaf opens to the left of the wall direction.
 * Convention from the IFC4 enumeration text; not yet checked in an external IFC viewer.
 */
export function doorOperationType(door: Pick<Door, "hinge" | "opensTo">) {
  const hingeLeft = (door.hinge === "start") === (door.opensTo === "left");
  return hingeLeft ? "SINGLE_SWING_LEFT" : "SINGLE_SWING_RIGHT";
}

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";

/** Stable namespaced 128-bit identifiers, encoded with the IFC base-64 alphabet. */
export async function ifcGuid(projectId: string, kind: string, id: string): Promise<string> {
  const input = new TextEncoder().encode(JSON.stringify(["NOVIKOV-IFC-v1", projectId, kind, id]));
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", input)).slice(0, 16);
  // UUID version 8 (application-defined), RFC variant; independent of component dimensions.
  bytes[6] = (bytes[6]! & 0x0f) | 0x80;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  let value = bytes.reduce((sum, byte) => (sum << 8n) | BigInt(byte), 0n);
  let result = "";
  for (let i = 0; i < 22; i++) {
    result = alphabet[Number(value & 63n)] + result;
    value >>= 6n;
  }
  return result;
}

/** STEP strings: escape quotes, backslashes, control characters and non-ASCII Unicode. */
export function stepString(value: string): string {
  return (
    "'" +
    Array.from(value, (char) => {
      const code = char.codePointAt(0)!;
      if (code >= 0xd800 && code <= 0xdfff) throw new Error("IFC text must contain valid Unicode.");
      if (char === "'") return "''";
      if (code < 32 || code > 126 || char === "\\")
        return `\\X4\\${code.toString(16).toUpperCase().padStart(8, "0")}\\X0\\`;
      return char;
    }).join("") +
    "'"
  );
}

export function stepReal(value: number): string {
  if (!Number.isFinite(value)) throw new Error("IFC values must be finite.");
  const [mantissa = "0", exponent] = String(value).toUpperCase().split("E");
  return (
    (mantissa.includes(".") ? mantissa : mantissa + ".") +
    (exponent === undefined ? "" : "E" + exponent)
  );
}

/** File description of the regular export. Explicit acceptance exports pass their own. */
export const IFC_EXPORT_DESCRIPTION = "NOVIKOV CAD parametric BIM export";
/** File description of the isolated corner and T acceptance exports (interop/ifc). */
export const IFC_ACCEPTANCE_DESCRIPTION =
  "NOVIKOV CAD corner acceptance test - explicit temporary pair";

/**
 * Archicad trial of window/door sizes (docs/T_IFC_ACCEPTANCE.md, 29.10.2026): Archicad shows
 * „RB 0,00 x 0,00“ for fillings without a body. Variants for the user import; the regular
 * export keeps the defaults (no body, no type) until one variant is confirmed.
 * - fillingBody "thin": neutral placeholder box in opening size, FILLING_PLACEHOLDER_DEPTH
 *   deep, centred in the wall; "full": the same box through the wall thickness.
 * - fillingTypes: IfcWindowType/IfcDoorType per element plus base quantities.
 * No frame, glass or leaf is invented; a body is marked as placeholder in NOVIKOV_BIM.
 */
export type IfcFillingOptions = {
  fillingBody?: "none" | "thin" | "full";
  fillingTypes?: boolean;
};
export const FILLING_PLACEHOLDER_DEPTH = 0.07;

/** Looks of element parts in IFC, matching the 3D view (solid-buffer.ts, G1). */
export const INSERT_LOOKS = {
  frame: { name: "Fensterrahmen", rgb: [0.95, 0.95, 0.95], transparency: 0 },
  glass: { name: "Glas", rgb: [0.6, 0.76, 0.88], transparency: 0.7 },
  door: { name: "Tür", rgb: [0.88, 0.82, 0.72], transparency: 0 },
} as const;

/** NOVIKOV_BIM values of a window or door element (FT4), so a reimport keeps every setting. */
function insertProperties(
  insert: WindowInsert | DoorInsert,
  wallThickness = 0,
): [string, string][] {
  const length = (name: string, value: number): [string, string] => [
    name,
    `IFCLENGTHMEASURE(${stepReal(value)})`,
  ];
  if ("leafThickness" in insert)
    return [
      length("FrameWidth", insert.frameWidth),
      length("FrameDepth", insert.frameDepth ?? wallThickness),
      length("LeafThickness", insert.leafThickness),
    ];
  return [
    length("FrameWidth", insert.frameWidth),
    length("FrameDepth", insert.frameDepth),
    ["FrameLocation", `IFCLABEL(${stepString(insert.location)})`],
    length("FrameOffset", insert.offset),
    ["ExteriorSide", `IFCLABEL(${stepString(insert.exterior)})`],
    ["Division", `IFCLABEL(${stepString(insert.division)})`],
    ...(insert.sillInside ? [length("SillInsideProjection", insert.sillInside.projection)] : []),
    ...(insert.sillOutside ? [length("SillOutsideProjection", insert.sillOutside.projection)] : []),
  ];
}

/** IFC4 STEP export; validates and copies the snapshot before any asynchronous work.
 * Windows and doors remain semantic elements without invented frame/glass/leaf geometry.
 * Openings are separate swept solids linked with IfcRelVoidsElement / IfcRelFillsElement.
 */
export async function writeIfc(
  input: Project,
  timestamp = new Date(),
  wallProfiles: ReadonlyMap<string, readonly Point2[]> = new Map(),
  // Chosen by the caller, not by the presence of wall profiles: the regular export passes the
  // profiles of every connected wall (docs/T_IFC_ACCEPTANCE.md, finding 27.10.2026).
  description = IFC_EXPORT_DESCRIPTION,
  filling: IfcFillingOptions = {},
): Promise<string> {
  const project = validateProject(input);
  const profiles = new Map(
    [...wallProfiles].map(([id, points]) => [id, points.map((p) => ({ ...p }))]),
  );
  for (const [id, points] of profiles) {
    const checked = validateSimplePolygon(points);
    if (
      !project.storeys.some((s) => s.walls.some((w) => w.id === id)) ||
      !checked.valid ||
      checked.signedArea <= 0
    )
      throw new Error("Invalid IFC wall profile");
  }
  const exportedAt = timestamp.toISOString();
  const lines: string[] = [];
  const add = (type: string, args: string) => {
    const ref = `#${lines.length + 1}`;
    lines.push(`${ref}=${type}(${args});`);
    return ref;
  };
  const text = stepString;
  const real = stepReal;
  const label = (value: string) => text(Array.from(value).slice(0, 255).join(""));
  const guid = async (kind: string, key: string) => text(await ifcGuid(project.id, kind, key));
  const point = (values: number[]) => add("IFCCARTESIANPOINT", `(${values.map(real).join(",")})`);
  const direction = (values: number[]) => add("IFCDIRECTION", `(${values.map(real).join(",")})`);
  const up = direction([0, 0, 1]);
  const axis = (x = 0, y = 0, z = 0, dx = 1, dy = 0) =>
    add("IFCAXIS2PLACEMENT3D", `${point([x, y, z])},${up},${direction([dx, dy, 0])}`);
  const origin = axis();
  const placement = (parent: string, x = 0, y = 0, z = 0, dx = 1, dy = 0) =>
    add("IFCLOCALPLACEMENT", `${parent},${axis(x, y, z, dx, dy)}`);
  const context = add("IFCGEOMETRICREPRESENTATIONCONTEXT", `$,'Model',3,1.E-7,${origin},$`);
  const units = add("IFCUNITASSIGNMENT", `(${add("IFCSIUNIT", "*,.LENGTHUNIT.,$,.METRE.")})`);
  const projectRef = add(
    "IFCPROJECT",
    `${await guid("project", project.id)},$,${label(project.id)},$,$,$,$,(${context}),${units}`,
  );
  const sitePlacement = placement("$");
  const site = add(
    "IFCSITE",
    `${await guid("site", "site")},$,'Site',$,$,${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$`,
  );
  const buildingPlacement = placement(sitePlacement);
  const building = add(
    "IFCBUILDING",
    `${await guid("building", "building")},$,'Building',$,$,${buildingPlacement},$,$,.ELEMENT.,$,$,$`,
  );
  for (const [key, parent, child] of [
    ["project-site", projectRef, site],
    ["site-building", site, building],
  ])
    add("IFCRELAGGREGATES", `${await guid("aggregate", key!)},$,$,$,${parent},(${child})`);

  const body = (length: number, thickness: number, height: number, points?: readonly Point2[]) => {
    if (points) {
      const refs = points.map((p) => point([p.x, p.y]));
      const curve = add("IFCPOLYLINE", `(${[...refs, refs[0]].join(",")})`);
      const profile = add("IFCARBITRARYCLOSEDPROFILEDEF", `.AREA.,$,${curve}`);
      const solid = add("IFCEXTRUDEDAREASOLID", `${profile},${origin},${up},${real(height)}`);
      const shape = add("IFCSHAPEREPRESENTATION", `${context},'Body','SweptSolid',(${solid})`);
      return add("IFCPRODUCTDEFINITIONSHAPE", `$,$,(${shape})`);
    }
    const profilePlacement = add("IFCAXIS2PLACEMENT2D", `${point([length / 2, 0])},$`);
    const profile = add(
      "IFCRECTANGLEPROFILEDEF",
      `.AREA.,$,${profilePlacement},${real(length)},${real(thickness)}`,
    );
    const solid = add("IFCEXTRUDEDAREASOLID", `${profile},${origin},${up},${real(height)}`);
    const shape = add("IFCSHAPEREPRESENTATION", `${context},'Body','SweptSolid',(${solid})`);
    return add("IFCPRODUCTDEFINITIONSHAPE", `$,$,(${shape})`);
  };
  /** Closed faceted body of a trimmed wall in its own frame (same cut as in 3D). */
  const trimmedWallBrep = (
    profile: readonly Point2[],
    plane: { a: number; b: number; c: number },
  ) => {
    const top = Math.max(...profile.map((p) => plane.a + plane.b * p.x + plane.c * p.y));
    const solid = trimExtrusionBelowPlane(
      extrudeProfileWithOpenings(profile, top, []),
      profile,
      plane,
    );
    const refs = new Map<string, string>();
    const vertex = (v: readonly number[]) => {
      const k = v.join(",");
      let ref = refs.get(k);
      if (!ref) refs.set(k, (ref = point([...v])));
      return ref;
    };
    const faces = solid.faces.map((face) => {
      const loop = add("IFCPOLYLOOP", `(${face.vertices.map(vertex).join(",")})`);
      return add("IFCFACE", `(${add("IFCFACEOUTERBOUND", `${loop},.T.`)})`);
    });
    const brep = add("IFCFACETEDBREP", add("IFCCLOSEDSHELL", `(${faces.join(",")})`));
    const shape = add("IFCSHAPEREPRESENTATION", `${context},'Body','Brep',(${brep})`);
    return add("IFCPRODUCTDEFINITIONSHAPE", `$,$,(${shape})`);
  };
  const properties = async (
    target: string,
    kind: string,
    id: string,
    values: [string, string][],
    set = "NOVIKOV_BIM",
  ) => {
    // The own set keeps its historical GUID seed; further sets add their name to it.
    const key = JSON.stringify(set === "NOVIKOV_BIM" ? [kind, id] : [kind, id, set]);
    const props = [
      ...(set === "NOVIKOV_BIM" ? [["SourceId", `IFCTEXT(${text(id)})`]] : []),
      ...values,
    ].map(([name, value]) => add("IFCPROPERTYSINGLEVALUE", `${text(name!)},$,${value},$`));
    const pset = add(
      "IFCPROPERTYSET",
      `${await guid("properties", key)},$,${text(set)},$,(${props.join(",")})`,
    );
    add(
      "IFCRELDEFINESBYPROPERTIES",
      `${await guid("property-relation", key)},$,$,$,(${target}),${pset}`,
    );
  };
  const fillingBody = filling.fillingBody ?? "none";
  const fillingShape = (width: number, wallThickness: number, height: number) =>
    fillingBody === "none"
      ? "$"
      : body(
          width,
          fillingBody === "full"
            ? wallThickness
            : Math.min(FILLING_PLACEHOLDER_DEPTH, wallThickness),
          height,
        );
  /**
   * Body of a window or door element (docs/FENSTER_TUEREN.md, FT4): one swept box per part
   * (frame, glass, boards, leaf) in the frame of the filling's placement; `local` maps the
   * wall-local box corners into that frame.
   */
  /**
   * Surface styles of the element parts (G1): Archicad shows unstyled bodies as opaque grey.
   * Same colours as the 3D view; glass 70 % transparent. One style per look, shared.
   */
  const styles = new Map<string, string>();
  const surfaceStyle = (look: keyof typeof INSERT_LOOKS) => {
    let style = styles.get(look);
    if (!style) {
      const { name, rgb, transparency } = INSERT_LOOKS[look];
      const colour = add("IFCCOLOURRGB", `$,${rgb.map(real).join(",")}`);
      const rendering = add(
        "IFCSURFACESTYLERENDERING",
        `${colour},${real(transparency)},$,$,$,$,$,$,.NOTDEFINED.`,
      );
      style = add("IFCSURFACESTYLE", `${text(name)},.BOTH.,(${rendering})`);
      styles.set(look, style);
    }
    return style;
  };
  const insertShape = (
    kind: "window" | "door",
    boxes: readonly InsertBox[],
    local: (x: number, y: number, z: number) => [number, number, number],
  ) => {
    const solids = boxes.map((box) => {
      // Rounded to a nanometre: the parts are sums of settings, not measured coordinates.
      const nm = (v: number) => Math.round(v * 1e9) / 1e9;
      const [ax, ay, az] = local(box.x[0], box.y[0], box.z[0]),
        [bx, by, bz] = local(box.x[1], box.y[1], box.z[1]);
      const [x0, x1] = [nm(Math.min(ax, bx)), nm(Math.max(ax, bx))];
      const [y0, y1] = [nm(Math.min(ay, by)), nm(Math.max(ay, by))];
      const [z0, z1] = [nm(Math.min(az, bz)), nm(Math.max(az, bz))];
      const centre = add(
        "IFCAXIS2PLACEMENT2D",
        `${point([nm((x0 + x1) / 2), nm((y0 + y1) / 2)])},$`,
      );
      const profile = add(
        "IFCRECTANGLEPROFILEDEF",
        `.AREA.,${text(box.part)},${centre},${real(nm(x1 - x0))},${real(nm(y1 - y0))}`,
      );
      const solid = add(
        "IFCEXTRUDEDAREASOLID",
        `${profile},${axis(0, 0, z0)},${up},${real(nm(z1 - z0))}`,
      );
      const look = box.part === "glass" ? "glass" : kind === "door" ? "door" : "frame";
      add("IFCSTYLEDITEM", `${solid},(${surfaceStyle(look)}),$`);
      return solid;
    });
    const shape = add(
      "IFCSHAPEREPRESENTATION",
      `${context},'Body','SweptSolid',(${solids.join(",")})`,
    );
    return add("IFCPRODUCTDEFINITIONSHAPE", `$,$,(${shape})`);
  };
  /** Lining of an element on its type (IFC4 IfcWindowLiningProperties / IfcDoorLiningProperties). */
  const lining = async (kind: "window" | "door", id: string, depth: number, thickness: number) =>
    kind === "window"
      ? add(
          "IFCWINDOWLININGPROPERTIES",
          `${await guid("window-lining", id)},$,$,$,${real(depth)},${real(thickness)},$,$,$,$,$,$,$,$,$,$`,
        )
      : add(
          "IFCDOORLININGPROPERTIES",
          `${await guid("door-lining", id)},$,$,$,${real(depth)},${real(thickness)},$,$,$,$,$,$,$,$,$,$,$`,
        );
  const placeholder: [string, string][] =
    fillingBody === "none" ? [] : [["PlaceholderBody", "IFCBOOLEAN(.T.)"]];
  const types: string[] = [];
  const fillingType = async (
    kind: "window" | "door",
    target: string,
    id: string,
    width: number,
    height: number,
    operation: string,
    /** Lining of an inserted element: the type is written for it even without fillingTypes. */
    liningRef?: string,
  ) => {
    if (!filling.fillingTypes && !liningRef) return;
    const sets = liningRef ? `(${liningRef})` : "$";
    const name = label(id + " Typ");
    const type =
      kind === "window"
        ? add(
            "IFCWINDOWTYPE",
            `${await guid("window-type", id)},$,${name},$,$,${sets},$,$,$,.WINDOW.,.SINGLE_PANEL.,.F.,$`,
          )
        : add(
            "IFCDOORTYPE",
            `${await guid("door-type", id)},$,${name},$,$,${sets},$,$,$,.DOOR.,.${operation}.,.F.,$`,
          );
    types.push(type);
    add(
      "IFCRELDEFINESBYTYPE",
      `${await guid(kind + "-type-relation", id)},$,$,$,(${target}),${type}`,
    );
    const quantities = [
      add("IFCQUANTITYLENGTH", `'Width',$,$,${real(width)},$`),
      add("IFCQUANTITYLENGTH", `'Height',$,$,${real(height)},$`),
      add("IFCQUANTITYAREA", `'Area',$,$,${real(width * height)},$`),
    ];
    const qtoName = kind === "window" ? "Qto_WindowBaseQuantities" : "Qto_DoorBaseQuantities";
    const qto = add(
      "IFCELEMENTQUANTITY",
      `${await guid(kind + "-quantities", id)},$,${text(qtoName)},$,$,(${quantities.join(",")})`,
    );
    add(
      "IFCRELDEFINESBYPROPERTIES",
      `${await guid(kind + "-quantity-relation", id)},$,$,$,(${target}),${qto}`,
    );
  };
  await properties(projectRef, "project", project.id, [["SchemaVersion", "IFCINTEGER(1)"]]);
  const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId);
  for (const floor of project.storeys) {
    const level = levels.find((l) => l.storeyId === floor.id)!;
    const elevation = level.elevation;
    if (elevation === null)
      throw new Error("Vor dem IFC-Export müssen die Geschosshöhen festgelegt werden.");
    const storeyPlacement = placement(buildingPlacement, 0, 0, elevation);
    const storey = add(
      "IFCBUILDINGSTOREY",
      `${await guid("storey", floor.id)},$,${label(floor.name)},$,$,${storeyPlacement},$,$,.ELEMENT.,${real(elevation)}`,
    );
    add(
      "IFCRELAGGREGATES",
      `${await guid("aggregate", floor.id === project.groundStoreyId ? "building-storey" : "building-storey:" + floor.id)},$,$,$,${building},(${storey})`,
    );
    await properties(storey, "storey", floor.id, []);
    const elements: string[] = [];
    for (const wall of floor.walls) {
      const length = wallLength(wall);
      const bodyPosition = wallBody(wall);
      const wallPlacement = placement(
        storeyPlacement,
        bodyPosition.start.x,
        bodyPosition.start.y,
        wallBase(wall),
        (wall.end.x - wall.start.x) / length,
        (wall.end.y - wall.start.y) / length,
      );
      // A wall trimmed at a roof (docs/TRIMMEN_L04B.md) goes out with its real inclined top as
      // a faceted B-rep in the wall frame; openings stay IfcOpeningElement voids as usual.
      const wallShape = wall.trimPlane
        ? trimmedWallBrep(
            profiles.get(wall.id) ?? [
              { x: 0, y: -wall.thickness / 2 },
              { x: length, y: -wall.thickness / 2 },
              { x: length, y: wall.thickness / 2 },
              { x: 0, y: wall.thickness / 2 },
            ],
            localTrimPlane(
              wall.trimPlane,
              bodyPosition.start,
              (wall.end.x - wall.start.x) / length,
              (wall.end.y - wall.start.y) / length,
            ),
          )
        : body(length, wall.thickness, wall.height, profiles.get(wall.id));
      const wallRef = add(
        "IFCWALL",
        `${await guid("wall", wall.id)},$,${label(wall.id)},$,$,${wallPlacement},${wallShape},${label(wall.id)},.NOTDEFINED.`,
      );
      elements.push(wallRef);
      // IFC renovation status (docs/BAUZUSTAND.md): NEW / EXISTING / DEMOLISH.
      await properties(
        wallRef,
        "wall",
        wall.id,
        [["Status", `IFCLABEL(${text(IFC_RENOVATION_STATUS[wallRenovation(wall)])})`]],
        "Pset_WallCommon",
      );
      await properties(wallRef, "wall", wall.id, [
        ["Length", `IFCLENGTHMEASURE(${real(length)})`],
        ["Thickness", `IFCLENGTHMEASURE(${real(wall.thickness)})`],
        ["Height", `IFCLENGTHMEASURE(${real(wall.height)})`],
        ["BodyOffset", `IFCLENGTHMEASURE(${real(wall.bodyOffset)})`],
        ["Renovation", `IFCLABEL(${text(wallRenovation(wall))})`],
        ...(wall.roofTrim && wall.trimPlane
          ? ([
              ["TrimmedAtRoof", `IFCTEXT(${text(wall.roofTrim.roofId)})`],
              ["TrimmedTopMin", `IFCLENGTHMEASURE(${real(wall.trimPlane.bottom)})`],
              ["TrimmedTopMax", `IFCLENGTHMEASURE(${real(wall.trimPlane.top)})`],
            ] as [string, string][])
          : []),
      ]);
      for (const window of floor.windows.filter((item) => item.wallId === wall.id)) {
        const openingPlacement = placement(
          wallPlacement,
          window.position * length - window.width / 2,
          0,
          window.sillHeight,
        );
        const opening = add(
          "IFCOPENINGELEMENT",
          `${await guid("opening", window.id)},$,${label("Opening " + window.id)},$,$,${openingPlacement},${body(window.width, wall.thickness, window.height)},$,.OPENING.`,
        );
        add("IFCRELVOIDSELEMENT", `${await guid("void", window.id)},$,$,$,${wallRef},${opening}`);
        // A window element gets its real body; a plain opening keeps the chosen variant.
        const left = window.position * length - window.width / 2;
        const windowShape = window.insert
          ? insertShape("window", windowInsertBoxes(window, wall), (x, y, z) => [
              x - left,
              y,
              z - window.sillHeight,
            ])
          : fillingShape(window.width, wall.thickness, window.height);
        const windowRef = add(
          "IFCWINDOW",
          `${await guid("window", window.id)},$,${label(window.id)},$,$,${placement(openingPlacement)},${windowShape},${label(window.id)},${real(window.height)},${real(window.width)},.WINDOW.,.NOTDEFINED.,$`,
        );
        add("IFCRELFILLSELEMENT", `${await guid("fill", window.id)},$,$,$,${opening},${windowRef}`);
        elements.push(windowRef);
        await properties(windowRef, "window", window.id, [
          ["WallId", `IFCTEXT(${text(window.wallId)})`],
          ["SillHeight", `IFCLENGTHMEASURE(${real(window.sillHeight)})`],
          ["RelativePosition", `IFCRATIOMEASURE(${real(window.position)})`],
          ...(window.insert ? insertProperties(window.insert) : placeholder),
        ]);
        await fillingType(
          "window",
          windowRef,
          window.id,
          window.width,
          window.height,
          "",
          window.insert &&
            (await lining("window", window.id, window.insert.frameDepth, window.insert.frameWidth)),
        );
      }
      for (const door of (floor.doors ?? []).filter((item) => item.wallId === wall.id)) {
        const opening = doorOpening(door, wall);
        const openingPlacement = placement(
          wallPlacement,
          door.position * length - door.width / 2,
          0,
          opening.sillHeight,
        );
        const openingRef = add(
          "IFCOPENINGELEMENT",
          `${await guid("opening", door.id)},$,${label("Opening " + door.id)},$,$,${openingPlacement},${body(door.width, wall.thickness, door.height)},$,.OPENING.`,
        );
        add("IFCRELVOIDSELEMENT", `${await guid("void", door.id)},$,$,$,${wallRef},${openingRef}`);
        // IFC4: the leaf opens toward +Y of the door placement; hinge side is seen along +Y.
        // Opening to the right of the wall direction turns that placement by 180 degrees.
        const turned = door.opensTo === "right";
        const doorPlacement = placement(
          openingPlacement,
          turned ? door.width : 0,
          0,
          0,
          turned ? -1 : 1,
          0,
        );
        // In the door frame x runs from the placement origin; a turned door mirrors x and y.
        const doorLeft = door.position * length - door.width / 2;
        const doorShape = door.insert
          ? insertShape("door", doorInsertBoxes(door, wall), (x, y, z) => [
              turned ? door.width - (x - doorLeft) : x - doorLeft,
              turned ? -y : y,
              z - opening.sillHeight,
            ])
          : fillingShape(door.width, wall.thickness, door.height);
        const doorRef = add(
          "IFCDOOR",
          `${await guid("door", door.id)},$,${label(door.id)},$,$,${doorPlacement},${doorShape},${label(door.id)},${real(door.height)},${real(door.width)},.DOOR.,.${doorOperationType(door)}.,$`,
        );
        add("IFCRELFILLSELEMENT", `${await guid("fill", door.id)},$,$,$,${openingRef},${doorRef}`);
        elements.push(doorRef);
        await properties(doorRef, "door", door.id, [
          ["WallId", `IFCTEXT(${text(door.wallId)})`],
          ["ZOffset", `IFCLENGTHMEASURE(${real(door.zOffset)})`],
          ["RelativePosition", `IFCRATIOMEASURE(${real(door.position)})`],
          ["Hinge", `IFCLABEL(${text(door.hinge)})`],
          ["OpensTo", `IFCLABEL(${text(door.opensTo)})`],
          // DIN 107 is seen from the swing side; IFC's operation type from the opposite side.
          ["Handing", `IFCLABEL(${text(`DIN ${doorDinHand(door)}`)})`],
          ...(door.insert ? insertProperties(door.insert, wall.thickness) : placeholder),
        ]);
        await fillingType(
          "door",
          doorRef,
          door.id,
          door.width,
          door.height,
          doorOperationType(door),
          door.insert &&
            (await lining(
              "door",
              door.id,
              door.insert.frameDepth ?? wall.thickness,
              door.insert.frameWidth,
            )),
        );
      }
    }
    // Ceiling slabs (docs/SLAB_ELEMENT.md, Teil B2): IfcSlab FLOOR in the storey that owns
    // them, outline extruded upward from the underside. Without a known storey height there is
    // no level and no slab, as in 3D.
    for (const slab of floor.slabs ?? []) {
      const slabLevel = slabLevels(slab, level.upperElevation);
      if (!slabLevel) continue;
      const ring = validateSimplePolygon(slab.points);
      const points = ring.valid && ring.signedArea < 0 ? [...slab.points].reverse() : slab.points;
      const slabRef = add(
        "IFCSLAB",
        `${await guid("slab", slab.id)},$,${label(slab.id)},$,$,${placement(storeyPlacement, 0, 0, slabLevel.bottom - elevation)},${body(0, 0, slab.thickness, points)},${label(slab.id)},.FLOOR.`,
      );
      elements.push(slabRef);
      await properties(slabRef, "slab", slab.id, [
        ["Thickness", `IFCLENGTHMEASURE(${real(slab.thickness)})`],
        ["TopOffset", `IFCLENGTHMEASURE(${real(slab.topOffset)})`],
      ]);
    }
    // Columns (docs/STUETZEN.md): IfcColumn with a parametric swept profile (rectangle or
    // circle) from the foot to the top, so receiving tools can treat it as a real column.
    for (const column of floor.columns ?? []) {
      const levels = columnLevels(column, floor.height);
      if (!levels) continue;
      const angle = (column.rotation * Math.PI) / 180;
      const columnPlacement = placement(
        storeyPlacement,
        column.position.x,
        column.position.y,
        levels.bottom,
        Math.cos(angle),
        Math.sin(angle),
      );
      const centre = add("IFCAXIS2PLACEMENT2D", `${point([0, 0])},$`);
      const profile =
        column.shape.kind === "circle"
          ? add("IFCCIRCLEPROFILEDEF", `.AREA.,$,${centre},${real(column.shape.diameter / 2)}`)
          : add(
              "IFCRECTANGLEPROFILEDEF",
              `.AREA.,$,${centre},${real(column.shape.width)},${real(column.shape.depth)}`,
            );
      const solid = add(
        "IFCEXTRUDEDAREASOLID",
        `${profile},${origin},${up},${real(levels.top - levels.bottom)}`,
      );
      const shape = add("IFCSHAPEREPRESENTATION", `${context},'Body','SweptSolid',(${solid})`);
      const columnRef = add(
        "IFCCOLUMN",
        `${await guid("column", column.id)},$,${label(column.id)},$,$,${columnPlacement},${add("IFCPRODUCTDEFINITIONSHAPE", `$,$,(${shape})`)},${label(column.id)},.COLUMN.`,
      );
      elements.push(columnRef);
      await properties(
        columnRef,
        "column",
        column.id,
        [["Status", `IFCLABEL(${text(IFC_RENOVATION_STATUS[wallRenovation(column)])})`]],
        "Pset_ColumnCommon",
      );
      await properties(columnRef, "column", column.id, [
        ["Shape", `IFCLABEL(${text(column.shape.kind)})`],
        ["Rotation", `IFCREAL(${real(column.rotation)})`],
        ["BaseOffset", `IFCLENGTHMEASURE(${real(column.baseOffset)})`],
        ["Height", `IFCLENGTHMEASURE(${real(levels.top - levels.bottom)})`],
        ["Renovation", `IFCLABEL(${text(wallRenovation(column))})`],
      ]);
    }
    // Stairs (docs/TREPPE.md, TR1/TR3): IfcStair (straight, quarter or half turn) aggregating
    // one IfcStairFlight per flight and, for L and U, the landing as IfcSlab LANDING; every part
    // is the same closed solid as in 3D (faceted B-rep, storey coordinates).
    for (const stair of floor.stairs ?? []) {
      const geometry = stairGeometry(stair, floor.height);
      const body = stairBody(stair, 0, floor.height);
      if (!geometry || !body) continue;
      const points = new Map<string, string>();
      const vertex = (v: readonly number[]) => {
        const k = v.join(",");
        let ref = points.get(k);
        if (!ref) points.set(k, (ref = point([...v])));
        return ref;
      };
      const shapeOf = (part: (typeof body.parts)[number]) => {
        const faces = part.faces.map((face) => {
          const loop = add("IFCPOLYLOOP", `(${face.vertices.map(vertex).join(",")})`);
          return add("IFCFACE", `(${add("IFCFACEOUTERBOUND", `${loop},.T.`)})`);
        });
        const brep = add("IFCFACETEDBREP", add("IFCCLOSEDSHELL", `(${faces.join(",")})`));
        const shape = add("IFCSHAPEREPRESENTATION", `${context},'Body','Brep',(${brep})`);
        return add("IFCPRODUCTDEFINITIONSHAPE", `$,$,(${shape})`);
      };
      const stairPlacement = placement(storeyPlacement);
      const stairType =
        stair.shape === "l" && geometry.landing !== null
          ? "QUARTER_TURN_STAIR"
          : stair.shape === "u" && geometry.landing !== null
            ? "HALF_TURN_STAIR"
            : "STRAIGHT_RUN_STAIR";
      const stairRef = add(
        "IFCSTAIR",
        `${await guid("stair", stair.id)},$,${label(stair.id)},$,$,${stairPlacement},$,${label(stair.id)},.${stairType}.`,
      );
      const parts: string[] = [];
      let flightIndex = 0;
      for (const part of body.parts) {
        if (part.kind === "landing") {
          parts.push(
            add(
              "IFCSLAB",
              `${await guid("stair-landing", stair.id)},$,${label(stair.id + " Podest")},$,$,${placement(stairPlacement)},${shapeOf(part)},${label(stair.id)},.LANDING.`,
            ),
          );
          continue;
        }
        const risers = geometry.flights[flightIndex]!;
        // The first flight keeps the GUID of TR1 files; further flights get their own.
        const key = flightIndex === 0 ? stair.id : `${stair.id}:${flightIndex + 1}`;
        parts.push(
          add(
            "IFCSTAIRFLIGHT",
            `${await guid("stair-flight", key)},$,${label(`${stair.id} Lauf${geometry.flights.length > 1 ? ` ${flightIndex + 1}` : ""}`)},$,$,${placement(stairPlacement)},${shapeOf(part)},${label(stair.id)},${risers},${risers - 1},${real(geometry.riser)},${real(geometry.tread)},.STRAIGHT.`,
          ),
        );
        flightIndex++;
      }
      add(
        "IFCRELAGGREGATES",
        `${await guid("aggregate", "stair:" + stair.id)},$,$,$,${stairRef},(${parts.join(",")})`,
      );
      elements.push(stairRef);
      const counts: [string, string][] = [
        ["NumberOfRiser", `IFCCOUNTMEASURE(${geometry.riserCount})`],
        ["NumberOfTreads", `IFCCOUNTMEASURE(${geometry.treadCount})`],
        ["RiserHeight", `IFCPOSITIVELENGTHMEASURE(${real(geometry.riser)})`],
        ["TreadLength", `IFCPOSITIVELENGTHMEASURE(${real(geometry.tread)})`],
      ];
      await properties(
        stairRef,
        "stair",
        stair.id,
        [...counts, ["Status", `IFCLABEL(${text(IFC_RENOVATION_STATUS[wallRenovation(stair)])})`]],
        "Pset_StairCommon",
      );
      await properties(stairRef, "stair", stair.id, [
        ["Width", `IFCLENGTHMEASURE(${real(stair.width)})`],
        ["Rise", `IFCLENGTHMEASURE(${real(geometry.rise)})`],
        ["Run", `IFCLENGTHMEASURE(${real(geometry.run)})`],
        ["Shape", `IFCLABEL(${text(stair.shape)})`],
        ...(geometry.landing !== null
          ? ([
              ["Turn", `IFCLABEL(${text(stair.turn ?? "left")})`],
              ["LandingDepth", `IFCLENGTHMEASURE(${real(geometry.landing)})`],
              ["FlightRisers", `IFCLABEL(${text(geometry.flights.join(" + "))})`],
            ] as [string, string][])
          : []),
        ["StepRule", `IFCLENGTHMEASURE(${real(geometry.stepRule)})`],
        ["RuleSet", `IFCLABEL(${text(stair.ruleSet)})`],
        ["Check", `IFCTEXT(${text(geometry.issues.join("; ") || "DIN 18065 eingehalten")})`],
      ]);
    }
    // Single inclined roofs (docs/ROOF_ELEMENT.md, D5): IfcRoof SHED_ROOF in the storey,
    // aggregating one IfcSlab ROOF whose body is the closed roof surface as a faceted B-rep
    // (the same faces as in 3D, coordinates relative to the storey placement).
    for (const roof of floor.roofs ?? []) {
      const body = roofBody(roof, 0);
      const points = new Map<string, string>();
      const vertex = (v: readonly number[]) => {
        const k = v.join(",");
        let ref = points.get(k);
        if (!ref) points.set(k, (ref = point([...v])));
        return ref;
      };
      const faces = body.faces.map((face) => {
        const loop = add("IFCPOLYLOOP", `(${face.vertices.map(vertex).join(",")})`);
        return add("IFCFACE", `(${add("IFCFACEOUTERBOUND", `${loop},.T.`)})`);
      });
      const brep = add("IFCFACETEDBREP", add("IFCCLOSEDSHELL", `(${faces.join(",")})`));
      const shape = add("IFCSHAPEREPRESENTATION", `${context},'Body','Brep',(${brep})`);
      const roofPlacement = placement(storeyPlacement);
      const roofRef = add(
        "IFCROOF",
        `${await guid("roof", roof.id)},$,${label(roof.id)},$,$,${roofPlacement},$,${label(roof.id)},.SHED_ROOF.`,
      );
      const surface = add(
        "IFCSLAB",
        `${await guid("roof-slab", roof.id)},$,${label(roof.id + " Dachfläche")},$,$,${placement(roofPlacement)},${add("IFCPRODUCTDEFINITIONSHAPE", `$,$,(${shape})`)},${label(roof.id)},.ROOF.`,
      );
      add(
        "IFCRELAGGREGATES",
        `${await guid("roof-aggregate", roof.id)},$,$,$,${roofRef},(${surface})`,
      );
      elements.push(roofRef);
      await properties(roofRef, "roof", roof.id, [
        ["PitchDegrees", `IFCREAL(${real(roof.pitch)})`],
        ["Thickness", `IFCLENGTHMEASURE(${real(roof.thickness)})`],
        ["ReferenceHeight", `IFCLENGTHMEASURE(${real(roof.referenceHeight)})`],
        ["Rise", `IFCLABEL(${text(roof.rise)})`],
        ["EaveCut", `IFCLABEL(${text(roof.eaveCut)})`],
        ["TopCut", `IFCLABEL(${text(roof.topCut)})`],
      ]);
    }
    // Rooms as IfcSpace (docs/ROOM_ELEMENT.md, R4, decision M): outline extruded from the raw
    // floor to the storey height, Name = number, LongName = name, aggregated by the storey
    // (spaces are decomposition, not containment). Clear heights and height line areas from the
    // storey's own slabs and roofs go along as quantities and NOVIKOV properties.
    const spaces: string[] = [];
    const ceilings = floor.rooms?.length ? storeyCeilingSources(floor) : [];
    for (const room of floor.rooms ?? []) {
      const ring = validateSimplePolygon(room.points);
      const points = ring.valid && ring.signedArea < 0 ? [...room.points].reverse() : room.points;
      const height = floor.height;
      const shape = typeof height === "number" ? body(0, 0, height, points) : "$";
      const spaceRef = add(
        "IFCSPACE",
        `${await guid("space", room.id)},$,${label(room.number)},$,$,${placement(storeyPlacement)},${shape},${room.name ? label(room.name) : "$"},.ELEMENT.,.INTERNAL.,${room.floorBuildUp === undefined ? "$" : real(room.floorBuildUp)}`,
      );
      spaces.push(spaceRef);
      const area = Math.abs(ring.valid ? ring.signedArea : 0);
      const clear = roomClearHeights(room, ceilings);
      const quantities = [
        add("IFCQUANTITYAREA", `'NetFloorArea',$,$,${real(area)},$`),
        add("IFCQUANTITYAREA", `'GrossFloorArea',$,$,${real(area)},$`),
        ...(typeof height === "number"
          ? [add("IFCQUANTITYLENGTH", `'Height',$,$,${real(height)},$`)]
          : []),
        ...(clear.max === null
          ? []
          : [add("IFCQUANTITYLENGTH", `'FinishCeilingHeight',$,$,${real(clear.max)},$`)]),
      ];
      const qto = add(
        "IFCELEMENTQUANTITY",
        `${await guid("space-quantities", room.id)},$,'Qto_SpaceBaseQuantities',$,$,(${quantities.join(",")})`,
      );
      add(
        "IFCRELDEFINESBYPROPERTIES",
        `${await guid("space-quantity-relation", room.id)},$,$,$,(${spaceRef}),${qto}`,
      );
      await properties(spaceRef, "room", room.id, [
        ["Number", `IFCLABEL(${label(room.number)})`],
        ["RoomName", `IFCLABEL(${label(room.name)})`],
        ...(room.floorBuildUp === undefined
          ? []
          : ([["FloorBuildUp", `IFCLENGTHMEASURE(${real(room.floorBuildUp)})`]] as [
              string,
              string,
            ][])),
        ...(clear.min === null
          ? []
          : ([
              ["ClearHeightMin", `IFCLENGTHMEASURE(${real(clear.min)})`],
              ["ClearHeightMax", `IFCLENGTHMEASURE(${real(clear.max!)})`],
            ] as [string, string][])),
        ["AreaWithoutHeightSource", `IFCAREAMEASURE(${real(clear.openArea)})`],
        ...roomHeightLineResults(room, ceilings).flatMap(
          (r) =>
            [
              [`AreaFrom ${heightLineName(r.line)}`, `IFCAREAMEASURE(${real(r.areaAbove)})`],
              [`ShareFrom ${heightLineName(r.line)}`, `IFCRATIOMEASURE(${real(r.share)})`],
            ] as [string, string][],
        ),
      ]);
    }
    if (spaces.length)
      add(
        "IFCRELAGGREGATES",
        `${await guid("space-aggregate", floor.id)},$,$,$,${storey},(${spaces.join(",")})`,
      );
    // IFC requires a non-empty set; empty projects still retain their spatial hierarchy.
    if (elements.length)
      add(
        "IFCRELCONTAINEDINSPATIALSTRUCTURE",
        `${await guid("containment", floor.id)},$,$,$,(${elements.join(",")}),${storey}`,
      );
  }
  // IFC4: element types are declared in the project context.
  if (types.length)
    add(
      "IFCRELDECLARES",
      `${await guid("declares", "filling-types")},$,$,$,${projectRef},(${types.join(",")})`,
    );
  return [
    "ISO-10303-21;",
    "HEADER;",
    `FILE_DESCRIPTION((${text(description)}),'2;1');`,
    `FILE_NAME('novikov-project.ifc',${text(exportedAt)},(''),(''),'NOVIKOV CAD','NOVIKOV CAD','');`,
    "FILE_SCHEMA(('IFC4'));",
    "ENDSEC;",
    "DATA;",
    ...lines,
    "ENDSEC;",
    "END-ISO-10303-21;",
    "",
  ].join("\n");
}
