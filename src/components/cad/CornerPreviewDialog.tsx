import { useReducer, useState } from "react";
import { FloatingPanel } from "./FloatingPanel";
import { Button } from "@/components/ui/button";
import { cornerPreviewReducer, currentCornerPreview } from "@/application/walls/corner-preview";
import type { Project } from "@/domain/project/schema";
import { isLayerVisible, type LayerVisibilityPolicy } from "@/application/layers/visibility";
import { CadViewport } from "./CadViewport";

export function CornerPreviewDialog({
  project,
  firstId,
  visibility,
  onClose,
}: {
  project: Project;
  firstId: string;
  visibility: LayerVisibilityPolicy;
  onClose: () => void;
}) {
  const [base] = useState(project);
  const [kind, setKind] = useState<"corner" | "t">("corner");
  const [secondId, setSecondId] = useState("");
  const [firstEnd, setFirstEnd] = useState<0 | 1>(1);
  const [secondEnd, setSecondEnd] = useState<0 | 1>(0);
  const [state, dispatch] = useReducer(cornerPreviewReducer, { preview: null, error: "" });
  const preview = currentCornerPreview(state, project);
  const visible = [firstId, secondId].every((id) => isLayerVisible(project, visibility, id));
  const stale = project !== base;
  const clear = () => dispatch({ type: "clear" });
  return (
    <FloatingPanel
      open
      title="Wandanschluss · Vorschau"
      width={1100}
      height={700}
      onClose={() => {
        clear();
        onClose();
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto space-y-4 p-4">
        <p className="text-xs text-muted-foreground">
          Wähle das Wandpaar und den Anschlusstyp. Beim T bleibt die erste Wand durchgehend.
          Temporäre Vorschau ohne Modelländerung; Escape schließt.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label>
            Anschlusstyp{" "}
            <select
              aria-label="Anschlusstyp"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as "corner" | "t");
                clear();
              }}
            >
              <option value="corner">Rechtwinklige Ecke</option>
              <option value="t">Rechtwinkliger T-Anschluss</option>
            </select>
          </label>
          <span>
            {kind === "t" ? "Hauptwand:" : "Erste Wand:"} Wall{" "}
            {project.storey.walls.findIndex((w) => w.id === firstId) + 1}
          </span>
          {kind === "corner" && (
            <label>
              Erstes Achsende{" "}
              <select
                aria-label="Erstes Achsende"
                value={firstEnd}
                onChange={(e) => {
                  setFirstEnd(Number(e.target.value) as 0 | 1);
                  clear();
                }}
              >
                <option value={0}>Anfang</option>
                <option value={1}>Ende</option>
              </select>
            </label>
          )}
          <label>
            {kind === "t" ? "Ankommende Wand" : "Zweite Wand"}{" "}
            <select
              aria-label={kind === "t" ? "Ankommende Wand" : "Zweite Wand"}
              value={secondId}
              onChange={(e) => {
                setSecondId(e.target.value);
                clear();
              }}
            >
              <option value="">Bitte wählen</option>
              {project.storey.walls
                .filter((w) => w.id !== firstId && isLayerVisible(project, visibility, w.id))
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    Wall {project.storey.walls.findIndex((wall) => wall.id === w.id) + 1}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Zweites Achsende{" "}
            <select
              aria-label="Zweites Achsende"
              value={secondEnd}
              onChange={(e) => {
                setSecondEnd(Number(e.target.value) as 0 | 1);
                clear();
              }}
            >
              <option value={0}>Anfang</option>
              <option value={1}>Ende</option>
            </select>
          </label>
          <Button
            disabled={!secondId || stale || !visible}
            onClick={() =>
              dispatch(
                kind === "t"
                  ? {
                      type: "t-preview",
                      project,
                      hostId: firstId,
                      incoming: { wallId: secondId, endpoint: secondEnd },
                    }
                  : {
                      type: "preview",
                      project,
                      first: { wallId: firstId, endpoint: firstEnd },
                      second: { wallId: secondId, endpoint: secondEnd },
                    },
              )
            }
          >
            Vorschau anzeigen
          </Button>
        </div>
        {(stale || state.error || (secondId && !visible)) && (
          <p role="alert">
            {stale
              ? "Das Modell wurde geändert. Vorschau schließen und erneut starten."
              : state.error || "Beide Wände müssen sichtbar sein."}
          </p>
        )}
        {preview && visible && !stale && (
          <>
            <p className="text-xs">
              Gemeinsamer Anschluss · Nettovolumen {preview.geometry.volume.toFixed(4)} m³ · nur
              Vorschau
            </p>
            <div className="grid h-[450px] grid-cols-2 gap-2">
              {(["2D", "3D"] as const).map((mode) => (
                <CadViewport
                  key={mode}
                  index={0}
                  mode={mode}
                  grid={false}
                  active
                  onActivate={() => {}}
                  onFullscreen={() => {}}
                  project={project}
                  visibility={visibility}
                  cornerPreview={preview}
                  selection={null}
                  drawing={false}
                  start={null}
                  snap={false}
                  ortho={false}
                  onSelect={() => {}}
                  onPoint={() => {}}
                />
              ))}
            </div>
          </>
        )}
        <Button
          variant="outline"
          onClick={() => {
            clear();
            onClose();
          }}
        >
          Vorschau schließen
        </Button>
      </div>
    </FloatingPanel>
  );
}
