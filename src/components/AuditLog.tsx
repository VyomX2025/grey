import { formatTs } from "@/lib/format";
import type { DecisionLogEntry } from "@/lib/types";
import { StatusPill } from "./StatusPill";

export function AuditLog({ decisions }: { decisions: DecisionLogEntry[] }) {
  if (decisions.length === 0) {
    return (
      <p className="text-sm text-grey-600">
        No clinician decisions recorded yet for this synthetic patient.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-grey-300 text-xs uppercase tracking-wide text-grey-500">
            <th className="px-2 py-2 font-semibold">Time</th>
            <th className="px-2 py-2 font-semibold">Action</th>
            <th className="px-2 py-2 font-semibold">Actor</th>
            <th className="px-2 py-2 font-semibold">Status</th>
            <th className="px-2 py-2 font-semibold">Rationale</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => (
            <tr key={d.id} className="border-b border-grey-200 align-top">
              <td className="px-2 py-2 whitespace-nowrap text-xs">
                {formatTs(d.timestamp)}
              </td>
              <td className="px-2 py-2 font-medium capitalize">{d.action}</td>
              <td className="px-2 py-2 text-xs">{d.actor}</td>
              <td className="px-2 py-2">
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <StatusPill status={d.previousAlertStatus} />
                  <span aria-hidden>→</span>
                  <StatusPill status={d.newAlertStatus} />
                </div>
              </td>
              <td className="px-2 py-2 text-xs text-grey-700">
                {d.rationale ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
