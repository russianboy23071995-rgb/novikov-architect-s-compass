# IFC4 export

Click **IFC** (download icon, **Export IFC**) in the top toolbar to download `novikov-project.ifc`. The export uses the current committed model snapshot; unsaved form edits must first be applied with **Apply dimensions**. Generation takes place locally in the browser. The button is disabled while generating, failures keep the model unchanged, and the UI reports that the download was requested rather than claiming the file was saved to disk.

`await exportIfc(project)` returns an IFC4 STEP string. An optional `Date` argument fixes the export timestamp for reproducible tests. The complete project is validated and copied before asynchronous hashing, so edits during generation cannot mix snapshots.

## Mapping

| Model              | IFC mapping                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Project            | IfcProject, metre length unit and 3D context                                                                       |
| Single storey      | IfcSite → IfcBuilding → IfcBuildingStorey, elevation 0                                                             |
| Straight wall      | IfcWall with local placement, rectangular profile and vertical IfcExtrudedAreaSolid                                |
| Window opening     | IfcOpeningElement through the complete wall thickness, linked by IfcRelVoidsElement                                |
| Window             | IfcWindow with overall width/height, linked to its opening by IfcRelFillsElement                                   |
| IDs and parameters | NOVIKOV_BIM custom property set: SourceId; wall Length/Thickness/Height; window WallId/SillHeight/RelativePosition |

Walls and windows are contained in the storey. Openings are associated with their host wall and are not separately contained in the storey. The geometry uses metres and Z-up. A rotated wall's placement carries its direction; window coordinates remain relative to its wall, including the sill elevation. The opening's left edge is `position × wallLength − width / 2`.

GlobalIds use 128 bits derived from SHA-256 of the versioned NOVIKOV namespace, project ID, entity kind and source ID, with UUID version-8/variant bits and IFC's 22-character encoding. They remain stable across edits, reordering and repeated exports, including JSON reloads. Project IDs must distinguish independent projects; cloning the same IDs intentionally preserves IFC identity. The full original ID is retained in SourceId even if the display label must be shortened to IFC's limit.

## Independent validation

The application has no new runtime dependency. Python dependencies below are optional development tools; install them in an isolated environment:

```sh
python -m venv ../ifc-check
# Activate ../ifc-check for your platform, then:
python -m pip install -r scripts/requirements-ifc.txt
node --experimental-strip-types scripts/generate-ifc-fixtures.mjs ../ifc-fixtures
python scripts/validate-ifc.py ../ifc-fixtures
```

The eight fixtures cover the reference model, changed wall dimensions, diagonal/multiple walls, overlapping openings, a floor-level opening, a fully removed wall, Unicode/escaped IDs and an empty project. IfcOpenShell 0.8.5 checks IFC4 schema and EXPRESS rules, unique GlobalIds, spatial hierarchy, references, local/world placement, dimensions and wall net volumes after boolean subtraction. These are independent parsing and geometry checks, not a claim of certification or compatibility with every authoring application.

`npm test` also includes 10 export tests covering identifiers, references, escaping, number syntax, empty models, invalid data and snapshot isolation.

## Scope and next step

This is the first export-only step in the agreed IFC exchange stage. Windows have semantic dimensions and openings but no fabricated frame/glass body. Walls are independent solids without wall-junction unions. No IFC import, georeferencing, material specification, quantity takeoff or model-view certification is claimed. Session reload still resets the UI model; the IFC file is not a substitute for editable project save/load.

Before moving to AI/voice execution, review an exported model in the intended receiving CAD/BIM application. Import/round-trip support should be a separate, scoped step if required.

References: [buildingSMART IFC4 IfcWindow](https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/schema/ifcsharedbldgelements/lexical/ifcwindow.htm), [IfcOpeningElement](https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/schema/ifcproductextension/lexical/ifcopeningelement.htm), [IfcGloballyUniqueId](https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/schema/ifcutilityresource/lexical/ifcgloballyuniqueid.htm), [IfcOpenShell validation](https://docs.ifcopenshell.org/autoapi/ifcopenshell/validate/index.html).
