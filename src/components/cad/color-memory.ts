import { useState } from "react";
import {
  OWN_COLORS,
  parseColorList,
  RECENT_COLORS,
  withOwn,
  withRecent,
} from "@/application/pens/palette";

const RECENT_KEY = "novikov.colors.recent";
const OWN_KEY = "novikov.colors.own";

function load(key: string, max: number): string[] {
  try {
    return parseColorList(JSON.parse(localStorage.getItem(key) ?? "null"), max);
  } catch {
    return [];
  }
}
function save(key: string, list: readonly string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* The lists stay for this session. */
  }
}

/** Recently used and own colours of this browser (docs/FARBEN.md, F2 and F4); never a project. */
export function useColorMemory() {
  const [recent, setRecent] = useState(() => load(RECENT_KEY, RECENT_COLORS));
  const [own, setOwn] = useState(() => load(OWN_KEY, OWN_COLORS));
  return {
    recent,
    own,
    used: (hex: string) => {
      const next = withRecent(load(RECENT_KEY, RECENT_COLORS), hex);
      setRecent(next);
      save(RECENT_KEY, next);
    },
    keep: (hex: string) => {
      const next = withOwn(own, hex);
      setOwn(next);
      save(OWN_KEY, next);
    },
    forget: (hex: string) => {
      const next = own.filter((c) => c !== hex);
      setOwn(next);
      save(OWN_KEY, next);
    },
  };
}
