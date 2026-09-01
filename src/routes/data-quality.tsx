import { createFileRoute } from "@tanstack/react-router";
import { Activity, CircleAlert, Clock, Radio } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { FilterBar } from "@/components/common/FilterBar";
import { KpiCard } from "@/components/common/KpiCard";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { AlertsPanel } from "@/components/common/AlertsPanel";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CHART_COLORS, TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { useFilters, useSafeRange } from "@/context/FilterContext";
import { getDailyData, getDashboardAlerts, getDataQuality } from "@/services/dataService";
import { formatLongDate, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/data-quality")({
  head: () => ({
    meta: [
      { title: "Data Quality — Smart Rehabilitation Analytics" },
      {
        name: "description",
        content:
          "Sensor health, communication status, data completeness and missing-data monitoring for the ESP32-ready rehabilitation insole prototype.",
      },
      { property: "og:title", content: "Data Quality — Smart Rehabilitation Analytics" },
      {
        property: "og:description",
        content: "Sensor status, uptime and data completeness monitoring for the rehabilitation monitoring prototype.",
      },
    ],
  }),
  component: DataQualityPage,
});

const SENSOR_TONE = { online: "online", degraded: "warning", offline: "offline" } as const;

function DataQualityPage() {
  const { patientId } = useFilters();
  const range = useSafeRange();
  const quality = getDataQuality(patientId, range);
  const rows = getDailyData(patientId, range);
  const alerts = getDashboardAlerts(patientId, range);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Quality & Device Health"
        subtitle="Engineering view of the monitoring chain: sensor state, wireless communication, uptime and completeness of the recorded data."
      />

      <FilterBar showDate />

      {!rows.length ? (
        <EmptyState
          title="No records to assess"
          message="Data quality is computed from the records inside the selected range. Widen the range to see metrics."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Data Completeness"
              value={formatNumber(quality.completeness, 1)}
              unit="%"
              icon={Activity}
              tone="success"
              hint={`${quality.records} records assessed`}
            />
            <KpiCard
              label="Missing Data"
              value={formatNumber(quality.missingPercent, 1)}
              unit="%"
              icon={CircleAlert}
              tone="warning"
            />
            <KpiCard label="Device Uptime" value={quality.deviceUptime} icon={Clock} />
            <KpiCard
              label="Sensor Errors"
              value={formatNumber(quality.sensorErrors)}
              icon={Radio}
              tone="accent"
              hint="Count across the selected range"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={quality.communication === "connected" ? "online" : quality.communication === "intermittent" ? "warning" : "offline"}
              label={`Communication: ${quality.communication}`}
            />
            <StatusBadge tone="info" label={`Last data received: ${quality.lastDataReceived}`} />
            <StatusBadge
              tone={quality.energyStatus === "Good" ? "online" : quality.energyStatus === "Moderate" ? "warning" : "offline"}
              label={`Energy status: ${quality.energyStatus}`}
            />
          </div>

          <SectionCard
            title="Sensor Status"
            description="Per-sensor state for the smart insole. Hardware readings will replace these demo states once the ESP32 firmware streams live data."
            bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {quality.sensors.map((sensor) => (
              <div key={sensor.id} className="rounded-xl border border-border bg-surface p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-card-foreground">{sensor.label}</p>
                  <StatusBadge tone={SENSOR_TONE[sensor.state]} label={sensor.state} />
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{sensor.detail}</p>
              </div>
            ))}
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="Completeness per Day"
              description="Share of expected samples that were successfully aggregated each day."
            >
              <TimeSeriesChart
                data={rows}
                yLabel="Completeness (%)"
                variant="area"
                series={[{ key: "data_completeness", label: "Completeness (%)", color: CHART_COLORS.success }]}
              />
            </SectionCard>

            <SectionCard
              title="Completeness vs Activity"
              description="Low activity days usually produce fewer samples in the demo model."
            >
              <TimeSeriesChart
                data={rows}
                yLabel="Value"
                series={[
                  { key: "data_completeness", label: "Completeness (%)", color: CHART_COLORS.success },
                  { key: "activity_minutes", label: "Activity (min)", color: CHART_COLORS.accent },
                ]}
              />
            </SectionCard>
          </div>

          <AlertsPanel alerts={alerts} />

          <SectionCard
            title="Communication Log"
            description="Last aggregated packet timestamp per day, as the ESP32 would report it."
            bodyClassName="space-y-1.5"
          >
            {[...rows]
              .slice(-10)
              .reverse()
              .map((row) => (
                <div
                  key={row.date}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-[11px]"
                >
                  <span className="text-muted-foreground">{formatLongDate(row.date)}</span>
                  <span className="text-card-foreground">{row.last_sample_at.replace("T", " ")}</span>
                  <span className="text-muted-foreground">{formatNumber(row.data_completeness, 1)}% complete</span>
                </div>
              ))}
          </SectionCard>
        </>
      )}
    </div>
  );
}
