import type { LineStyleStorage } from "../application/lines/style-library";
/** Global across projects within this browser profile/origin. */
export const browserLineStyleStorage: LineStyleStorage = {
  read: () => window.localStorage.getItem("novikov.line-styles.v1"),
  write: (value) => window.localStorage.setItem("novikov.line-styles.v1", value),
};
