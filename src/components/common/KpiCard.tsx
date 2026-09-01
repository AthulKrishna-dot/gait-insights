import type { LucideIcon } from "lucide-react";

import { TrendPill } from "./TrendPill";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/data/types";

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string | undefined;
  icon?: LucideIcon | undefined;
  hint?: string | undefined;
  changePercent?: number | undefined;
  direction?: TrendDirection | undefined;
  tone?: "default" | "accent" | "success" | "warning" | undefined;
  className?: string | undefined;
}

const TONE_RING: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
};

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  changePercent,
  direction,
  tone = "default",
  className,
}: KpiCardProps) {
  return (
    <div className={cn("panel flex flex-col gap-3 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", TONE_RING[tone])}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="kpi-value text-card-foreground">{value}</span>
        {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {direction && changePercent !== undefined ? (
          <TrendPill direction={direction} changePercent={changePercent} />
        ) : null}
        {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
