import { CalendarRange, RotateCcw, Search } from "lucide-react";

import { useFilters } from "@/context/FilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAvailableDates } from "@/services/dataService";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  showDate?: boolean | undefined;
  showSearch?: boolean | undefined;
  className?: string | undefined;
  children?: React.ReactNode | undefined;
}

/** Shared filter controls. Every page consumes the same filter context. */
export function FilterBar({ showDate = false, showSearch = true, className, children }: FilterBarProps) {
  const {
    filteredPatients,
    patients,
    patientId,
    setPatientId,
    range,
    setRange,
    rangeError,
    bounds,
    search,
    setSearch,
    selectedDate,
    setSelectedDate,
    resetFilters,
  } = useFilters();

  const dates = getAvailableDates(patientId);

  return (
    <div className={cn("panel space-y-3 p-4 no-print", className)}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {showSearch ? (
          <div className="space-y-1.5">
            <Label htmlFor="patient-search" className="text-xs text-muted-foreground">
              Patient search
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="patient-search"
                value={search}
                placeholder="ID, alias or programme"
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="patient-select" className="text-xs text-muted-foreground">
            Patient
          </Label>
          <select
            id="patient-select"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-card-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {(filteredPatients.length ? filteredPatients : patients).map((patient) => (
              <option key={patient.patient_id} value={patient.patient_id}>
                {patient.patient_id} — {patient.alias}
              </option>
            ))}
          </select>
          {!filteredPatients.length ? (
            <p className="text-[11px] text-warning">No patient matched the search; showing all demo patients.</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="range-from" className="text-xs text-muted-foreground">
            Date range
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="range-from"
              type="date"
              value={range.from}
              min={bounds.from}
              max={bounds.to}
              onChange={(event) => setRange({ ...range, from: event.target.value })}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              id="range-to"
              type="date"
              value={range.to}
              min={bounds.from}
              max={bounds.to}
              onChange={(event) => setRange({ ...range, to: event.target.value })}
            />
          </div>
        </div>

        {showDate ? (
          <div className="space-y-1.5">
            <Label htmlFor="single-date" className="text-xs text-muted-foreground">
              Focus date
            </Label>
            <select
              id="single-date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-card-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {dates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {children}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarRange className="size-3.5" aria-hidden="true" />
          Demo window available: {bounds.from} → {bounds.to}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1.5 text-xs">
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset filters
        </Button>
      </div>

      {rangeError ? (
        <p role="alert" className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
          {rangeError} Showing the full demo window instead.
        </p>
      ) : null}
    </div>
  );
}
