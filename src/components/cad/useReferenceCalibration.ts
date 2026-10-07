import { useMemo, useRef, useState } from "react";
import type { Project, Point } from "@/domain/project/schema";
import type { SelectionSet } from "@/application/selection/state";
import type { LayerVisibilityPolicy } from "@/application/layers/visibility";
import { parseCalibrationLength, previewCalibration } from "@/application/references/calibration";
import type { ToolInteraction } from "@/application/tools/interaction";
import { drawingSnapPolicy } from "@/application/tools/snapping";
import { querySnap } from "@/constraints/snapping/engine";
export function useReferenceCalibration(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (p: Project, id: string) => void,
) {
  const [session, setSession] = useState<{
    base: Project;
    visibility: LayerVisibilityPolicy;
    id: string;
    points: Point[];
  } | null>(null);
  const [length, setLength] = useState("");
  const [error, setError] = useState("");
  const active =
    session?.base === project &&
    session.visibility === visibility &&
    targets.length === 1 &&
    targets[0]?.kind === "reference" &&
    targets[0].id === session.id
      ? session
      : null;
  const latest = useRef({ project, targets, visibility, active, length, commit });
  latest.current = { project, targets, visibility, active, length, commit };
  const cancel = () => {
    setSession(null);
    setError("");
  };
  const begin = () => {
    if (targets.length === 1 && targets[0]?.kind === "reference") {
      setSession({ base: project, visibility, id: targets[0].id, points: [] });
      setLength("");
      setError("");
    }
  };
  const preview = () => {
    const now = latest.current;
    const s = now.active;
    if (!s || s.points.length !== 2) throw new Error("Zuerst zwei Messpunkte wählen.");
    return previewCalibration(
      s.base,
      now.project,
      now.targets,
      {
        projectId: s.base.id,
        referenceId: s.id,
        first: s.points[0]!,
        second: s.points[1]!,
        metres: parseCalibrationLength(now.length),
      },
      now.visibility,
    );
  };
  const confirm = () => {
    try {
      const next = preview();
      latest.current.commit(next, latest.current.active!.id);
      cancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kalibrierung fehlgeschlagen.");
    }
  };
  const adapter = useMemo<ToolInteraction | null>(() => {
    if (!active) return null;
    const current = () => {
      if (latest.current.active !== active) throw new Error("Kalibrierung nicht mehr aktuell.");
    };
    return {
      identity: active,
      origin: active.points[0] ?? { x: 0, y: 0 },
      input: null,
      click: "confirm",
      snapping: active.points[0]
        ? drawingSnapPolicy(active.points[0])
        : { origin: null, sources: (r) => [...r], resolve: querySnap },
      preview: () => {
        throw new Error("Länge im On-Demand-Menü eingeben.");
      },
      previewProject: () => {
        current();
        if (active.points.length === 2 && latest.current.length.trim()) return preview();
        return project;
      },
      validate: (p) => {
        current();
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error("Ungültiger Punkt.");
        if (
          active.points.length === 1 &&
          Math.hypot(p.x - active.points[0]!.x, p.y - active.points[0]!.y) <= 1e-9
        )
          throw new Error("Zweiten Punkt mit Abstand wählen.");
      },
      commit: (p) => {
        current();
        if (active.points.length < 2)
          setSession({ ...active, points: [...active.points, { ...p }] });
      },
      cancel,
    };
  }, [active, project]);
  return {
    begin,
    cancel,
    confirm,
    adapter,
    active: !!active,
    points: active?.points.length ?? 0,
    length,
    setLength,
    error,
  };
}
