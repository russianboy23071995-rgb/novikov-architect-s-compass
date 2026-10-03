import { validateProject, wallLength } from "./model.ts";
import type { Project } from "./model.ts";

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

/** IFC4 STEP export; validates and copies the snapshot before any asynchronous work.
 * Windows remain semantic elements without invented frame/glass geometry.
 * Openings are separate swept solids linked with IfcRelVoidsElement / IfcRelFillsElement.
 */
export async function exportIfc(input: Project, timestamp = new Date()): Promise<string> {
  const project = validateProject(input);
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
  const storeyPlacement = placement(buildingPlacement);
  const storey = add(
    "IFCBUILDINGSTOREY",
    `${await guid("storey", project.storey.id)},$,${label(project.storey.id)},$,$,${storeyPlacement},$,$,.ELEMENT.,0.`,
  );
  for (const [key, parent, child] of [
    ["project-site", projectRef, site],
    ["site-building", site, building],
    ["building-storey", building, storey],
  ] as const) {
    add("IFCRELAGGREGATES", `${await guid("aggregate", key)},$,$,$,${parent},(${child})`);
  }

  const body = (length: number, thickness: number, height: number) => {
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
  await properties(projectRef, "project", project.id, [["SchemaVersion", "IFCINTEGER(1)"]]);
  await properties(storey, "storey", project.storey.id, []);
  const elements: string[] = [];
  for (const wall of project.storey.walls) {
    const length = wallLength(wall);
    const wallPlacement = placement(
      storeyPlacement,
      wall.start.x,
      wall.start.y,
      0,
      (wall.end.x - wall.start.x) / length,
      (wall.end.y - wall.start.y) / length,
    );
    const wallRef = add(
      "IFCWALL",
      `${await guid("wall", wall.id)},$,${label(wall.id)},$,$,${wallPlacement},${body(length, wall.thickness, wall.height)},${label(wall.id)},.NOTDEFINED.`,
    );
    elements.push(wallRef);
    await properties(wallRef, "wall", wall.id, [
      ["Length", `IFCLENGTHMEASURE(${real(length)})`],
      ["Thickness", `IFCLENGTHMEASURE(${real(wall.thickness)})`],
      ["Height", `IFCLENGTHMEASURE(${real(wall.height)})`],
    ]);
    for (const window of project.storey.windows.filter((item) => item.wallId === wall.id)) {
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
        `${await guid("window", window.id)},$,${label(window.id)},$,$,${placement(openingPlacement)},$,${label(window.id)},${real(window.height)},${real(window.width)},.WINDOW.,.NOTDEFINED.,$`,
      );
      add("IFCRELFILLSELEMENT", `${await guid("fill", window.id)},$,$,$,${opening},${windowRef}`);
      elements.push(windowRef);
      await properties(windowRef, "window", window.id, [
        ["WallId", `IFCTEXT(${text(window.wallId)})`],
        ["SillHeight", `IFCLENGTHMEASURE(${real(window.sillHeight)})`],
        ["RelativePosition", `IFCRATIOMEASURE(${real(window.position)})`],
      ]);
    }
  }
  // IFC requires a non-empty set; empty projects still retain their spatial hierarchy.
  if (elements.length)
    add(
      "IFCRELCONTAINEDINSPATIALSTRUCTURE",
      `${await guid("containment", project.storey.id)},$,$,$,(${elements.join(",")}),${storey}`,
    );
  return [
    "ISO-10303-21;",
    "HEADER;",
    "FILE_DESCRIPTION(('NOVIKOV CAD parametric BIM export'),'2;1');",
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
