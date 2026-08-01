const styles: Record<string, string> = {
  Low: "bg-accent-surface-strong text-accent-ink-strong",
  Medium: "bg-warn-surface-strong text-warn-ink",
  High: "bg-danger-surface-strong text-danger-ink",
};

// The generated types pin the label to three values, but the badge renders
// whatever the live backend sends — a new severity must not come out unstyled
const NEUTRAL = "bg-n-100 text-n-700";

export function RiskBadge({ label }: { label: string }) {
  const known = label in styles;
  return (
    <span
      // Severity as data rather than colour, so tests assert the state and
      // leave the palette free to change
      data-risk={known ? label : "unknown"}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[label] ?? NEUTRAL}`}
    >
      {label} risk
    </span>
  );
}
