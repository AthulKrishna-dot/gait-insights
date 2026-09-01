import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { formatPercentChange } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/data/types";

const LABELS: Record<TrendDirection, string> = {
  increased: "Increased",
  decreased: "Decreased",
  stable: "Stable",
};

/**
 * Neutral, non-diagnostic trend indicator. Colour encodes direction of change
 * only — never "good" or "bad" clinical judgement.
 */
export function TrendPill({
  direction,
  changePercent,
  showLabel = true,
  className,
}: {
  direction: TrendDirection;
  /** Optional: omit when only the direction word should be shown. */
  changePercent?: number | undefined;
  showLabel?: boolean | undefined;
  className?: string | undefined;
}) {
  const Icon = direction === "increased" ? ArrowUpRight : direction === "decreased" ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        direction === "increased" && "bg-info-soft text-info",
        direction === "decreased" && "bg-accent-soft text-accent",
        direction === "stable" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {changePercent === undefined ? LABELS[direction] : formatPercentChange(changePercent)}
      {showLabel && changePercent !== undefined ? (
        <span className="hidden sm:inline">· {LABELS[direction]}</span>
      ) : null}

    </span>
  );
}
