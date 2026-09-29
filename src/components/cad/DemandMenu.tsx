export function DemandMenu({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div
      id="Demand_menu"
      aria-label="Demand menu"
      data-testid="demand-menu"
      className="glass-panel-strong z-30 flex h-7 shrink-0 items-center gap-1 rounded-lg px-2"
    />
  );
}
