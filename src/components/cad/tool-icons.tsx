import type { ReactNode } from "react";

/** Props shared with the lucide icons of the tool rail. */
export type ToolIconProps = { className?: string; strokeWidth?: number };

/**
 * Own pictograms of the tool rail (docs/WERKZEUGLEISTE.md, WL2), drawn on the 24 px grid in the
 * line style of the other icons; colour follows the text colour.
 */
function icon(name: string, body: ReactNode) {
  function ToolIcon({ className, strokeWidth = 1.65 }: ToolIconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {body}
      </svg>
    );
  }
  ToolIcon.displayName = name;
  return ToolIcon;
}

/** A piece of wall in perspective: front face with brick courses, top and end face. */
export const WallIcon = icon(
  "WallIcon",
  <>
    <path d="M2 10h14v10H2z" />
    <path d="M2 10l3-3h14l-3 3" />
    <path d="M16 20l3-3V7" />
    <path d="M2 15h14M9 10v5M5.5 15v5M12.5 15v5" strokeWidth={1} />
  </>,
);

/** A slender column with base and head plate. */
export const ColumnIcon = icon(
  "ColumnIcon",
  <>
    <path d="M7 3h10v2H7zM7 19h10v2H7z" />
    <path d="M10 5v14M14 5v14" />
  </>,
);

/** A flight of stairs seen from the side: treads and risers, underside of the flight. */
export const StairIcon = icon(
  "StairIcon",
  <>
    <path d="M3 21v-4h4.5v-4H12V9h4.5V5H21" />
    <path d="M3 21h4L21 9.5V5" />
  </>,
);

/** A window: frame, mullion and transom, sill below. */
export const WindowIcon = icon(
  "WindowIcon",
  <>
    <path d="M4 3h16v15H4z" />
    <path d="M12 3v15M4 8h16" />
    <path d="M2.5 18h19l-.5 2.5H3z" />
  </>,
);

/** A floor slab in perspective: top face and its thickness. */
export const SlabIcon = icon(
  "SlabIcon",
  <>
    <path d="M2 11l8-5 12 3-8 5z" />
    <path d="M2 11v3l12 3 8-5V9M14 14v3" />
  </>,
);

/** A gable roof in perspective over the outline of the walls. */
export const RoofIcon = icon(
  "RoofIcon",
  <>
    <path d="M1.5 13.5L7 6l10.5-2.5 5 7.5" />
    <path d="M1.5 13.5H12.5L7 6M12.5 13.5l10-3.5" />
    <path d="M3 13.5V20h9v-6.5M12 20l9-3v-6.5" strokeWidth={1} />
  </>,
);

/** The section mark: dash-dot cut line, heavy ends and arrows towards the viewing side. */
export const SectionIcon = icon(
  "SectionIcon",
  <>
    <path d="M6.5 15h11" strokeDasharray="3.5 1.5 1 1.5" strokeWidth={1.5} strokeLinecap="butt" />
    <path d="M2 15h4M18 15h4" strokeWidth={2.4} />
    <path d="M4 15V9.5M20 15V9.5" />
    <path d="M1.8 10.2L4 6l2.2 4.2zM17.8 10.2L20 6l2.2 4.2z" fill="currentColor" />
  </>,
);
