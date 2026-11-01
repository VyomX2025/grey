import { notFound } from "next/navigation";
import { PatientDetailClient } from "@/components/PatientDetailClient";
import {
  getAlerts,
  getBoardPriority,
  getDecisions,
  getHistory,
  getObservations,
  getPatient,
  getStore,
} from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ filter?: string; q?: string }>;
};

export default async function PatientPage({ params, searchParams }: Props) {
  const { patientId } = await params;
  const sp = await searchParams;
  const patient = getPatient(patientId);
  if (!patient) notFound();

  const observations = getObservations(patientId);
  const alerts = getAlerts(patientId);
  const decisions = getDecisions(patientId);
  const history = getHistory(patientId);
  const remainingScripted =
    (getStore().scriptedSequences[patientId]?.length ?? 0) -
    (getStore().simulationCursor[patientId] ?? 0);

  const qs = new URLSearchParams();
  if (sp.filter) qs.set("filter", sp.filter);
  if (sp.q) qs.set("q", sp.q);
  const backHref = qs.toString() ? `/?${qs}` : "/";

  return (
    <PatientDetailClient
      patient={patient}
      boardPriority={getBoardPriority(patientId)}
      observations={observations}
      alerts={alerts}
      decisions={decisions}
      history={history}
      historyEmptyMessage={
        history.length === 0
          ? "No synthetic historical records are seeded for this patient."
          : undefined
      }
      remainingScripted={remainingScripted}
      backHref={backHref}
    />
  );
}
