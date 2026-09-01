import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/AppShell";
import { FilterBar } from "@/components/common/FilterBar";
import { KpiCard } from "@/components/common/KpiCard";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { ExportButtons } from "@/components/common/ExportButtons";
import { CHART_COLORS, TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { useFilters, useSafeRange } from "@/context/FilterContext";
import { getPatientReports } from "@/services/dataService";
import { formatLongDate, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Patient Reports — Self-Powered Edge-AI Rehabilitation Companion" },
      {
        name: "description",
        content:
          "Self-reported pain, anxiety, mood, appetite and sleep score trends recorded alongside sensor data in the rehabilitation prototype.",
      },
      { property: "og:title", content: "Patient Reports — Self-Powered Edge-AI Rehabilitation Companion" },
      {
        property: "og:description",
        content: "Self-reported wellbeing score trends for the smart rehabilitation monitoring prototype.",
      },
    ],
  }),
  component: PatientReportsPage,
});

const SCORES = [
  { key: "pain_score", label: "Pain", color: CHART_COLORS.warning },
  { key: "anxiety_score", label: "Anxiety", color: CHART_COLORS.violet },
  { key: "depression_score", label: "Low mood", color: CHART_COLORS.accent },
  { key: "appetite_score", label: "Appetite", color: CHART_COLORS.success },
  { key: "sleep_score", label: "Sleep", color: CHART_COLORS.primary },
  { key: "general_condition_score", label: "General condition", color: CHART_COLORS.success },
] as const;

function PatientReportsPage() {
  const { patientId, patient } = useFilters();
  const range = useSafeRange();
  const rows = getPatientReports(patientId, range);
  const latest = rows[rows.length - 1];

  const average = (key: (typeof SCORES)[number]["key"]) =>
    rows.length ? rows.reduce((sum, row) => sum + row[key], 0) / rows.length : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Patient Reports"
        subtitle={`Self-reported scores entered by ${patient?.alias ?? "the patient"} on a 0–100 prototype scale. These are subjective inputs, not validated clinical questionnaires.`}
        actions={<ExportButtons rows={rows} patientId={patientId} context="reports" />}
      />

      <FilterBar showDate />

      {!rows.length || !latest ? (
        <EmptyState
          title="No self-reported entries"
          message="No demo self-report records exist for the selected patient and date range."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SCORES.map((score) => (
              <KpiCard
                key={score.key}
                label={`${score.label} (latest)`}
                value={formatNumber(latest[score.key])}
                unit="/100"
                hint={`Range average ${formatNumber(average(score.key), 1)}`}
                tone={score.key === "pain_score" ? "warning" : "default"}
              />
            ))}
          </div>

          <SectionCard
            title="Self-Reported Score Trends"
            description="All six prototype scores over the selected range. Trends describe what the patient reported and nothing more."
          >
            <TimeSeriesChart
              data={rows}
              yLabel="Score (0-100)"
              height={340}
              series={SCORES.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
            />
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard title="Pain vs Sleep" description="Two of the most frequently reported rehabilitation inputs.">
              <TimeSeriesChart
                data={rows}
                yLabel="Score (0-100)"
                variant="area"
                series={[
                  { key: "pain_score", label: "Pain", color: CHART_COLORS.warning },
                  { key: "sleep_score", label: "Sleep", color: CHART_COLORS.primary },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="General Condition vs Activity"
              description="Self-reported wellbeing plotted with recorded activity duration."
            >
              <TimeSeriesChart
                data={rows}
                yLabel="Value"
                series={[
                  { key: "general_condition_score", label: "General condition", color: CHART_COLORS.success },
                  { key: "activity_minutes", label: "Activity (min)", color: CHART_COLORS.accent },
                ]}
              />
            </SectionCard>
          </div>

          <SectionCard
            title="Latest Report Detail"
            description={`Entries recorded for ${formatLongDate(latest.date)}.`}
          >
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SCORES.map((score) => (
                <div key={score.key} className="rounded-xl border border-border bg-surface p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{score.label}</dt>
                  <dd className="mt-1 text-sm font-medium text-card-foreground">
                    {formatNumber(latest[score.key])} / 100
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Self-reported values are shown as recorded. The dashboard does not interpret them clinically.
            </p>
          </SectionCard>
        </>
      )}
    </div>
  );
}
