/**
 * Inline SVG icons, matching the ones already drawn by hand in RouteList and
 * RouteCard. They inherit currentColor and scale with the surrounding text,
 * which the emoji they replaced could do neither of.
 *
 * All are decorative: every icon here sits beside text that carries the same
 * meaning, so they stay hidden from assistive technology.
 */

interface IconProps {
  className?: string;
}

function Icon({ className = "h-4 w-4", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {children}
    </svg>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 3h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      />
    </Icon>
  );
}

export function BlockedIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M5.64 5.64 18.36 18.36" />
    </Icon>
  );
}

/** A dashed arrow, matching how walk legs are drawn on the map. */
export function WalkIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path strokeLinecap="round" strokeDasharray="3 3" d="M3 12h13" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 8 4 4-4 4" />
    </Icon>
  );
}
