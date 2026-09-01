import { createFileRoute } from "@tanstack/react-router";
import { BatteryCharging, Gauge, Zap, ZapOff } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { FilterBar } from "@/components/common/FilterBar";
import { KpiCard } from "@/components/common/KpiCard";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CHART_COLORS, TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { useFilters, useSafeRange } from "@/context/FilterContext";
import { ENERGY_THRESHOLDS, getEnergyData } from "@/services/dataService";
import { formatNumber } from "@/utils/format";

export const Route = createFileRoute("/energy")({
  head: () => ({
    meta: [
      { title: "Energy Analytics — Self-Powered Edge-AI Rehabilitation Companion" },
      {
        name: "description",
        content:
          "Self-powered insole energy analytics: harvested, stored and consumed energy per day with a prototype energy-sufficiency status.",
      },
      { property: "og:title", content: "Energy Analytics — Self-Powered Edge-AI Rehabilitation Companion" },
      {
        property: "og:description",
        content: "Energy harvesting and consumption analytics for the self-powered rehabilitation insole prototype.",
      },
    ],
  }),
  component: EnergyAnalyticsPage,
});

function EnergyAnalyticsPage() {
  const { patientId } = useFilters();
  const range = useSafeRange();
  const energy = getEnergyData(patientId, range);

  const balance = energy.series.map((row) => ({
    ...row,
    net_energy_mj: Math.round((row.energy_harvested_mj - row.energy_consumed_mj) * 100) / 100,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Energy Analytics"
        subtitle="Energy harvested by the piezoelectric/triboelectric insole layer, stored in the supercapacitor and consumed by the electronics. All values are demo estimates."
        actions={<ExportButtons rows={energy.series} patientId={patientId} context="energy" />}
      />

      <FilterBar showDate />

      {!energy.series.length ? (
        <EmptyState title="No energy records" message="No demo energy data exists for the selected filters." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={energy.status === "Good" ? "online" : energy.status === "Moderate" ? "warning" : "offline"}
              label={`Energy Status: ${energy.status}`}
            />
            <span className="text-[11px] text-muted-foreground">
              Prototype thresholds: Good ≥ {ENERGY_THRESHOLDS.good} mJ/day · Moderate ≥ {ENERGY_THRESHOLDS.moderate}{" "}
              mJ/day
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Energy Harvested (latest day)"
              value={formatNumber(energy.harvestedToday, 2)}
              unit="mJ"
              icon={Zap}
              tone="warning"
            />
            <KpiCard
              label="Average Daily Harvest"
              value={formatNumber(energy.averageDaily, 2)}
              unit="mJ"
              icon={Gauge}
            />
            <KpiCard
              label="Stored (supercapacitor)"
              value={formatNumber(energy.stored, 2)}
              unit="mJ"
              icon={BatteryCharging}
              tone="success"
            />
            <KpiCard
              label="Estimated Consumption"
              value={formatNumber(energy.estimatedConsumption, 2)}
              unit="mJ/day"
              icon={ZapOff}
              tone="accent"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <KpiCard label="Maximum Daily Harvest" value={formatNumber(energy.maximum, 2)} unit="mJ" />
            <KpiCard label="Minimum Daily Harvest" value={formatNumber(energy.minimum, 2)} unit="mJ" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionCard
              title="Energy Harvested per Day"
              description="Harvest scales with walking activity in the demo model."
            >
              <TimeSeriesChart
                data={energy.series}
                yLabel="mJ"
                variant="bar"
                series={[{ key: "energy_harvested_mj", label: "Harvested (mJ)", color: CHART_COLORS.warning }]}
              />
            </SectionCard>

            <SectionCard title="Harvested vs Consumed" description="Comparison of generation and electronics draw.">
              <TimeSeriesChart
                data={energy.series}
                yLabel="mJ"
                series={[
                  { key: "energy_harvested_mj", label: "Harvested (mJ)", color: CHART_COLORS.warning },
                  { key: "energy_consumed_mj", label: "Consumed (mJ)", color: CHART_COLORS.accent },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Stored Energy Trend"
              description="Supercapacitor charge level aggregated at the end of each day."
            >
              <TimeSeriesChart
                data={energy.series}
                yLabel="mJ"
                variant="area"
                series={[{ key: "energy_stored_mj", label: "Stored (mJ)", color: CHART_COLORS.success }]}
              />
            </SectionCard>

            <SectionCard
              title="Net Energy Balance"
              description="Harvested minus consumed. Positive days mean the prototype was self-sufficient."
            >
              <TimeSeriesChart
                data={balance}
                yLabel="Net mJ"
                variant="bar"
                series={[{ key: "net_energy_mj", label: "Net energy (mJ)", color: CHART_COLORS.primary }]}
              />
            </SectionCard>
          </div>

          <SectionCard
            title="Self-Powered Operation Notes"
            description="How the energy layer is expected to behave once ESP32 hardware is attached."
            bodyClassName="space-y-2 text-xs leading-relaxed text-muted-foreground"
          >
            <p>
              The insole harvests energy while the patient walks; harvest therefore correlates with step count and
              activity duration. Surplus energy charges a supercapacitor that powers sampling and BLE transmission
              during rest periods.
            </p>
            <p>
              Days classified as Low indicate the prototype would rely on stored charge or an external top-up. This
              classification is an engineering status for the device, not a statement about the patient.
            </p>
          </SectionCard>
        </>
      )}
    </div>
  );
}
