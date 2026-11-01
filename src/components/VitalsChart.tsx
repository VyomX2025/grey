"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTime, formatTs } from "@/lib/format";
import type { Alert, VitalObservation } from "@/lib/types";
import {
  alertObservationIdsForRules,
  toVitalChartData,
  type VitalChartKey,
  type VitalChartPoint,
} from "@/lib/vitals-chart-data";

interface ChartSeries {
  key: VitalChartKey;
  label: string;
  colour: string;
  triggeredRuleIds?: string[];
}

function renderDot(
  props: { cx?: number; cy?: number; payload?: VitalChartPoint },
  color: string,
  selectedId?: string | null,
  triggeredObservationIds: Set<string> = new Set()
) {
  const { cx = 0, cy = 0, payload } = props;
  const active = payload?.id === selectedId;
  const triggered = payload ? triggeredObservationIds.has(payload.id) : false;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={active || triggered ? 5 : 3}
      fill={triggered ? "#C62828" : active ? "#23483B" : color}
      stroke="#fff"
      strokeWidth={active || triggered ? 2 : 0}
    />
  );
}

function VitalTrajectory({
  title,
  unit,
  series,
  observations,
  alerts,
  selectedId,
}: {
  title: string;
  unit: string;
  series: ChartSeries[];
  observations: VitalObservation[];
  alerts: Alert[];
  selectedId?: string | null;
}) {
  const data = toVitalChartData(observations);
  const possibleKeys = new Set(series.map((item) => item.key));
  const relevantAlerts = alerts.filter((alert) =>
    alert.triggeredRules.some((rule) =>
      series.some((item) => item.triggeredRuleIds?.includes(rule.id))
    )
  );
  const triggerIdsByKey = new Map<VitalChartKey, Set<string>>(
    series.map((item) => [
      item.key,
      alertObservationIdsForRules(relevantAlerts, item.triggeredRuleIds ?? []),
    ])
  );
  const enoughData = series.some(
    (item) => new Set(data.filter((point) => point.values[item.key] !== null).map((point) => point.timestamp)).size >= 2
  );

  return (
    <section className="min-w-0 border border-[#D9DED8] bg-white p-2" aria-label={`${title} trajectory`}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold">{title}</h3>
        <span className="text-[9px] text-[#69736C]">{unit}</span>
      </div>
      {!enoughData ? (
        <p className="flex h-36 items-center justify-center px-2 text-center text-xs text-[#69736C]">At least two measured observations are needed to show a trajectory.</p>
      ) : (
        <div className="mt-1 h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECE7" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(timestamp: number) => formatTime(new Date(timestamp).toISOString())}
                tick={{ fontSize: 9, fill: "#69736C" }}
                stroke="#C8D0C8"
                minTickGap={24}
              />
              <YAxis tick={{ fontSize: 9, fill: "#69736C" }} stroke="#C8D0C8" width={38} />
              <Tooltip
                contentStyle={{ borderRadius: 0, border: "1px solid #D9DED8", fontSize: 11 }}
                labelFormatter={(timestamp) => formatTs(new Date(Number(timestamp)).toISOString())}
                formatter={(reading, label) => [reading === null || reading === undefined ? "Missing" : `${reading} ${unit}`, label]}
              />
              {relevantAlerts.map((alert) => (
                <ReferenceLine
                  key={alert.id}
                  x={new Date(alert.currentObservedAt).getTime()}
                  stroke="#C62828"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{ value: "Alert", position: "insideTopRight", fill: "#C62828", fontSize: 9 }}
                />
              ))}
              {series.filter((item) => possibleKeys.has(item.key)).map((item) => (
                <Line
                  key={item.key}
                  type="linear"
                  dataKey={`values.${item.key}`}
                  name={item.label}
                  stroke={item.colour}
                  strokeWidth={2}
                  connectNulls={false}
                  isAnimationActive={false}
                  dot={(props) => renderDot(props, item.colour, selectedId, triggerIdsByKey.get(item.key))}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function VitalsChart({
  observations,
  alerts,
  selectedId,
}: {
  observations: VitalObservation[];
  alerts: Alert[];
  selectedId?: string | null;
}) {
  const sorted = [...observations].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-[#5C616B]">No synthetic observations to chart.</p>
    );
  }

  const chartSeries: { title: string; unit: string; series: ChartSeries[] }[] = [
    { title: "Heart rate", unit: "bpm", series: [{ key: "heartRate", label: "Heart rate", colour: "#23483B" }] },
    { title: "Respiratory rate", unit: "breaths/min", series: [{ key: "respiratoryRate", label: "Respiratory rate", colour: "#D97706", triggeredRuleIds: ["rr_increase_8"] }] },
    { title: "Blood pressure", unit: "mmHg", series: [
      { key: "systolicBloodPressure", label: "Systolic", colour: "#C62828", triggeredRuleIds: ["sbp_decrease_25"] },
      { key: "diastolicBloodPressure", label: "Diastolic", colour: "#496D9B" },
    ] },
    { title: "Oxygen saturation", unit: "%", series: [{ key: "oxygenSaturation", label: "SpO₂", colour: "#27834A" }] },
    { title: "Temperature", unit: "°C", series: [{ key: "temperature", label: "Temperature", colour: "#8B5E34" }] },
  ];

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {chartSeries.map((chart) => (
          <VitalTrajectory
            key={chart.title}
            {...chart}
            observations={sorted}
            alerts={alerts}
            selectedId={selectedId}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-[#69736C]">Chronological observations · Asia/Kolkata · missing readings break the line · red markers identify rule-triggering observations. Demonstration rules are illustrative and unvalidated.</p>
    </div>
  );
}
