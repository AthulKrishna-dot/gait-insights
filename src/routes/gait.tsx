import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/AppShell";
import { FilterBar } from "@/components/common/FilterBar";
import { KpiCard } from "@/components/common/KpiCard";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { ExportButtons } from "@/components/common/ExportButtons";
import { TrendPill } from "@/components/common/TrendPill";
import { CHART_COLORS, TimeSeriesChart, type SeriesConfig } from "@/components/charts/TimeSeriesChart";
import { ComparisonChart, type ComparisonRow } from "@/components/charts/ComparisonChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFilters, useSafeRange } from "@/context/FilterContext";
import { getGaitData, METRIC_META } from "@/services/dataService";
import { formatNumber } from "@/utils/format";
import type { DailyMetricKey } from "@/data/types";

export const Route = createFileRoute("/gait")({
  head: () => ({
    meta: [
      { title: "Gait Analysis — Self-Powered Edge-AI Rehabilitation Companion" },
      {
        name: "description",
        content:
          "Gait speed, stride length and left/right asymmetry trends with current-versus-previous period comparison, derived from smart-insole demo data.",
      },
      { property: "og:title", content: "Gait Analysis — Self-Powered Edge-AI Rehabilitation Companion" },
      {
        property: "og:description",
        content: "Descriptive gait parameter trends and period comparison for the rehabilitation prototype.",
      },
    ],
  }),
  component: GaitAnalysisPage,
});

const TOGGLES: { key: DailyMetricKey; color: string }[] = [
  { key: "gait_speed", color: CHART_COLORS.primary },
  { key: "stride_length_cm", color: CHART_COLORS.accent },
  { key: "gait_asymmetry", color: CHART_COLORS.warning },
  { key: "steps", color: CHART_COLORS.success },
];

function GaitAnalysisPage() {
  const { patientId, patient } = useFilters();
  const range = useSafeRange();
  const gait = getGaitData(patientId, range);

  const [active, setActive] = useState<DailyMetricKey[]>(["gait_speed", "stride_length_cm"]);

  const toggle = (key: DailyMetricKey) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const series: SeriesConfig[] = TOGGLES.filter((t) => active.includes(t.key)).map((t) => ({
    key: t.key,
    label: `${METRIC_META[t.key].label}${METRIC_META[t.key].unit ? ` (${METRIC_META[t.key].unit})` : ""}`,
    color: t.color,
  }));

  const comparison: ComparisonRow[] = gait.trends
    .filter((t) => ["gait_speed", "stride_length_cm", "gait_asymmetry", "steps"].includes(t.key))
    .map((t) => ({ parameter: t.label, current: t.current, previous: t.previous, unit: t.unit }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gait Analysis"
        subtitle={`Descriptive gait parameters for ${patient?.alias ?? "the selected patient"} (focus limb: ${patient?.focus_limb ?? "—"}). Asymmetry is a left/right difference measure and is not a diagnosis.`}
        actions={<ExportButtons rows={gait.series} patientId={patientId} context="gait" />}
      />

      <FilterBar showDate />

      {!gait.series.length ? (
        <EmptyState title="No gait records" message="No demo gait data exists for the selected patient and range." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Average Gait Speed"
              value={formatNumber(gait.averages.gait_speed, 2)}
              unit="m/s"
              hint={`${gait.windowDays}-day window average`}
            />
            <KpiCard
              label="Average Stride Length"
              value={formatNumber(gait.averages.stride_length_cm, 1)}
              unit="cm"
              tone="accent"
            />
            <KpiCard
              label="Average Asymmetry"
              value={formatNumber(gait.averages.gait_asymmetry, 1)}
              unit="%"
              tone="warning"
            />
            <KpiCard label="Average Daily Steps" value={formatNumber(gait.averages.steps)} tone="success" />
          </div>

          <SectionCard
            title="Gait Parameter Trends"
            description="Select which parameters to plot. All series share one time axis so patterns can be compared."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {TOGGLES.map((t) => {
                const on = active.includes(t.key);
                return (
                  <Button
                    key={t.key}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "outline"}
                    onClick={() => toggle(t.key)}
                    className={cn("rounded-full text-xs", !on && "text-muted-foreground")}
                  >
                    {METRIC_META[t.key].label}
                  </Button>
                );
              })}
            </div>
            {series.length ? (
              <TimeSeriesChart data={gait.series} series={series} yLabel="Value" height={340} />
            ) : (
              <EmptyState title="No parameter selected" message="Enable at least one gait parameter above." />
            )}
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="Current vs Previous Period"
              description="Each bar shows the current period as a percentage of the equally long preceding period (100% = unchanged)."
            >
              <ComparisonChart rows={comparison} />
            </SectionCard>

            <SectionCard
              title="Change Summary"
              description="Descriptive change indicators. Wording is deliberately neutral and never diagnostic."
              bodyClassName="space-y-2.5"
            >
              {gait.trends.map((trend) => (
                <div
                  key={trend.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">{trend.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {formatNumber(trend.previous, 2)} → {formatNumber(trend.current, 2)} {trend.unit}
                    </p>
                  </div>
                  <TrendPill changePercent={trend.changePercent} direction={trend.direction} />
                </div>
              ))}
            </SectionCard>
          </div>

          <SectionCard
            title="Left / Right Balance View"
            description="Asymmetry plotted alongside gait speed to show how balance and pace move together in the demo dataset."
          >
            <TimeSeriesChart
              data={gait.series}
              yLabel="Value"
              variant="area"
              series={[
                { key: "gait_asymmetry", label: "Gait asymmetry (%)", color: CHART_COLORS.warning },
                { key: "gait_speed", label: "Gait speed (m/s)", color: CHART_COLORS.primary },
              ]}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}
