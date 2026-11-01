import { delta, formatVital } from "@/lib/format";

export function VitalValue({
  label,
  value,
  unit,
  digits = 0,
  previous,
  timestamp,
  highlight = false,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
  digits?: number;
  previous?: number | null;
  timestamp?: string;
  highlight?: boolean;
}) {
  const missing = value === null || value === undefined;
  const change = delta(value, previous);

  return (
    <div
      className={`border px-3 py-2 ${
        highlight ? "border-[#F7B27A] bg-[#FFF6ED]" : "border-[#D8DBE0] bg-[#F7F8FA]"
      }`}
    >
      <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#5C616B]">
        {label}
      </div>
      <div
        className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${
          missing ? "vital-missing text-base" : "text-[#17191D]"
        }`}
      >
        {formatVital(value, unit, digits)}
      </div>
      <div className="mt-1 text-xs text-[#5C616B]">
        {previous === undefined
          ? "Previous reading unavailable"
          : previous === null
            ? "Previous measurement missing"
            : `Prev ${formatVital(previous, unit, digits)}`}
        {previous !== undefined && change !== null && (
            <span className={`ml-2 font-semibold ${highlight ? "text-[#B54708]" : ""}`}>
              Δ {change > 0 ? "+" : ""}
              {change.toFixed(digits)}
            </span>
        )}
      </div>
      {timestamp && (
        <div className="mt-0.5 font-mono text-[10px] text-[#5C616B]">{timestamp}</div>
      )}
    </div>
  );
}
