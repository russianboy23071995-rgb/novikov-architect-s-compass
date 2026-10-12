import type { PenStorage } from "../application/pens/library.ts";
export const browserPenStorage: PenStorage = {
  read: () => window.localStorage.getItem("novikov.pen-sets.v1"),
  write: (value) => {
    window.localStorage.setItem("novikov.pen-sets.v1", value);
    window.dispatchEvent(new Event("novikov-pen-sets-changed"));
  },
};
