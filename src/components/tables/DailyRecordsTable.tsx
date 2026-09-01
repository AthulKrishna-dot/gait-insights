import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLongDate, formatNumber } from "@/utils/format";
import type { DailyRecord } from "@/data/types";

type SortKey = "date" | "steps" | "distance_km" | "gait_speed" | "gait_asymmetry" | "activity_minutes";

const COLUMNS: { key: SortKey | "energy" | "completeness"; label: string; numeric?: boolean }[] = [
  { key: "date", label: "Date" },
  { key: "steps", label: "Steps", numeric: true },
  { key: "distance_km", label: "Distance (km)", numeric: true },
  { key: "gait_speed", label: "Gait speed (m/s)", numeric: true },
  { key: "gait_asymmetry", label: "Asymmetry (%)", numeric: true },
  { key: "activity_minutes", label: "Activity (min)", numeric: true },
  { key: "energy", label: "Harvested (mJ)", numeric: true },
  { key: "completeness", label: "Completeness (%)", numeric: true },
];

const PAGE_SIZE = 10;

/** Sortable, paginated table of aggregated daily demo records. */
export function DailyRecordsTable({ rows }: { rows: DailyRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const result = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return descending ? -result : result;
    });
    return copy;
  }, [rows, sortKey, descending]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDescending((prev) => !prev);
    } else {
      setSortKey(key);
      setDescending(true);
    }
    setPage(0);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => {
                const sortable = column.key !== "energy" && column.key !== "completeness";
                const active = sortable && column.key === sortKey;
                return (
                  <TableHead key={column.key} className={cn(column.numeric && "text-right")}>
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key as SortKey)}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:text-primary",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {column.label}
                        {active ? (
                          descending ? (
                            <ArrowDown className="size-3" aria-hidden="true" />
                          ) : (
                            <ArrowUp className="size-3" aria-hidden="true" />
                          )
                        ) : null}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">{column.label}</span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.date}>
                <TableCell className="whitespace-nowrap font-medium text-card-foreground">
                  {formatLongDate(row.date)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(row.steps)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(row.distance_km, 2)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(row.gait_speed, 2)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(row.gait_asymmetry, 1)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(row.activity_minutes)}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatNumber(row.energy_harvested_mj, 2)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">{formatNumber(row.data_completeness, 1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          Showing {visible.length} of {sorted.length} demo records · page {current + 1} of {pageCount}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(pageCount - 1, current + 1))}
            disabled={current >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
