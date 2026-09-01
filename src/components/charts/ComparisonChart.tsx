import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/common/SectionCard";

export interface ComparisonRow {
  parameter: string;
  current: number;
  previous: number;
  unit: string;
}

const AXIS_STYLE = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;

/** Current period vs previous period, normalised so mixed units share an axis. */
export function ComparisonChart({ rows, height = 300 }: { rows: ComparisonRow[]; height?: number }) {
  if (!rows.length) {
    return <EmptyState title="Nothing to compare" message="A previous period is not available for this range." />;
  }

  const data = rows.map((row) => ({
    parameter: row.parameter,
    Current: row.previous ? Math.round((row.current / row.previous) * 1000) / 10 : 100,
    Previous: 100,
    raw: row,
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 28, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="parameter"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            interval={0}
            height={48}
            label={{ value: "Gait parameter", position: "insideBottom", offset: -2, style: AXIS_STYLE }}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={56}
            label={{
              value: "Indexed (previous = 100)",
              angle: -90,
              position: "insideLeft",
              style: AXIS_STYLE,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.75rem",
              fontSize: 12,
              color: "var(--color-popover-foreground)",
            }}
            formatter={(value: number, name) => [`${value} (index)`, String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          <Bar dataKey="Previous" name="Previous period" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Current" name="Current period" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
