import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { SelectionSet } from "../selection/state.ts";
import { isLayerVisible, type LayerVisibilityPolicy } from "../layers/visibility.ts";
import { calibrationTransform } from "../../geometry/transforms/calibrate.ts";
import { commitProject, type ProjectHistory } from "../history/project-history.ts";
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
  const r = storeyOf(current).references.find((r) => r.id === request.referenceId);
  if (!r || !isLayerVisible(current, visibility, r.id))
    throw new Error("Bildreferenz nicht verfügbar.");
  const t = calibrationTransform(r.origin, request.first, request.second, request.metres);
  return validateLike(current, {
    ...replaceStorey(current, {
      ...storeyOf(current),
      references: storeyOf(current).references.map((item) =>
        item === r ? { ...r, origin: t.origin, metresPerPixel: r.metresPerPixel * t.factor } : item,
      ),
    }),
  });
}
/**
 * A length typed into the calibration field (docs/BILDUNTERLAGE.md, B4): a bare number is metres,
 * as in every length field; otherwise the unit is required as in the model command.
 */
export function parseCalibrationField(text: string): number {
  return parseCalibrationLength(
    /^\s*(\d+(?:[.,]\d+)?|[.,]\d+)\s*$/.test(text) ? `${text} m` : text,
  );
}

/** Turn that brings the line first→second onto the nearest axis, in radians (B3). */
export function alignmentTurn(first: Point, second: Point): number {
  const angle = Math.atan2(second.y - first.y, second.x - first.x);
  return Math.round(angle / (Math.PI / 2)) * (Math.PI / 2) - angle;
}

/**
 * An Linie ausrichten (docs/BILDUNTERLAGE.md, B3): two points on a line of the image, the
 * underlay turns about the first so that the line lies horizontal or vertical, whichever is
 * nearer. The first point stays where it is.
 */
export function previewAlignment(
  base: Project,
  current: Project,
  targets: SelectionSet,
  request: Omit<CalibrationRequest, "metres">,
  visibility?: LayerVisibilityPolicy,
): Project {
  if (base !== current || request.projectId !== current.id)
    throw new Error("Projekt geändert. Ausrichten erneut beginnen.");
  if (
    targets.length !== 1 ||
    targets[0]?.kind !== "reference" ||
    targets[0].id !== request.referenceId
  )
    throw new Error("Nur eine Bildunterlage lässt sich ausrichten.");
  const r = storeyOf(current).references.find((r) => r.id === request.referenceId);
  if (!r || !isLayerVisible(current, visibility, r.id))
    throw new Error("Bildunterlage nicht verfügbar.");
  const { first, second } = request;
  if (Math.hypot(second.x - first.x, second.y - first.y) <= 1e-9)
    throw new Error("Zweiten Punkt mit Abstand wählen.");
  const turn = alignmentTurn(first, second);
  const c = Math.cos(turn),
    s = Math.sin(turn);
  const dx = r.origin.x - first.x,
    dy = r.origin.y - first.y;
  let rotation = r.rotation + turn;
  // Kept in (-π, π] so the window shows a short angle.
  rotation = Math.atan2(Math.sin(rotation), Math.cos(rotation));
  if (Math.abs(rotation) < 1e-12) rotation = 0;
  return validateLike(current, {
    ...replaceStorey(current, {
      ...storeyOf(current),
      references: storeyOf(current).references.map((item) =>
        item === r
          ? {
              ...r,
              origin: { x: first.x + c * dx - s * dy, y: first.y + s * dx + c * dy },
              rotation,
            }
          : item,
      ),
    }),
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
