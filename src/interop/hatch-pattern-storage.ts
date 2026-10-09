import type { HatchPatternStorage } from "../application/hatches/pattern-library";
/** Project-independent within this browser profile/origin. Replaceable platform adapter. */
export const browserHatchPatternStorage: HatchPatternStorage = {
  read: () => window.localStorage.getItem("novikov.hatch-patterns.v1"),
  write: (value) => {
    window.localStorage.setItem("novikov.hatch-patterns.v1", value);
    window.dispatchEvent(new Event("novikov-hatch-patterns-changed"));
  },
};
