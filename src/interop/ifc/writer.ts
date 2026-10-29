import { wallBase } from "../../domain/elements/wall/heights.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { validateSimplePolygon } from "../../geometry/polygons/simple-polygon.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { validateProject, wallLength } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { doorDinHand, doorOpening, type Door } from "../../domain/elements/door/model.ts";
import { slabLevels } from "../../domain/elements/slab/model.ts";
import { roofBody } from "../../domain/elements/roof/body.ts";

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
  const properties = async (
    target: string,
    kind: string,
    id: string,
    values: [string, string][],
  ) => {
    const props = [["SourceId", `IFCTEXT(${text(id)})`], ...values].map(([name, value]) =>
      add("IFCPROPERTYSINGLEVALUE", `${text(name!)},$,${value},$`),
    );
    const pset = add(
      "IFCPROPERTYSET",
      `${await guid("properties", JSON.stringify([kind, id]))},$,'NOVIKOV_BIM',$,(${props.join(",")})`,
    );
    add(
      "IFCRELDEFINESBYPROPERTIES",
      `${await guid("property-relation", JSON.stringify([kind, id]))},$,$,$,(${target}),${pset}`,
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
  ) => {
    if (!filling.fillingTypes) return;
    const name = label(id + " Typ");
    const type =
      kind === "window"
        ? add(
            "IFCWINDOWTYPE",
            `${await guid("window-type", id)},$,${name},$,$,$,$,$,$,.WINDOW.,.SINGLE_PANEL.,.F.,$`,
          )
        : add(
            "IFCDOORTYPE",
            `${await guid("door-type", id)},$,${name},$,$,$,$,$,$,.DOOR.,.${operation}.,.F.,$`,
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
      const wallRef = add(
        "IFCWALL",
        `${await guid("wall", wall.id)},$,${label(wall.id)},$,$,${wallPlacement},${body(length, wall.thickness, wall.height, profiles.get(wall.id))},${label(wall.id)},.NOTDEFINED.`,
      );
      elements.push(wallRef);
      await properties(wallRef, "wall", wall.id, [
        ["Length", `IFCLENGTHMEASURE(${real(length)})`],
        ["Thickness", `IFCLENGTHMEASURE(${real(wall.thickness)})`],
        ["Height", `IFCLENGTHMEASURE(${real(wall.height)})`],
        ["BodyOffset", `IFCLENGTHMEASURE(${real(wall.bodyOffset)})`],
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
        const windowRef = add(
          "IFCWINDOW",
          `${await guid("window", window.id)},$,${label(window.id)},$,$,${placement(openingPlacement)},${fillingShape(window.width, wall.thickness, window.height)},${label(window.id)},${real(window.height)},${real(window.width)},.WINDOW.,.NOTDEFINED.,$`,
        );
        add("IFCRELFILLSELEMENT", `${await guid("fill", window.id)},$,$,$,${opening},${windowRef}`);
        elements.push(windowRef);
        await properties(windowRef, "window", window.id, [
          ["WallId", `IFCTEXT(${text(window.wallId)})`],
          ["SillHeight", `IFCLENGTHMEASURE(${real(window.sillHeight)})`],
          ["RelativePosition", `IFCRATIOMEASURE(${real(window.position)})`],
          ...placeholder,
        ]);
        await fillingType("window", windowRef, window.id, window.width, window.height, "");
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
        const doorRef = add(
          "IFCDOOR",
          `${await guid("door", door.id)},$,${label(door.id)},$,$,${doorPlacement},${fillingShape(door.width, wall.thickness, door.height)},${label(door.id)},${real(door.height)},${real(door.width)},.DOOR.,.${doorOperationType(door)}.,$`,
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
          ...placeholder,
        ]);
        await fillingType(
          "door",
          doorRef,
          door.id,
          door.width,
          door.height,
          doorOperationType(door),
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
