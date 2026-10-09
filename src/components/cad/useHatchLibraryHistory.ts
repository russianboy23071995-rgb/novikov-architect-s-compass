import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPatternHistory,
  createLibraryHatchPattern,
  editHatchPattern,
  undoHatchPattern,
  redoHatchPattern,
  type PatternHistory,
} from "@/application/hatches/pattern-history";
import type { HatchPatternDefinition } from "@/domain/elements/hatch/pattern";
import {
  browserHatchPatternStorage as storage,
  subscribeHatchPatterns,
} from "@/interop/hatch-pattern-storage";

/** Session library history survives closing the panel; external writes require explicit reload. */
export function useHatchLibraryHistory(open: boolean) {
  const [history, setHistory] = useState<PatternHistory | null>(null);
  const current = useRef<PatternHistory | null>(null);
  const publishing = useRef(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const install = useCallback((next: PatternHistory) => {
    current.current = next;
    setHistory(next);
  }, []);
  const check = useCallback(() => {
    if (publishing.current || !current.current) return;
    try {
      if (storage.read() !== current.current.token) {
        setStale(true);
        setError(
          "Bibliothek wurde außerhalb dieses Fensters geändert. Neu laden; der Entwurf bleibt erhalten.",
        );
      }
    } catch {
      setStale(true);
      setError("Bibliothek konnte nicht gelesen werden. Neu laden; der Entwurf bleibt erhalten.");
    }
  }, []);
  const reload = useCallback(() => {
    try {
      install(createPatternHistory(storage));
      setStale(false);
      setError("");
    } catch {
      setStale(true);
      setError(
        "Bibliothek konnte nicht geladen werden. Vorhandene Daten werden nicht überschrieben.",
      );
    }
  }, [install]);
  useEffect(() => {
    if (!open) return;
    if (!current.current) reload();
    else check();
  }, [open, reload, check]);
  useEffect(() => subscribeHatchPatterns(check), [check]);

  const run = (action: (history: PatternHistory) => PatternHistory) => {
    try {
      if (!current.current) throw new Error("Bibliothek zuerst neu laden.");
      publishing.current = true;
      const next = action(current.current);
      install(next);
      setError("");
      setStale(false);
      return next;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Bibliotheksaktion fehlgeschlagen.");
      return null;
    } finally {
      publishing.current = false;
      check();
    }
  };
  return {
    history,
    error,
    stale,
    reload,
    create: (definition: HatchPatternDefinition) =>
      run((h) => createLibraryHatchPattern(storage, h, definition)),
    edit: (id: string, revision: number, definition: HatchPatternDefinition) =>
      run((h) => editHatchPattern(storage, h, id, revision, definition)),
    undo: () => run((h) => undoHatchPattern(storage, h)),
    redo: () => run((h) => redoHatchPattern(storage, h)),
  };
}
