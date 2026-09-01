import { cn } from "@/lib/utils";

export type StatusTone = "online" | "warning" | "offline" | "neutral" | "info";

const TONE: Record<StatusTone, string> = {
  online: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  offline: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-soft text-info",
};

const DOT: Record<StatusTone, string> = {
  online: "bg-success",
  warning: "bg-warning",
  offline: "bg-destructive",
  neutral: "bg-muted-foreground",
  info: "bg-info",
};

export function StatusBadge({
  tone = "neutral",
  label,
  className,
  withDot = true,
}: {
  tone?: StatusTone;
  label: string;
  className?: string;
  withDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        TONE[tone],
        className,
      )}
    >
      {withDot ? <span className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

/** Persistent reminder that all values on screen are fictional demo data. */
export function DemoBadge({ className }: { className?: string }) {
  return <StatusBadge tone="warning" label="Demo Data" className={className} />;
}
