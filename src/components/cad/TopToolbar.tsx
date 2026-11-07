import type { VisibilityAction } from "@/application/layers/visibility-actions";
import { withStableHandlers } from "./stable-handlers";
import {
  Ruler,
  Filter,
  EyeOff,
  Focus,
  Layers2,
  Contrast,
  Menu,
  PanelRightOpen,
  Redo2,
  Save,
  Download,
  FolderOpen,
  Settings,
  Undo2,
} from "lucide-react";
import novikovLogo from "@/assets/novikov-logo.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ACTIVE_CONTROL } from "./active-control";

type TopToolbarProps = {
  storeyName: string;
  onPenSets: () => void;
  onLineCreator: () => void;
  onHatchLibrary: () => void;
  onMeasure: () => void;
  /** Filter (docs/FILTER.md, L45): a function, opens its window. */
  onFilter: () => void;
  filterOpen: boolean;
  /** Why the filter is not available in this view; undefined when it is. */
  filterBlocked?: string | undefined;
  measuring: boolean;
  onImportImage: () => void;
  onCanvasDisplay: () => void;
  /** Edit → Tastenkürzel (docs/TASTENKUERZEL.md). */
  onHotkeys: () => void;
  navigatorOpen: boolean;
  onNavigator: () => void;
  onAction: (text: string) => void;
  onExportIfc: () => void;
  exportingIfc: boolean;
  onSave: () => void;
  onOpen: () => void;
  onRecovery: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Older undo steps were dropped to stay within the history memory budget. */
  historyTrimmed?: boolean;
  onLayers: () => void;
  onRoomList: () => void;
  onLivingList: () => void;
  /** Element list with quantities (docs/MENGEN.md, ML2). */
  onElementList: () => void;
  /** Opens the Plankopfplaner (docs/PLANKOPF.md). */
  onTitleBlockPlanner: () => void;
  /** Project information for automatic texts (docs/PLANKOPF.md, AT2). */
  onProjectInfo: () => void;
  /** Modify menu (docs/KONTEXTMENUE.md): only Pipette and trimming, no delete or order. */
  onPipette: () => void;
  canPipette: boolean;
  onTrim: () => void;
  canTrim: boolean;
  onUntrim: () => void;
  canUntrim: boolean;
  canUndoVisibility: boolean;
  canRedoVisibility: boolean;
  selectedLayer: { id: string; name: string } | null;
  onLayerVisibility: (action: VisibilityAction) => void;
};

function IconControl({
  label,
  children,
  onClick,
  active,
  disabled,
  hint,
}: {
  label: string;
  /** Second tooltip line, e.g. why a control behaves differently. */
  hint?: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "size-8 rounded text-muted-foreground hover:bg-accent hover:text-foreground",
            active && ACTIVE_CONTROL,
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {hint && <div className="text-[10px] opacity-80">{hint}</div>}
      </TooltipContent>
    </Tooltip>
  );
}

/** Memoised with stable callbacks: workspace renders (tab switches, hover) skip it (docs/TABS.md). */
export const TopToolbar = withStableHandlers(function TopToolbar(props: TopToolbarProps) {
  return (
    <header className="glass-panel-strong z-40 shrink-0 overflow-hidden rounded-lg">
      <div className="flex h-11 min-w-0 items-center gap-2 overflow-x-auto px-2.5">
        <div className="flex min-w-[190px] items-center gap-2 border-r border-border pr-3">
          <img
            src={novikovLogo}
            alt="NOVIKOV Logo"
            width={1024}
            height={1024}
            className="size-7 shrink-0 rounded-md object-contain"
          />
          <div className="min-w-0">
            <div className="font-display text-[13px] font-semibold text-foreground">
              NOVIKOV <span className="font-normal text-primary">CAD</span>
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              BIM Project · {props.storeyName}
            </div>
          </div>
        </div>
        <nav
          className="hidden items-center gap-0.5 border-r border-border pr-2 xl:flex"
          aria-label="Application menu"
        >
          {["File", "Edit", "View", "Insert", "Modify", "Tools"].map((item) =>
            item === "File" ? (
              <DropdownMenu key={item}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-normal text-muted-foreground"
                  >
                    File
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={props.onSave}>
                    Projektdatei speichern
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={props.onOpen}>Projektdatei öffnen</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={props.onRecovery}>
                    Lokale Wiederherstellung…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : item === "Edit" ? (
              <DropdownMenu key={item}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-normal text-muted-foreground"
                  >
                    Edit
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={props.onHotkeys}>Tastenkürzel…</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : item === "Tools" ? (
              <DropdownMenu key={item}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-normal text-muted-foreground"
                  >
                    Tools
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={props.onPenSets}>Stifteset…</DropdownMenuItem>
                  <DropdownMenuItem onSelect={props.onLineCreator}>
                    Linien Creator…
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={props.onHatchLibrary}>
                    Schraffurenverwaltung…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : item === "Modify" ? (
              <DropdownMenu key={item}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-normal text-muted-foreground"
                  >
                    Modify
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem disabled={!props.canPipette} onSelect={props.onPipette}>
                    Parameter übernehmen (Pipette)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={!props.canTrim}
                    title={props.canTrim ? undefined : "Wände und genau ein Dach auswählen."}
                    onSelect={props.onTrim}
                  >
                    Trimmen…
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!props.canUntrim} onSelect={props.onUntrim}>
                    Trimmung aufheben
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : item === "Insert" ? (
              <DropdownMenu key={item}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Insert
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={props.onImportImage}>
                    Bildreferenz importieren…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : item === "View" ? (
              <DropdownMenu key={item}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-normal text-muted-foreground"
                  >
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={props.onCanvasDisplay}>Darstellung…</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                key={item}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] font-normal text-muted-foreground"
                onClick={() => props.onAction(`${item} menu`)}
              >
                {item}
              </Button>
            ),
          )}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 shrink-0 px-2 text-[11px] font-normal">
              Organisation
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={props.onLayers}>Ebenen</DropdownMenuItem>
            <DropdownMenuItem onSelect={props.onRoomList}>Raumliste</DropdownMenuItem>
            <DropdownMenuItem onSelect={props.onLivingList}>Wohnflächenliste</DropdownMenuItem>
            <DropdownMenuItem onSelect={props.onElementList}>Bauteilliste</DropdownMenuItem>
            <DropdownMenuItem onSelect={props.onTitleBlockPlanner}>Plankopfplaner</DropdownMenuItem>
            <DropdownMenuItem onSelect={props.onProjectInfo}>Projektinformationen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-0.5 border-r border-border pr-2">
          <IconControl label="Messen" onClick={props.onMeasure} active={props.measuring}>
            <Ruler className="size-4" />
          </IconControl>
          <IconControl
            label="Filter"
            onClick={props.onFilter}
            active={props.filterOpen}
            {...(props.filterBlocked ? { hint: props.filterBlocked } : {})}
          >
            <Filter className="size-4" />
          </IconControl>
          <IconControl
            label="Undo"
            onClick={props.onUndo}
            disabled={!props.canUndo}
            {...(props.historyTrimmed ? { hint: "Verlauf gekürzt (Speichergrenze)" } : {})}
          >
            <Undo2 />
          </IconControl>
          <IconControl label="Redo" onClick={props.onRedo} disabled={!props.canRedo}>
            <Redo2 />
          </IconControl>
          <IconControl label="Save project" onClick={props.onSave}>
            <Save />
          </IconControl>
          <IconControl label="Open project" onClick={props.onOpen}>
            <FolderOpen />
          </IconControl>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-[11px]"
            onClick={props.onExportIfc}
            disabled={props.exportingIfc}
            aria-label="Export IFC"
          >
            <Download className="size-4" />
            {props.exportingIfc ? "Exporting…" : "IFC"}
          </Button>
        </div>
        <div
          role="group"
          aria-label="Ebenenumschalter"
          className="flex shrink-0 items-center gap-0.5 border-x border-border px-2"
        >
          <div className="mr-1 max-w-24 text-[10px] leading-tight">
            <span className="block font-semibold">Ebenen</span>
            <span
              className="block truncate text-muted-foreground"
              title={props.selectedLayer?.name}
            >
              {props.selectedLayer?.name ?? "Keine Auswahl"}
            </span>
          </div>
          <IconControl
            label="Ausgewählte Ebene unsichtbar stellen"
            disabled={!props.selectedLayer}
            onClick={() =>
              props.selectedLayer &&
              props.onLayerVisibility({ kind: "hide-selected", layerId: props.selectedLayer.id })
            }
          >
            <EyeOff />
          </IconControl>
          <IconControl
            label="Alle anderen Ebenen unsichtbar stellen"
            disabled={!props.selectedLayer}
            onClick={() =>
              props.selectedLayer &&
              props.onLayerVisibility({ kind: "hide-others", layerId: props.selectedLayer.id })
            }
          >
            <Focus />
          </IconControl>
          <IconControl
            label="Alle Ebenen unsichtbar stellen"
            onClick={() => props.onLayerVisibility({ kind: "hide-all" })}
          >
            <Layers2 />
          </IconControl>
          <IconControl
            label="Ebenensichtbarkeit umkehren"
            onClick={() => props.onLayerVisibility({ kind: "invert" })}
          >
            <Contrast />
          </IconControl>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
          <IconControl
            label="Ebenensichtbarkeit rückgängig"
            disabled={!props.canUndoVisibility}
            onClick={() => props.onLayerVisibility({ kind: "undo" })}
          >
            <Undo2 />
          </IconControl>
          <IconControl
            label="Ebenensichtbarkeit wiederholen"
            disabled={!props.canRedoVisibility}
            onClick={() => props.onLayerVisibility({ kind: "redo" })}
          >
            <Redo2 />
          </IconControl>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <IconControl
            label="Project navigator"
            active={props.navigatorOpen}
            onClick={props.onNavigator}
          >
            <PanelRightOpen />
          </IconControl>
          <IconControl label="Settings" onClick={props.onCanvasDisplay}>
            <Settings />
          </IconControl>
          <Button variant="ghost" size="icon" className="size-8" aria-label="User profile">
            <span className="flex size-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary">
              CN
            </span>
          </Button>
          <Button variant="ghost" size="icon" className="size-8 xl:hidden" aria-label="Menu">
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  );
});
