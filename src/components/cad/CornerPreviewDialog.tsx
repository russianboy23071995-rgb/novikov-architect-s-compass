import { useReducer, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const [secondId, setSecondId] = useState("");
  const [firstEnd, setFirstEnd] = useState<0 | 1>(1);
  const [secondEnd, setSecondEnd] = useState<0 | 1>(0);
  const [state, dispatch] = useReducer(cornerPreviewReducer, { preview: null, error: "" });
  const preview = currentCornerPreview(state, project);
  const visible = [firstId, secondId].every((id) => isLayerVisible(project, visibility, id));
  const stale = project !== base;
  const clear = () => dispatch({ type: "clear" });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          clear();
          onClose();
        }
      }}
    >
      <DialogContent className="glass-panel-strong sm:max-w-[1100px]">
        <DialogTitle>Wandanschluss · Vorschau</DialogTitle>
        <DialogDescription>
          Wähle das Wandpaar und die zu verbindenden Achsenden. Temporäre Vorschau ohne
          Modelländerung; Escape schließt.
        </DialogDescription>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span>Erste Wand: {firstId}</span>
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
          <label>
            Zweite Wand{" "}
            <select
              aria-label="Zweite Wand"
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
                    {w.id}
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
              dispatch({
                type: "preview",
                project,
                first: { wallId: firstId, endpoint: firstEnd },
                second: { wallId: secondId, endpoint: secondEnd },
              })
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
      </DialogContent>
    </Dialog>
  );
}
