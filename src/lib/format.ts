const TZ = "Asia/Kolkata";

const tsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const clockFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // e.g. 28 Oct 2026, 13:30 (Asia/Kolkata, 24-hour)
  return tsFormatter.format(d);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return timeFormatter.format(d);
}

export function formatClock(date: Date = new Date()): string {
  return clockFormatter.format(date).replace(",", "");
}

export function formatWaiting(arrivalAt: string, nowIso: string): string {
  const arrival = new Date(arrivalAt).getTime();
  const now = new Date(nowIso).getTime();
  if (Number.isNaN(arrival) || Number.isNaN(now)) return "—";
  const mins = Math.max(0, Math.round((now - arrival) / 60_000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

export function formatVital(
  value: number | null | undefined,
  unit: string,
  digits = 0
): string {
  if (value === null || value === undefined) return "— missing";
  const n = value.toFixed(digits);
  return unit ? `${n} ${unit}` : n;
}

export function formatSex(sex: string): string {
  switch (sex) {
    case "male":
      return "M";
    case "female":
      return "F";
    case "other":
      return "X";
    default:
      return "U";
  }
}

export function delta(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current === null || current === undefined) return null;
  if (previous === null || previous === undefined) return null;
  return current - previous;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "stable":
      return "Stable";
    case "review_needed":
      return "Review needed";
    case "alert_acknowledged":
      return "Review acknowledged";
    case "alert_overridden":
      return "Review overridden";
    case "awaiting_observation":
      return "Awaiting observation";
    case "missing_data":
      return "Missing data";
    case "active":
      return "Active";
    case "confirmed":
      return "Confirmed";
    case "overridden":
      return "Overridden";
    default:
      return status;
  }
}
