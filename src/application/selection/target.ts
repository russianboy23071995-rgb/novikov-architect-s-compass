import type { ElementKind } from "../../domain/elements/registry.ts";
export type { ElementKind } from "../../domain/elements/registry.ts";

/** Selection capability is broader than Direct Edit capability. */
export type ElementTarget = { [K in ElementKind]: { kind: K; id: string } }[ElementKind];
