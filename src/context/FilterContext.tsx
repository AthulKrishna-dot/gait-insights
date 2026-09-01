/**
 * Global dashboard filter state: selected patient, date range, search text and
 * summary language. Every page reads from here so filters stay consistent while
 * navigating, and so KPI cards, tables and charts always agree.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { getDefaultRange, getFullRange, getPatients, LATEST_DEMO_DATE } from "@/services/dataService";
import type { SummaryLanguage } from "@/services/aiSummaryService";
import type { DateRange, Patient } from "@/data/types";

interface FilterState {
  patients: Patient[];
  filteredPatients: Patient[];
  patientId: string;
  setPatientId: (id: string) => void;
  patient: Patient | undefined;
  range: DateRange;
  setRange: (range: DateRange) => void;
  rangeError: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  search: string;
  setSearch: (value: string) => void;
  language: SummaryLanguage;
  setLanguage: (language: SummaryLanguage) => void;
  bounds: DateRange;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const patients = getPatients();
  const bounds = getFullRange();
  const defaults = getDefaultRange(14);

  const [patientId, setPatientId] = useState(patients[0]?.patient_id ?? "");
  const [range, setRangeState] = useState<DateRange>(defaults);
  const [selectedDate, setSelectedDate] = useState(LATEST_DEMO_DATE);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState<SummaryLanguage>("en");

  const rangeError = useMemo(() => {
    if (!range.from || !range.to) return "Select both a start and an end date.";
    if (range.from > range.to) return "The start date must be before the end date.";
    if (range.to < bounds.from || range.from > bounds.to)
      return `Demo data is only available between ${bounds.from} and ${bounds.to}.`;
    return null;
  }, [range, bounds]);

  const setRange = useCallback((next: DateRange) => setRangeState(next), []);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter(
      (p) =>
        p.patient_id.toLowerCase().includes(query) ||
        p.alias.toLowerCase().includes(query) ||
        p.rehab_program.toLowerCase().includes(query),
    );
  }, [patients, search]);

  const resetFilters = useCallback(() => {
    setPatientId(patients[0]?.patient_id ?? "");
    setRangeState(getDefaultRange(14));
    setSelectedDate(LATEST_DEMO_DATE);
    setSearch("");
  }, [patients]);

  const value: FilterState = {
    patients,
    filteredPatients,
    patientId,
    setPatientId,
    patient: patients.find((p) => p.patient_id === patientId),
    range,
    setRange,
    rangeError,
    selectedDate,
    setSelectedDate,
    search,
    setSearch,
    language,
    setLanguage,
    bounds,
    resetFilters,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside <FilterProvider>");
  return ctx;
}

/** Safe range for the data service: falls back to the full demo window. */
export function useSafeRange(): DateRange {
  const { range, rangeError, bounds } = useFilters();
  return rangeError ? bounds : range;
}
