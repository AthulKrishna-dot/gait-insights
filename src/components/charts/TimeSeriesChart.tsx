import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/common/SectionCard";
import { formatShortDate } from "@/utils/format";
import type { DailyRecord } from "@/data/types";

export interface SeriesConfig {
  /** Any numeric field on the plotted rows (daily record fields or derived ones). */
  key: string;
  label: string;
  color: string;
}

interface TimeSeriesChartProps {
  data: (DailyRecord & { [extra: string]: unknown })[] | DailyRecord[];
  series: SeriesConfig[];

  yLabel: string;
  variant?: "line" | "area" | "bar";
  height?: number;
  xLabel?: string;
}

const AXIS_STYLE = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;

export function TimeSeriesChart({
  data,
  series,
  yLabel,
  variant = "line",
  height = 280,
  xLabel = "Date",
}: TimeSeriesChartProps) {
  if (!data.length || !series.length) {
    return (
      <EmptyState
        title="No data to plot"
        message="No demo records match the current patient and date range. Try widening the range."
      />
    );
  }

  const chartData = data.map((row) => ({ ...row, label: formatShortDate(row.date) }));

  // Series can mix very different magnitudes (e.g. gait speed ~1 m/s next to
  // stride length ~105 cm). When they do, small series move to a right axis so
  // neither of them collapses into a flat line.
  const maxOf = (key: string) =>
    Math.max(...chartData.map((row) => Number((row as Record<string, unknown>)[key] ?? 0) || 0));
  const maxima = series.map((s) => maxOf(s.key));
  const largest = Math.max(...maxima, 1);
  const rightKeys = new Set(
    series.filter((s, index) => series.length > 1 && largest / Math.max(maxima[index] ?? 0, 0.0001) > 10).map((s) => s.key),
  );
  const axisIdOf = (key: string) => (rightKeys.has(key) ? "right" : "left");

  // NOTE: keep this as an array, not a fragment — Recharts does not look
  // inside fragments when discovering axes, tooltip and legend children.
  const common = [
      <CartesianGrid
        key="grid" strokeDasharray="3 3" stroke="var(--color-border)"
        vertical={false}
      />,
      <XAxis
        key="x"
        dataKey="label"
        tick={AXIS_STYLE}
        tickLine={false}
        axisLine={{ stroke: "var(--color-border)" }}
        label={{ value: xLabel, position: "insideBottom", offset: -4, style: AXIS_STYLE }}
        minTickGap={16}
      />,
      <YAxis
        key="y"
        yAxisId="left"
        tick={AXIS_STYLE}
        tickLine={false}
        axisLine={false}
        width={56}
        label={{ value: yLabel, angle: -90, position: "insideLeft", style: AXIS_STYLE }}
      />,
      ...(rightKeys.size
        ? [
            <YAxis
              key="y-right"
              yAxisId="right"
              orientation="right"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={48}
            />,
          ]
        : []),
      <Tooltip
        key="tooltip"
        contentStyle={{
          background: "var(--color-popover)",
          border: "1px solid var(--color-border)",
          borderRadius: "0.75rem",
          fontSize: 12,
          color: "var(--color-popover-foreground)",
        }}
        labelStyle={{ color: "var(--color-muted-foreground)", fontSize: 11 }}
      />,
      <Legend key="legend" wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />,
  ];


  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 24, left: 4 }}>
            {common}
            {series.map((s) => (
              <Bar key={String(s.key)} yAxisId={axisIdOf(s.key)} dataKey={String(s.key)} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : variant === "area" ? (
          <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 24, left: 4 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={String(s.key)} id={`grad-${String(s.key)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {common}
            {series.map((s) => (
              <Area
                key={String(s.key)}
                yAxisId={axisIdOf(s.key)}
                type="monotone"
                dataKey={String(s.key)}
                name={s.label}

                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${String(s.key)})`}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 24, left: 4 }}>
            {common}
            {series.map((s) => (
              <Line
                key={String(s.key)}
                yAxisId={axisIdOf(s.key)}
                type="monotone"
                dataKey={String(s.key)}
                name={s.label}

                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export const CHART_COLORS = {
  primary: "var(--color-chart-1)",
  accent: "var(--color-chart-2)",
  success: "var(--color-chart-3)",
  warning: "var(--color-chart-4)",
  violet: "var(--color-chart-5)",
};
