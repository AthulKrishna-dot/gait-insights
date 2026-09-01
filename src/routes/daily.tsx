import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/AppShell";
import { FilterBar } from "@/components/common/FilterBar";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { ExportButtons } from "@/components/common/ExportButtons";
import { CHART_COLORS, TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { DailyRecordsTable } from "@/components/tables/DailyRecordsTable";
import { useFilters, useSafeRange } from "@/context/FilterContext";
import { getDailyData } from "@/services/dataService";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily Analytics — Smart Rehabilitation Analytics" },
      {
        name: "description",
        content:
          "Per-day rehabilitation analytics table and six filterable charts covering steps, distance, gait speed, stride length, asymmetry and activity duration.",
      },
      { property: "og:title", content: "Daily Analytics — Smart Rehabilitation Analytics" },
      {
        property: "og:description",
        content: "Filterable daily demo records and charts for the smart-insole rehabilitation prototype.",
      },
    ],
  }),
  component: DailyAnalyticsPage,
});

function DailyAnalyticsPage() {
  const { patientId } = useFilters();
  const range = useSafeRange();
  const rows = getDailyData(patientId, range);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daily Analytics"
        subtitle="Day-by-day demo records for the selected patient and date range. Every chart and table below reacts to the filters."
        actions={<ExportButtons rows={rows} patientId={patientId} context="daily" />}
      />

      <FilterBar showDate />

      {!rows.length ? (
        <EmptyState
          title="No daily records"
          message="No demo records fall inside the selected date range for this patient."
        />
      ) : (
        <>
          <SectionCard
            title="Daily Records"
            description={`${rows.length} aggregated demo records. Values are fictional demonstration data.`}
            bodyClassName="p-0 sm:p-0"
          >
            <DailyRecordsTable rows={rows} />
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Steps vs Date">
              <TimeSeriesChart
                data={rows}
                yLabel="Steps"
                variant="bar"
                series={[{ key: "steps", label: "Steps", color: CHART_COLORS.primary }]}
              />
            </SectionCard>
            <SectionCard title="Walking Distance vs Date">
              <TimeSeriesChart
                data={rows}
                yLabel="Distance (km)"
                variant="area"
                series={[{ key: "distance_km", label: "Distance (km)", color: CHART_COLORS.accent }]}
              />
            </SectionCard>
            <SectionCard title="Gait Speed vs Date">
              <TimeSeriesChart
                data={rows}
                yLabel="Gait speed (m/s)"
                series={[{ key: "gait_speed", label: "Gait speed (m/s)", color: CHART_COLORS.primary }]}
              />
            </SectionCard>
            <SectionCard title="Stride Length vs Date">
              <TimeSeriesChart
                data={rows}
                yLabel="Stride length (cm)"
                series={[{ key: "stride_length_cm", label: "Stride length (cm)", color: CHART_COLORS.success }]}
              />
            </SectionCard>
            <SectionCard title="Gait Asymmetry vs Date">
              <TimeSeriesChart
                data={rows}
                yLabel="Asymmetry (%)"
                variant="area"
                series={[{ key: "gait_asymmetry", label: "Gait asymmetry (%)", color: CHART_COLORS.warning }]}
              />
            </SectionCard>
            <SectionCard title="Activity Duration vs Date">
              <TimeSeriesChart
                data={rows}
                yLabel="Minutes"
                variant="bar"
                series={[{ key: "activity_minutes", label: "Activity minutes", color: CHART_COLORS.violet }]}
              />
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
