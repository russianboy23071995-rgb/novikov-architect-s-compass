import { useCallback, useReducer } from "react";
import {
  createEditingState,
  editingReducer,
  type EditingEvent,
} from "@/application/direct-edit/controller";
import { loadPatternLibrary } from "@/application/hatches/pattern-library";
import { resolveProjectHatchPatterns } from "@/application/hatches/pattern-resolution";
import { browserHatchPatternStorage } from "@/interop/hatch-pattern-storage";
import type { Project } from "@/domain/project/schema";

function context() {
  if (typeof window === "undefined") return { patternRecords: [] };
  try {
    return { patternRecords: loadPatternLibrary(browserHatchPatternStorage).records };
  } catch {
    return {
      patternRecords: [],
      patternLibraryError:
        "Musterbibliothek konnte nicht geladen werden. Eingebettete Darstellung erhalten.",
    };
  }
}

/** Browser storage adapter; no library reads inside model reducers or geometry. */
export function useProjectEditing(initial: () => Project) {
  const [state, dispatch] = useReducer(editingReducer, undefined, () => {
    const project = initial(),
      library = context();
    const resolution = resolveProjectHatchPatterns(project, project, library.patternRecords);
    return {
      ...createEditingState(resolution.project),
      error:
        library.patternLibraryError ??
        (resolution.conflicts.length ? `Musterkonflikt: ${resolution.conflicts.join(", ")}` : ""),
    };
  });
  const send = useCallback((event: EditingEvent) => {
    dispatch(
      ["load-project", "project", "undo", "redo"].includes(event.type)
        ? { ...event, ...context() }
        : event,
    );
  }, []);
  return [state, send] as const;
}
