const styles: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

// The generated types pin the label to three values, but the badge renders
// whatever the live backend sends — a new severity must not come out unstyled
const NEUTRAL = "bg-gray-100 text-gray-700";

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
