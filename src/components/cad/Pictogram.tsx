import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ToolIconProps } from "./tool-icons";

/**
 * Pictograms of the tool rail, the constructions and the navigator (docs/WERKZEUGLEISTE.md, WL3;
 * package in assets/piktogramme): line art on the 24 px grid in two states. Inactive: line with
 * a light duotone face, in the text colour. Active: the face filled, inner lines left out, in
 * `--pikto-aktiv` (turquoise, darker on light surfaces).
 */
const files = import.meta.glob<string>("../../assets/piktogramme/*/*/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type PictogramGroup = "werkzeuge" | "navigator";

const source = (group: PictogramGroup, name: string, active: boolean) =>
  files[`../../assets/piktogramme/${active ? "aktiv" : "inaktiv"}/${group}/${name}.svg`];

/** The file's markup made fit for inline use: no title (the control names itself), sized by the
 * surrounding element, and mask ids unique per instance, so several pictograms never share one. */
function inline(markup: string, uid: string) {
  return markup
    .replace(/<title>[\s\S]*?<\/title>\s*/g, "")
    .replace(
      /width="24" height="24"/,
      'width="100%" height="100%" aria-hidden="true" focusable="false"',
    )
    .replace(/id="([^"]+)"/g, (_m, id: string) => `id="${uid}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${uid}-${id})`);
}

export function Pictogram({
  group,
  name,
  active = false,
  tinted = true,
  className,
}: {
  group: PictogramGroup;
  name: string;
  active?: boolean;
  /** Active in the turquoise; false keeps the surrounding text colour (e.g. on a dark button). */
  tinted?: boolean;
  className?: string | undefined;
}) {
  const uid = "p" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const markup = source(group, name, active);
  const html = useMemo(() => (markup ? inline(markup, uid) : ""), [markup, uid]);
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0", className)}
      style={active && tinted ? { color: "var(--pikto-aktiv)" } : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Tool icons of the planned tools (WL3), for the places that take a plain tool icon. */
export function RoofWindowIcon({ className }: ToolIconProps) {
  return <Pictogram group="werkzeuge" name="dachflaechenfenster" className={className} />;
}
export function RailingIcon({ className }: ToolIconProps) {
  return <Pictogram group="werkzeuge" name="gelaender" className={className} />;
}
export function TerrainIcon({ className }: ToolIconProps) {
  return <Pictogram group="werkzeuge" name="gelaende" className={className} />;
}
