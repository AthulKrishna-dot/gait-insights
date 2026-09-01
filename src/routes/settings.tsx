import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Database, Languages, ShieldAlert, Wifi } from "lucide-react";

import { PageHeader } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFilters } from "@/context/FilterContext";
import { SUMMARY_LANGUAGES } from "@/services/aiSummaryService";
import { DATA_SOURCE_MODE, getDatasetInfo } from "@/services/dataService";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Smart Rehabilitation Analytics" },
      {
        name: "description",
        content:
          "System information, data-source mode, language preference and hardware integration placeholders for the ESP32 rehabilitation prototype.",
      },
      { property: "og:title", content: "Settings — Smart Rehabilitation Analytics" },
      {
        property: "og:description",
        content: "Data source mode, language preference and planned ESP32 hardware integration details.",
      },
    ],
  }),
  component: SettingsPage,
});

const HARDWARE_STEPS = [
  {
    icon: Cpu,
    title: "ESP32 firmware",
    detail:
      "Samples 4 insole pressure channels plus a 3-axis IMU, aggregates them per minute and buffers to flash when offline.",
  },
  {
    icon: Wifi,
    title: "Transport",
    detail:
      "BLE to a phone gateway or Wi-Fi direct POST to /api/public/sensor-data, matching the SensorDataPacket type already defined in the codebase.",
  },
  {
    icon: Database,
    title: "Persistence",
    detail:
      "Packets are written to a daily aggregate table with the exact fields of DailyRecord, so no dashboard code has to change.",
  },
  {
    icon: Languages,
    title: "Local summarisation",
    detail:
      "The rule-based summary engine is replaced by a quantised small language model running on the gateway, keeping data on-device.",
  },
];

function SettingsPage() {
  const { language, setLanguage, resetFilters, patients } = useFilters();
  const info = getDatasetInfo();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings & System Information"
        subtitle="Configuration of the analytics prototype and the integration path for real hardware."
      />

      <SectionCard
        title="Data Source"
        description="The dashboard reads through a single service layer, so the source can be swapped without touching any page."
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="info" label={`Mode: ${DATA_SOURCE_MODE}`} />
          <StatusBadge tone="neutral" label="Hardware API: not connected" />
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Demo patients", String(info.patients)],
            ["Days per patient", String(info.daysPerPatient)],
            ["Total records", String(info.records)],
            ["Reference date", info.referenceDate],
            ["Sample CSV", info.sourceFile],
            ["Service layer", "src/services/dataService.ts"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-1 break-words font-mono text-xs text-card-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <SectionCard
        title="Summary Language"
        description="Applies to the AI Clinical Summary page. The selection persists while you navigate."
      >
        <div className="flex flex-wrap gap-2">
          {SUMMARY_LANGUAGES.map((option) => (
            <Button
              key={option.code}
              type="button"
              size="sm"
              variant={language === option.code ? "default" : "outline"}
              onClick={() => setLanguage(option.code)}
              className={cn("rounded-full text-xs", language !== option.code && "text-muted-foreground")}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Hardware Integration Roadmap"
        description="Everything below is planned work — the dashboard already exposes the required contracts."
        bodyClassName="grid gap-3 sm:grid-cols-2"
      >
        {HARDWARE_STEPS.map((step) => (
          <div key={step.title} className="rounded-xl border border-border bg-surface p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <step.icon className="size-4" aria-hidden="true" />
              </span>
              <p className="text-xs font-semibold text-card-foreground">{step.title}</p>
              <StatusBadge tone="neutral" label="planned" className="ml-auto" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{step.detail}</p>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Filters" description="Reset the dashboard filters back to the default demo view.">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
            Reset all filters
          </Button>
          <span className="text-[11px] text-muted-foreground">
            {patients.length} fictional demo patients are available.
          </span>
        </div>
      </SectionCard>

      <SectionCard
        title="Scope & Safety Notice"
        description="Read this before demonstrating the project."
        bodyClassName="space-y-2"
      >
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft px-3.5 py-3 text-xs leading-relaxed text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            This is an academic engineering prototype. All patients and measurements are fictional demonstration data.
            The dashboard describes recorded values and their changes only — it does not diagnose, screen for, or
            predict any medical condition, and it must not be used for clinical decision-making.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
