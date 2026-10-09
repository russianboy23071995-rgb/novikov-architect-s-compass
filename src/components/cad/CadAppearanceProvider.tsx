import type { ReactNode } from "react";
import type { PenSet } from "@/domain/pens/model";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PenColors } from "./PenColors";
export function CadAppearanceProvider({
  children,
  penSet,
  projectId,
}: {
  children: ReactNode;
  penSet: PenSet;
  projectId: string;
}) {
  return (
    <TooltipProvider>
      <PenColors key={projectId} set={penSet}>
        {children}
      </PenColors>
    </TooltipProvider>
  );
}
