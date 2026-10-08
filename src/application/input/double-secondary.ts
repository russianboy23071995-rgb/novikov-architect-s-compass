export type SecondaryClick = {
  key: string;
  context: object;
  x: number;
  y: number;
  time: number;
};
/** Single shared gesture, scoped to the current viewport interaction context. */
export function createDoubleSecondaryClick() {
  let previous: SecondaryClick | null = null;
  return {
    reset() {
      previous = null;
    },
    click(next: SecondaryClick) {
      const old = previous;
      previous = next;
      if (
        old &&
        old.key === next.key &&
        old.context === next.context &&
        next.time >= old.time &&
        next.time - old.time <= 450 &&
        Math.hypot(next.x - old.x, next.y - old.y) <= 6
      ) {
        previous = null;
        return true;
      }
      return false;
    },
  };
}
