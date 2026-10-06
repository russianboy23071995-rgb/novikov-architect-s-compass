"""Independent schema, relationship and geometry checks (IfcOpenShell 0.8.5).

Usage: python scripts/validate-ifc.py <fixture-directory>
Generate fixtures first with scripts/generate-ifc-fixtures.mjs or
scripts/generate-corner-ifc-fixtures.mjs. Requires ifcopenshell==0.8.5 and pytest.
"""
import json
import math
import sys
from pathlib import Path

import ifcopenshell
import ifcopenshell.geom
import ifcopenshell.util.element
import ifcopenshell.util.placement
import ifcopenshell.util.shape
import ifcopenshell.validate


def close(actual, expected):
    assert math.isclose(actual, expected, rel_tol=1e-7, abs_tol=1e-7), (actual, expected)


def validate(path):
    expected = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
    project = expected["project"]
    model = ifcopenshell.open(str(path))
    logger = ifcopenshell.validate.json_logger()
    ifcopenshell.validate.validate(model, logger, express_rules=True)
    assert not logger.statements, json.dumps(logger.statements, default=str, indent=2)
    assert model.schema == "IFC4"
    roots = model.by_type("IfcRoot")
    assert len({root.GlobalId for root in roots}) == len(roots)
    for root in roots:
        assert len(ifcopenshell.guid.expand(root.GlobalId)) == 32
    assert len(model.by_type("IfcProject")) == 1
    assert len(model.by_type("IfcBuildingStorey")) == 1
    units = model.by_type("IfcProject")[0].UnitsInContext.Units
    assert any(unit.UnitType == "LENGTHUNIT" and unit.Name == "METRE" and unit.Prefix is None for unit in units)
    for entity_type, count in [("IfcWall", len(project["storey"]["walls"])), ("IfcWindow", len(project["storey"]["windows"])), ("IfcOpeningElement", len(project["storey"]["windows"]))]:
        assert len(model.by_type(entity_type)) == count, entity_type
    assert len(model.by_type("IfcRelVoidsElement")) == len(project["storey"]["windows"])
    assert len(model.by_type("IfcRelFillsElement")) == len(project["storey"]["windows"])
    storey = model.by_type("IfcBuildingStorey")[0]
    assert storey.Decomposes[0].RelatingObject.is_a("IfcBuilding")
    building = storey.Decomposes[0].RelatingObject
    assert building.Decomposes[0].RelatingObject.is_a("IfcSite")
    assert building.Decomposes[0].RelatingObject.Decomposes[0].RelatingObject.is_a("IfcProject")
    settings = ifcopenshell.geom.settings()
    settings.set("use-world-coords", True)
    for wall in project["storey"]["walls"]:
        entity = next(w for w in model.by_type("IfcWall") if ifcopenshell.util.element.get_pset(w, "NOVIKOV_BIM", "SourceId") == wall["id"])
        assert entity.ContainedInStructure[0].RelatingStructure == storey
        matrix = ifcopenshell.util.placement.get_local_placement(entity.ObjectPlacement)

        length = math.hypot(wall["end"]["x"]-wall["start"]["x"], wall["end"]["y"]-wall["start"]["y"])
        ux = (wall["end"]["x"]-wall["start"]["x"])/length
        uy = (wall["end"]["y"]-wall["start"]["y"])/length
        offset = wall.get("bodyOffset", 0)
        close(matrix[0, 3], wall["start"]["x"] - uy * offset)
        close(matrix[1, 3], wall["start"]["y"] + ux * offset)
        close(matrix[0, 0], (wall["end"]["x"]-wall["start"]["x"])/length)
        close(matrix[1, 0], (wall["end"]["y"]-wall["start"]["y"])/length)
        body = entity.Representation.Representations[0].Items[0]
        close(body.Depth, wall["height"])
        profile = expected.get("profiles", {}).get(wall["id"])
        if profile is not None:
            assert body.SweptArea.is_a("IfcArbitraryClosedProfileDef")
            points = body.SweptArea.OuterCurve.Points
            assert points[0] == points[-1], "Profile must explicitly close"
            assert len(points) == len(profile) + 1
            for point, target in zip(points, profile):
                close(point.Coordinates[0], target["x"])
                close(point.Coordinates[1], target["y"])
            for point, target in zip(points, expected["contours"][wall["id"]]):
                x, y = point.Coordinates
                close(matrix[0, 3] + ux*x - uy*y, target["x"])
                close(matrix[1, 3] + uy*x + ux*y, target["y"])
        else:
            close(body.SweptArea.XDim, length)
            close(body.SweptArea.YDim, wall["thickness"])
        shape = ifcopenshell.geom.create_shape(settings, entity)
        close(ifcopenshell.util.shape.get_volume(shape.geometry), expected["volumes"][wall["id"]])
    for window in project["storey"]["windows"]:
        entity = next(w for w in model.by_type("IfcWindow") if ifcopenshell.util.element.get_pset(w, "NOVIKOV_BIM", "SourceId") == window["id"])
        assert entity.ContainedInStructure[0].RelatingStructure == storey
        close(entity.OverallWidth, window["width"])
        close(entity.OverallHeight, window["height"])
        close(ifcopenshell.util.element.get_pset(entity, "NOVIKOV_BIM", "RelativePosition"), window["position"])
        close(ifcopenshell.util.element.get_pset(entity, "NOVIKOV_BIM", "SillHeight"), window["sillHeight"])
        opening = entity.FillsVoids[0].RelatingOpeningElement
        host = opening.VoidsElements[0].RelatingBuildingElement
        assert ifcopenshell.util.element.get_pset(host, "NOVIKOV_BIM", "SourceId") == window["wallId"]
        assert not opening.ContainedInStructure
        wall = next(w for w in project["storey"]["walls"] if w["id"] == window["wallId"])
        length = math.hypot(wall["end"]["x"]-wall["start"]["x"], wall["end"]["y"]-wall["start"]["y"])
        along = window["position"] * length - window["width"]/2
        matrix = ifcopenshell.util.placement.get_local_placement(entity.ObjectPlacement)
        close(matrix[0, 3], wall["start"]["x"] + along * (wall["end"]["x"]-wall["start"]["x"])/length - wall.get("bodyOffset", 0)*(wall["end"]["y"]-wall["start"]["y"])/length)
        close(matrix[1, 3], wall["start"]["y"] + along * (wall["end"]["y"]-wall["start"]["y"])/length + wall.get("bodyOffset", 0)*(wall["end"]["x"]-wall["start"]["x"])/length)
        close(matrix[2, 3], window["sillHeight"])
    assert ifcopenshell.util.element.get_pset(model.by_type("IfcProject")[0], "NOVIKOV_BIM", "SourceId") == project["id"]
    print(f"PASS {path.name}: IFC4 schema/EXPRESS, hierarchy, relationships, placement and net wall volumes")
    return {entity.Tag: entity.GlobalId for entity in model.by_type("IfcWall") + model.by_type("IfcWindow")}


directory = Path(sys.argv[1])
files = sorted(directory.glob("*.ifc"))
assert files, "No IFC fixtures found"
identities = {path.stem: validate(path) for path in files}
if "reference" in identities and "extended" in identities:
    assert identities["reference"] == identities["extended"], "IFC identities changed after a dimension edit"
print(f"Validated {len(files)} files with IfcOpenShell {ifcopenshell.version}")
