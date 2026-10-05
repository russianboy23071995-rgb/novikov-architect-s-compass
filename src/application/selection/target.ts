/** Selection capability is broader than Direct Edit capability. */
export type ElementKind = "wall" | "window" | "line" | "hatch";
export type ElementTarget = { [K in ElementKind]: { kind: K; id: string } }[ElementKind];
