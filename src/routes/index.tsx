import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Battery,
  Footprints,
  Gauge,
  MapPin,
  Ruler,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { FilterBar } from "@/components/common/FilterBar";
import { KpiCard } from "@/components/common/KpiCard";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { AlertsPanel } from "@/components/common/AlertsPanel";
import { ExportButtons } from "@/components/common/ExportButtons";
import { MultimodalDiagram } from "@/components/common/MultimodalDiagram";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CHART_COLORS, TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { useFilters, useSafeRange } from "@/context/FilterContext";
import {
  getDailyData,
  getDashboardAlerts,
  getDataQuality,
  getEnergyData,
  getGaitData,
} from "@/services/dataService";
import { formatMetric, formatNumber, formatShortDate } from "@/utils/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Smart Rehabilitation Analytics" },
      {
        name: "description",
        content:
          "Edge-AI rehabilitation monitoring overview: gait KPIs, energy harvesting, patient-reported scores and data quality from fictional demo data.",
      },
      { property: "og:title", content: "Dashboard — Smart Rehabilitation Analytics" },
      {
        property: "og:description",
        content:
          "Monitoring overview for the self-powered smart-insole rehabilitation prototype. Demo data, no medical diagnosis.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { patientId, patient } = useFilters();
  const range = useSafeRange();

  const rows = getDailyData(patientId, range);
  const gait = getGaitData(patientId, range);
  const energy = getEnergyData(patientId, range);
  const quality = getDataQuality(patientId, range);
  const alerts = getDashboardAlerts(patientId, range);
  const latest = rows[rows.length - 1];

  const trend = (key: string) => gait.trends.find((t) => t.key === key);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rehabilitation Monitoring Overview"
        subtitle={
          patient
            ? `${patient.patient_id} · ${patient.alias} · ${patient.rehab_program} · focus limb ${patient.focus_limb}`
            : "Select a demo patient to begin."
        }
        actions={<ExportButtons rows={rows} patientId={patientId} context="dashboard" />}
      />

      <FilterBar showDate />

      {!rows.length || !latest ? (
        <EmptyState
          title="No demo records for these filters"
          message="Widen the date range or choose a different demo patient. The dashboard never depends on hardware being connected."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="online" label={`Latest record: ${formatShortDate(latest.date)}`} />
            <StatusBadge
              tone={quality.communication === "connected" ? "online" : "warning"}
              label={`Communication: ${quality.communication}`}
            />
            <StatusBadge
              tone={energy.status === "Good" ? "online" : energy.status === "Moderate" ? "warning" : "offline"}
              label={`Energy Status: ${energy.status} (prototype threshold)`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Steps"
              value={formatNumber(latest.steps)}
              icon={Footprints}
              changePercent={trend("steps")?.changePercent}
              direction={trend("steps")?.direction}
              hint="Latest day in range"
            />
            <KpiCard
              label="Walking Distance"
              value={formatNumber(latest.distance_km, 2)}
              unit="km"
              icon={MapPin}
              tone="accent"
              changePercent={trend("distance_km")?.changePercent}
              direction={trend("distance_km")?.direction}
            />
            <KpiCard
              label="Average Gait Speed"
              value={formatNumber(gait.averages.gait_speed, 2)}
              unit="m/s"
              icon={Gauge}
              changePercent={trend("gait_speed")?.changePercent}
              direction={trend("gait_speed")?.direction}
              hint={`Range average over ${gait.windowDays} days`}
            />
            <KpiCard
              label="Average Stride Length"
              value={formatNumber(gait.averages.stride_length_cm, 1)}
              unit="cm"
              icon={Ruler}
              tone="accent"
              changePercent={trend("stride_length_cm")?.changePercent}
              direction={trend("stride_length_cm")?.direction}
            />
            <KpiCard
              label="Gait Asymmetry"
              value={formatNumber(gait.averages.gait_asymmetry, 1)}
              unit="%"
              icon={Activity}
              changePercent={trend("gait_asymmetry")?.changePercent}
              direction={trend("gait_asymmetry")?.direction}
              hint="Left/right difference — descriptive only"
            />
            <KpiCard
              label="Activity Duration"
              value={formatNumber(latest.activity_minutes)}
              unit="min"
              icon={Timer}
              changePercent={trend("activity_minutes")?.changePercent}
              direction={trend("activity_minutes")?.direction}
            />
            <KpiCard
              label="Energy Harvested"
              value={formatNumber(latest.energy_harvested_mj, 2)}
              unit="mJ"
              icon={Battery}
              tone="warning"
              hint={`Average ${energy.averageDaily} mJ/day`}
            />
            <KpiCard
              label="Data Completeness"
              value={formatNumber(quality.completeness, 1)}
              unit="%"
              icon={ShieldCheck}
              tone="success"
              hint={`${quality.records} records · ${quality.missingPercent}% missing`}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            All values above are demonstration values generated from fictional demo data. They are not real patient
            measurements.
          </p>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="Activity Overview"
              description="Steps and walking distance recorded per day within the selected range."
            >
              <TimeSeriesChart
                data={rows}
                yLabel="Steps"
                variant="area"
                series={[{ key: "steps", label: "Steps", color: CHART_COLORS.primary }]}
              />
            </SectionCard>

            <SectionCard
              title="Gait Speed & Stride Length"
              description="Descriptive gait parameters derived from insole pressure and IMU demo streams."
            >
              <TimeSeriesChart
                data={rows}
                yLabel="Value"
                series={[
                  { key: "gait_speed", label: "Gait speed (m/s)", color: CHART_COLORS.primary },
                  { key: "gait_asymmetry", label: "Gait asymmetry (%)", color: CHART_COLORS.accent },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Energy Harvesting"
              description="Harvested vs consumed energy for the selected monitoring window."
            >
              <TimeSeriesChart
                data={rows}
                yLabel="mJ"
                variant="bar"
                series={[
                  { key: "energy_harvested_mj", label: "Harvested (mJ)", color: CHART_COLORS.warning },
                  { key: "energy_consumed_mj", label: "Consumed (mJ)", color: CHART_COLORS.accent },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Self-Reported Scores"
              description="Prototype 0–100 self-reported scores. Self-reported values only — not clinical instruments."
            >
              <TimeSeriesChart
                data={rows}
                yLabel="Score (0-100)"
                series={[
                  { key: "pain_score", label: "Pain", color: CHART_COLORS.warning },
                  { key: "sleep_score", label: "Sleep", color: CHART_COLORS.primary },
                  { key: "general_condition_score", label: "General condition", color: CHART_COLORS.success },
                ]}
              />
            </SectionCard>
          </div>

          <AlertsPanel alerts={alerts} />

          <SectionCard
            title="Multimodal Analytics & Edge Data Fusion"
            description="How gait, activity, self-reported and energy data are combined in the proposed architecture."
          >
            <MultimodalDiagram />
          </SectionCard>

          <SectionCard title="Latest Day Snapshot" description={`Aggregated demo record for ${latest.date}.`}>
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Steps", formatNumber(latest.steps)],
                ["Distance", formatMetric(latest.distance_km, "km", 2)],
                ["Gait speed", formatMetric(latest.gait_speed, "m/s", 2)],
                ["Stride length", formatMetric(latest.stride_length_cm, "cm", 1)],
                ["Gait asymmetry", formatMetric(latest.gait_asymmetry, "%", 1)],
                ["Activity", formatMetric(latest.activity_minutes, "min")],
                ["Energy stored", formatMetric(latest.energy_stored_mj, "mJ", 2)],
                ["Last sample", latest.last_sample_at.replace("T", " ")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-surface p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-card-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </>
      )}
    </div>
  );
}
