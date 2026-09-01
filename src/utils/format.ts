/** Presentation helpers. All of them tolerate missing/invalid values. */

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatMetric(
  value: number | null | undefined,
  unit: string,
  digits = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const formatted = formatNumber(value, digits);
  return unit.startsWith("/") ? `${formatted}${unit}` : `${formatted} ${unit}`;
}

export function formatPercentChange(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatShortDate(date: string): string {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function formatLongDate(date: string): string {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatTimestamp(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value.includes("T") ? `${value}Z` : value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
}
