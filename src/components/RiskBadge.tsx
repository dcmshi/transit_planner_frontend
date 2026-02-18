const styles = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

export function RiskBadge({ label }: { label: "Low" | "Medium" | "High" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[label]}`}>
      {label} risk
    </span>
  );
}
