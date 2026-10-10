import type { VisibilityAction } from "@/application/layers/visibility-actions";
import {
  Ruler,
  EyeOff,
  Focus,
  Layers2,
  Contrast,
  Bot,
  Box,
  Check,
  Grid3X3,
  LayoutGrid,
  Menu,
  Mic,
  PanelRightOpen,
  PanelTop,
  Redo2,
  Rotate3D,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ViewMode, ViewportLayout } from "./cad-types";

const layouts: { id: ViewportLayout; label: string; cells: string }[] = [
  { id: "single", label: "Single View", cells: "▣" },
  { id: "horizontal", label: "2 Views Horizontal", cells: "⬒" },
  { id: "vertical", label: "2 Views Vertical", cells: "◫" },
  { id: "three", label: "3 Views", cells: "▦" },
  { id: "four", label: "4 Views", cells: "田" },
];

type TopToolbarProps = {
  onPenSets: () => void;
  onLineCreator: () => void;
  onHatchLibrary: () => void;
  onMeasure: () => void;
  measuring: boolean;
  onImportImage: () => void;
  onCanvasDisplay: () => void;
  mode: ViewMode;
  layout: ViewportLayout;
  grid: boolean;
  snap: boolean;
  navigatorOpen: boolean;
  demandOpen: boolean;
  onMode: (mode: ViewMode) => void;
  onLayout: (layout: ViewportLayout) => void;
  onGrid: () => void;
  onSnap: () => void;
  onNavigator: () => void;
  onDemand: () => void;
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
  onLayers: () => void;
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
}: {
  label: string;
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
            active && "bg-primary/15 text-primary",
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function TopToolbar(props: TopToolbarProps) {
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
            <div className="truncate text-[11px] text-muted-foreground">BIM Project · Level 01</div>
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
                    className="h-7 px-2 text-[12px] font-normal text-muted-foreground"
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
            ) : item === "Tools" ? (
              <DropdownMenu key={item}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[12px] font-normal text-muted-foreground"
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
                    className="h-7 px-2 text-[12px] font-normal text-muted-foreground"
                  >
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={props.onCanvasDisplay}>
                    Canvas-Darstellung…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                key={item}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[12px] font-normal text-muted-foreground"
                onClick={() => props.onAction(`${item} menu`)}
              >
                {item}
              </Button>
            ),
          )}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0 text-xs">
              Organisation
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={props.onLayers}>Ebenen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-0.5 border-r border-border pr-2">
          <IconControl label="Messen" onClick={props.onMeasure} active={props.measuring}>
            <Ruler className="size-4" />
          </IconControl>
          <IconControl label="Undo" onClick={props.onUndo} disabled={!props.canUndo}>
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
          <div className="flex h-8 items-center rounded-md border border-border bg-background/30 p-0.5 shadow-[inset_0_1px_0_var(--glass-highlight)] backdrop-blur-xl">
            {(["2D", "3D"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant="ghost"
                size="sm"
                onClick={() => props.onMode(mode)}
                className={cn(
                  "h-6 rounded-sm px-2 text-[11px]",
                  props.mode === mode &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                )}
              >
                {mode === "2D" ? <Grid3X3 /> : <Box />}
                {mode}
              </Button>
            ))}
          </div>
          <DropdownMenu>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    aria-label="Viewport layout"
                  >
                    <LayoutGrid />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Viewport layout</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Viewport layout</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {layouts.map((layout) => (
                <DropdownMenuItem
                  key={layout.id}
                  onClick={() => props.onLayout(layout.id)}
                  className="text-xs"
                >
                  <span className="w-5 font-mono text-primary">{layout.cells}</span>
                  {layout.label}
                  {props.layout === layout.id && <Check className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <IconControl label="Orbit view" onClick={() => props.onAction("Orbit mode")}>
            <Rotate3D />
          </IconControl>
          <IconControl label="Grid" active={props.grid} onClick={props.onGrid}>
            <Grid3X3 />
          </IconControl>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 text-[11px] text-muted-foreground",
              props.snap && "bg-primary/15 text-primary",
            )}
            onClick={props.onSnap}
          >
            SNAP
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
          <IconControl
            label="NOVIKOV AI"
            onClick={() => props.onAction("Lokale Modellbefehle: unten eingeben und prüfen")}
          >
            <Bot />
          </IconControl>
          <IconControl
            label="Voice command"
            onClick={() =>
              props.onAction(
                "Bauteil auswählen und Mikrofon in der Befehlsleiste starten, sofern vom Browser unterstützt",
              )
            }
          >
            <Mic />
          </IconControl>
          <IconControl
            label="Project navigator"
            active={props.navigatorOpen}
            onClick={props.onNavigator}
          >
            <PanelRightOpen />
          </IconControl>
          <IconControl label="Demand menu" active={props.demandOpen} onClick={props.onDemand}>
            <PanelTop />
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
}
