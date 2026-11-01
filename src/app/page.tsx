import { Suspense } from "react";
import { LiveSituationOverview, RecentEvents } from "@/components/LiveSituationOverview";
import { PatientBoard } from "@/components/PatientBoard";
import { getDashboardSummary } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const summary = getDashboardSummary();
  return (
    <div className="space-y-5">
      <LiveSituationOverview summary={summary} />
      <Suspense fallback={<p className="text-sm text-[#5C616B]">Loading patient board…</p>}>
        <PatientBoard summary={summary} />
      </Suspense>
      <RecentEvents events={summary.recentEvents} />
    </div>
  );
}
