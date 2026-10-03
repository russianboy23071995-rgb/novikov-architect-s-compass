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
  function build(entries: Entry<T>[]): Node<T> | undefined {
    if (!entries.length) return undefined;
    const box = entries.reduce(
      (b, e) => ({
        minX: Math.min(b.minX, e.box.minX),
        minY: Math.min(b.minY, e.box.minY),
        maxX: Math.max(b.maxX, e.box.maxX),
        maxY: Math.max(b.maxY, e.box.maxY),
      }),
      { ...entries[0]!.box },
    );
    if (entries.length <= 8) return { box, entries };
    const x = box.maxX - box.minX >= box.maxY - box.minY;
    entries.sort((a, b) =>
      x
        ? a.box.minX / 2 + a.box.maxX / 2 - (b.box.minX / 2 + b.box.maxX / 2)
        : a.box.minY / 2 + a.box.maxY / 2 - (b.box.minY / 2 + b.box.maxY / 2),
    );
    const middle = Math.floor(entries.length / 2);
    return { box, left: build(entries.slice(0, middle))!, right: build(entries.slice(middle))! };
  }
  const root = build(
    input.map((e) => {
      valid(e.box);
      return { box: { ...e.box }, value: e.value };
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
