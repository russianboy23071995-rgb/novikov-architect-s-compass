import { rasterBudgetWarning } from "@/domain/project/raster-budget";
import type { Project } from "@/domain/project/schema";
export function RasterBudgetNotice({ project }: { project: Project | undefined }) {
  const warning = project ? rasterBudgetWarning(project) : null;
  return warning ? (
    <p
      role="alert"
      className="rounded border border-amber-500/40 bg-amber-50 p-3 text-xs text-amber-950"
    >
      {warning}
    </p>
  ) : null;
}
