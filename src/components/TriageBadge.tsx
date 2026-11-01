import type { BoardPriority } from "@/lib/status";

export function TriageBadge({
  priority,
  compact = false,
}: {
  priority: BoardPriority;
  compact?: boolean;
}) {
  return (
    <span
      className="status-pill"
      data-colour={priority.colour}
      title={`${priority.label} — illustrative board category, not a clinical triage assignment`}
    >
      {compact ? priority.shortLabel : priority.label}
    </span>
  );
}
