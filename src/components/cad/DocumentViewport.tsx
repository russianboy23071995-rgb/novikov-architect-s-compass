import type { Project } from "@/domain/project/schema";
import type { WorkingViewContext } from "@/application/views/working-context";
import type { Selection } from "./bim-view";
import { CadViewport } from "./CadViewport";

/** Read-only model projection; no drawing, direct-edit, pickup or model command adapters. */
export function DocumentViewport({
  project,
  viewContext,
  selection,
  onSelect,
  onScale,
  onFullscreen,
  zoomSlot,
  grid,
}: {
  project: Project;
  viewContext: WorkingViewContext;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  onScale: (scale: number) => void;
  onFullscreen: () => void;
  zoomSlot: HTMLElement | null;
  grid: boolean;
}) {
  return (
    <div className="grid h-full min-h-0">
      <CadViewport
        key={JSON.stringify(viewContext.binding)}
        project={project}
        viewContext={viewContext}
        index={0}
        mode="2D"
        grid={grid}
        active
        onActivate={() => {}}
        onFullscreen={onFullscreen}
        onScale={onScale}
        zoomSlot={zoomSlot}
        selection={selection}
        drawing={false}
        start={null}
        snap={false}
        endpointSnap={false}
        ortho={false}
        onSelect={onSelect}
        onPoint={() => {}}
      />
    </div>
  );
}
