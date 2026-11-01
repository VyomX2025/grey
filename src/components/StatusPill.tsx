import { statusLabel } from "@/lib/format";

function colourFor(status: string): string {
  switch (status) {
    case "review_needed":
    case "active":
      return "amber";
    case "alert_acknowledged":
    case "confirmed":
      return "yellow";
    case "alert_overridden":
    case "overridden":
      return "grey";
    case "stable":
      return "green";
    default:
      return "grey";
  }
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="status-pill" data-colour={colourFor(status)} data-status={status}>
      {statusLabel(status)}
    </span>
  );
}
