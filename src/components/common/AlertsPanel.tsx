import { AlertTriangle, Info, WifiOff, Zap } from "lucide-react";

import { SectionCard } from "./SectionCard";
import { cn } from "@/lib/utils";
import type { DashboardAlert } from "@/data/types";

const ICONS = {
  "data-quality": AlertTriangle,
  energy: Zap,
  communication: WifiOff,
} as const;

const TONE = {
  info: "border-info/30 bg-info-soft text-info",
  warning: "border-warning/40 bg-warning-soft text-warning",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

/** Device/data alerts only — never clinical or diagnostic statements. */
export function AlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <SectionCard
      title="System & Data Alerts"
      description="These alerts describe device, communication and data-quality conditions of the prototype. They are not medical alerts."
      bodyClassName="space-y-2.5"
    >
      {alerts.length ? (
        alerts.map((alert) => {
          const Icon = ICONS[alert.kind];
          return (
            <div
              key={alert.id}
              className={cn("flex items-start gap-3 rounded-xl border px-3.5 py-3", TONE[alert.severity])}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold">{alert.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{alert.message}</p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-3 text-xs text-muted-foreground">
          <Info className="size-4" aria-hidden="true" />
          No device or data-quality alerts for the selected filters.
        </div>
      )}
    </SectionCard>
  );
}
