/** Selection capability is broader than Direct Edit capability. */
export type ElementKind = "wall" | "window" | "line" | "hatch" | "reference";
export type ElementTarget = { [K in ElementKind]: { kind: K; id: string } }[ElementKind];
