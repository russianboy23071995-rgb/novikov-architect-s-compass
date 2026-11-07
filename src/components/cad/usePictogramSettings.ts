import { useEffect, useState } from "react";
import {
  DEFAULT_PICTOGRAM_SETTINGS,
  parsePictogramSettings,
  pictogramVariables,
  type PictogramSettings,
} from "./pictogram-settings";

const key = "novikov.pictograms";

/** Pictogram display settings of this browser (docs/WERKZEUGLEISTE.md, WL4), applied at once as
 * CSS variables on the document root. Presentation preference only; never a project mutation. */
const sameSettings = (a: PictogramSettings, b: PictogramSettings) =>
  a.scale === b.scale &&
  a.activeLight === b.activeLight &&
  a.activeDark === b.activeDark &&
  a.line === b.line &&
  a.duotone === b.duotone;

export function usePictogramSettings() {
  const [settings, setState] = useState<PictogramSettings>(DEFAULT_PICTOGRAM_SETTINGS);
  useEffect(() => {
    try {
      setState(parsePictogramSettings(JSON.parse(localStorage.getItem(key) ?? "null")));
    } catch {
      /* Storage unavailable: retain the session default. */
    }
  }, []);
  useEffect(() => {
    const root = document.documentElement.style;
    for (const [name, value] of Object.entries(pictogramVariables(settings)))
      if (value === null) root.removeProperty(name);
      else root.setProperty(name, value);
  }, [settings]);
  const setSettings = (value: PictogramSettings) => {
    const next = parsePictogramSettings(value);
    // An equal value renders nothing (a colour picker repeats its value).
    setState((current) => (sameSettings(current, next) ? current : next));
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* Session preference remains usable. */
    }
  };
  return {
    pictograms: settings,
    setPictograms: setSettings,
    resetPictograms: () => setSettings(DEFAULT_PICTOGRAM_SETTINGS),
  };
}
