import { translationFixture } from "./translation-content-fixture.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { DOOR_DEFAULTS } from "../src/domain/elements/door/model.ts";
export function buildingViewFixture(walls = 30) {
  const p = translationFixture(5);
  p.storeys = p.storeys.map((s) => ({
    ...s,
    walls: Array.from({ length: walls }, (_, i) => ({
      ...s.walls[0]!,
      id: `${s.id}-w${i}`,
      start: { x: (i % 10) * 6, y: Math.floor(i / 10) * 6 },
      end: { x: (i % 10) * 6 + 4, y: Math.floor(i / 10) * 6 },
    })),
    windows: Array.from({ length: walls }, (_, i) => ({
      ...s.windows[0]!,
      id: `${s.id}-win${i}`,
      wallId: `${s.id}-w${i}`,
    })),
  }));
  return validateProject(p);
}

/** Same building with one door per wall left of its centred window. */
export function buildingDoorFixture(walls = 30) {
  const p = buildingViewFixture(walls);
  return validateProject({
    ...p,
    storeys: p.storeys.map((s) => ({
      ...s,
      doors: s.walls.map((w, i) => ({
        id: `${s.id}-door${i}`,
        wallId: w.id,
        position: 0.2,
        ...DOOR_DEFAULTS,
        layerId: s.windows[0]!.layerId,
      })),
    })),
  });
}
