export type Box2 = { minX: number; minY: number; maxX: number; maxY: number };
type Entry<T> = { box: Box2; value: T };
type Node<T> = { box: Box2; entries?: Entry<T>[]; left?: Node<T>; right?: Node<T> };
const overlaps = (a: Box2, b: Box2) =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
function valid(box: Box2) {
  if (!Object.values(box).every(Number.isFinite) || box.minX > box.maxX || box.minY > box.maxY)
    throw new Error("Invalid spatial bounds");
}
/** Static, median-split AABB tree. Values are opaque source keys; geometry owns no BIM types. */
export function createBoxIndex<T>(input: readonly Entry<T>[]) {
  function build(
    entries: (Entry<T> & { centerX: number; centerY: number })[],
  ): Node<T> | undefined {
    if (!entries.length) return undefined;
    // Accumulate into one owned bounds object instead of allocating one per
    // entry at every tree depth. Never mutate the caller's input bounds.
    const box = { ...entries[0]!.box };
    for (let i = 1; i < entries.length; i++) {
      const next = entries[i]!.box;
      box.minX = Math.min(box.minX, next.minX);
      box.minY = Math.min(box.minY, next.minY);
      box.maxX = Math.max(box.maxX, next.maxX);
      box.maxY = Math.max(box.maxY, next.maxY);
    }
    if (entries.length <= 8) return { box, entries };
    const x = box.maxX - box.minX >= box.maxY - box.minY;
    entries.sort((a, b) => (x ? a.centerX - b.centerX : a.centerY - b.centerY));
    const middle = Math.floor(entries.length / 2);
    return { box, left: build(entries.slice(0, middle))!, right: build(entries.slice(middle))! };
  }
  const root = build(
    input.map((e) => {
      valid(e.box);
      return {
        box: { ...e.box },
        value: e.value,
        centerX: e.box.minX / 2 + e.box.maxX / 2,
        centerY: e.box.minY / 2 + e.box.maxY / 2,
      };
    }),
  );
  return Object.freeze({
    query(box: Box2): T[] {
      valid(box);
      const result: T[] = [];
      function visit(node?: Node<T>) {
        if (!node || !overlaps(node.box, box)) return;
        if (node.entries)
          for (const e of node.entries) {
            if (overlaps(e.box, box)) result.push(e.value);
          }
        else {
          visit(node.left);
          visit(node.right);
        }
      }
      visit(root);
      return result;
    },
  });
}
