import type { Project, Point } from "../../domain/project/schema.ts";
import { validateProject } from "../../domain/project/schema.ts";
import type { SelectionSet } from "../selection/state.ts";
import { isLayerVisible, type LayerVisibilityPolicy } from "../layers/visibility.ts";
import { calibrationTransform } from "../../geometry/transforms/calibrate.ts";
import { commitProject, type ProjectHistory } from "../../lib/bim/history.ts";
export type CalibrationRequest = {
  projectId: string;
  referenceId: string;
  first: Point;
  second: Point;
  metres: number;
};
export function parseCalibrationLength(text: string): number {
  const match = /^\s*(\d+(?:[.,]\d+)?|[.,]\d+)\s*(mm|cm|m)\s*$/i.exec(text);
  if (!match) throw new Error("Länge mit Einheit eingeben, z. B. 5 m oder 250 cm.");
  const value =
    Number(match[1]!.replace(",", ".")) * { m: 1, cm: 0.01, mm: 0.001 }[match[2]!.toLowerCase()]!;
  if (!Number.isFinite(value) || value <= 0) throw new Error("Positive Länge eingeben.");
  return value;
}
export function previewCalibration(
  base: Project,
  current: Project,
  targets: SelectionSet,
  request: CalibrationRequest,
  visibility?: LayerVisibilityPolicy,
): Project {
  if (base !== current || request.projectId !== current.id)
    throw new Error("Projekt geändert. Kalibrierung erneut beginnen.");
  if (
    targets.length !== 1 ||
    targets[0]?.kind !== "reference" ||
    targets[0].id !== request.referenceId
  )
    throw new Error(
      "Nur eine Bildreferenz darf kalibriert werden; BIM- und Mischauswahl sind ausgeschlossen.",
    );
  const r = current.storey.references.find((r) => r.id === request.referenceId);
  if (!r || !isLayerVisible(current, visibility, r.id))
    throw new Error("Bildreferenz nicht verfügbar.");
  const t = calibrationTransform(r.origin, request.first, request.second, request.metres);
  return validateProject({
    ...current,
    storey: {
      ...current.storey,
      references: current.storey.references.map((item) =>
        item === r ? { ...r, origin: t.origin, metresPerPixel: r.metresPerPixel * t.factor } : item,
      ),
    },
  });
}
export function commitCalibration(
  history: ProjectHistory,
  base: Project,
  targets: SelectionSet,
  request: CalibrationRequest,
  visibility?: LayerVisibilityPolicy,
) {
  return commitProject(
    history,
    previewCalibration(base, history.present, targets, request, visibility),
  );
}

/** Identity token for one completed measurement; replacing it invalidates pending commands. */
export type CalibrationContext = Readonly<{
  base: Project;
  visibility: LayerVisibilityPolicy;
  referenceId: string;
  first: Readonly<Point>;
  second: Readonly<Point>;
}>;
export function createCalibrationContext(
  base: Project,
  visibility: LayerVisibilityPolicy,
  referenceId: string,
  first: Point,
  second: Point,
): CalibrationContext {
  return Object.freeze({
    base,
    visibility,
    referenceId,
    first: Object.freeze({ ...first }),
    second: Object.freeze({ ...second }),
  });
}
