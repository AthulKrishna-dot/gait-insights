/**
 * Data service abstraction.
 *
 * The UI never touches a CSV file, an API or a database directly — it only
 * calls the functions in this module. Today they resolve against the bundled
 * fictional demo dataset. Later, each function body can be replaced with a
 * `fetch("/api/...")` call or a SQL query and every page keeps working.
 */

import {
  DEMO_DAYS,
  DEMO_PATIENTS,
  DEMO_REFERENCE_DATE,
  buildDemoDataset,
  datasetToCsv,
  demoDateWindow,
} from "@/data/demoDataset";
import type {
  DailyMetricKey,
  DailyRecord,
  DashboardAlert,
  DataQualityReport,
  DateRange,
  EnergySummary,
  GaitSummary,
  MetricTrend,
  Patient,
  PatientId,
  SensorStatus,
} from "@/data/types";

export type DataSourceMode = "demo-csv" | "hardware-api";

export const DATA_SOURCE_MODE: DataSourceMode = "demo-csv";

const DATASET: DailyRecord[] = buildDemoDataset(DEMO_DAYS);

export const METRIC_META: Record<DailyMetricKey, { label: string; unit: string; digits: number }> = {
  steps: { label: "Steps", unit: "steps", digits: 0 },
  distance_km: { label: "Walking Distance", unit: "km", digits: 2 },
  gait_speed: { label: "Gait Speed", unit: "m/s", digits: 2 },
  stride_length_cm: { label: "Stride Length", unit: "cm", digits: 1 },
  gait_asymmetry: { label: "Gait Asymmetry", unit: "%", digits: 1 },
  activity_minutes: { label: "Activity Duration", unit: "min", digits: 0 },
  energy_harvested_mj: { label: "Energy Harvested", unit: "mJ", digits: 2 },
  energy_stored_mj: { label: "Energy Stored", unit: "mJ", digits: 2 },
  energy_consumed_mj: { label: "Energy Consumed", unit: "mJ", digits: 2 },
  data_completeness: { label: "Data Completeness", unit: "%", digits: 1 },
  pain_score: { label: "Pain", unit: "/100", digits: 0 },
  anxiety_score: { label: "Anxiety", unit: "/100", digits: 0 },
  depression_score: { label: "Depression", unit: "/100", digits: 0 },
  appetite_score: { label: "Appetite", unit: "/100", digits: 0 },
  sleep_score: { label: "Sleep", unit: "/100", digits: 0 },
  general_condition_score: { label: "General Condition", unit: "/100", digits: 0 },
};

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

function safeRange(range?: Partial<DateRange>): DateRange {
  const window = demoDateWindow(DEMO_DAYS);
  const fallback: DateRange = { from: window[0]!, to: window[window.length - 1]! };
  if (!range?.from || !range?.to) return fallback;
  const from = range.from <= range.to ? range.from : range.to;
  const to = range.from <= range.to ? range.to : range.from;
  return { from, to };
}

/** All fictional demo patients. */
export function getPatients(): Patient[] {
  return DEMO_PATIENTS;
}

export function getPatient(patientId: PatientId): Patient | undefined {
  return DEMO_PATIENTS.find((p) => p.patient_id === patientId);
}

export function getDefaultRange(days = 14): DateRange {
  const window = demoDateWindow(Math.min(days, DEMO_DAYS));
  return { from: window[0]!, to: window[window.length - 1]! };
}

export function getFullRange(): DateRange {
  return safeRange();
}

export const LATEST_DEMO_DATE = DEMO_REFERENCE_DATE;

/** Every record for a patient (whole demo window). */
export function getPatientData(patientId: PatientId): DailyRecord[] {
  return DATASET.filter((row) => row.patient_id === patientId).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/** Records for a patient within a date range. */
export function getDailyData(patientId: PatientId, range?: Partial<DateRange>): DailyRecord[] {
  const { from, to } = safeRange(range);
  return getPatientData(patientId).filter((row) => row.date >= from && row.date <= to);
}

export function getRecordForDate(patientId: PatientId, date: string): DailyRecord | undefined {
  return getPatientData(patientId).find((row) => row.date === date);
}

export function getAvailableDates(patientId: PatientId): string[] {
  return getPatientData(patientId).map((row) => row.date);
}

/** The window immediately before the requested range, for period comparison. */
function getPreviousWindow(patientId: PatientId, range: DateRange): DailyRecord[] {
  const all = getPatientData(patientId);
  const current = all.filter((row) => row.date >= range.from && row.date <= range.to);
  if (!current.length) return [];
  const before = all.filter((row) => row.date < range.from);
  return before.slice(Math.max(0, before.length - current.length));
}

function buildTrend(
  key: DailyMetricKey,
  current: number,
  previous: number,
  stableThreshold = 1.5,
): MetricTrend {
  const changePercent = previous === 0 ? 0 : round(((current - previous) / previous) * 100, 1);
  const direction: MetricTrend["direction"] =
    Math.abs(changePercent) < stableThreshold ? "stable" : changePercent > 0 ? "increased" : "decreased";
  const meta = METRIC_META[key];
  return {
    key,
    label: meta.label,
    unit: meta.unit,
    current: round(current, meta.digits),
    previous: round(previous, meta.digits),
    changePercent,
    direction,
  };
}

export function getGaitData(patientId: PatientId, range?: Partial<DateRange>): GaitSummary {
  const safe = safeRange(range);
  const series = getDailyData(patientId, safe);
  const previousSeries = getPreviousWindow(patientId, safe);

  const avg = (rows: DailyRecord[], key: DailyMetricKey) => mean(rows.map((r) => Number(r[key])));

  const trendKeys: DailyMetricKey[] = [
    "steps",
    "distance_km",
    "gait_speed",
    "stride_length_cm",
    "gait_asymmetry",
    "activity_minutes",
  ];

  return {
    patient_id: patientId,
    windowDays: series.length,
    totals: {
      steps: series.reduce((a, r) => a + r.steps, 0),
      distance_km: round(
        series.reduce((a, r) => a + r.distance_km, 0),
        2,
      ),
      activity_minutes: series.reduce((a, r) => a + r.activity_minutes, 0),
    },
    averages: {
      gait_speed: round(avg(series, "gait_speed"), 2),
      stride_length_cm: round(avg(series, "stride_length_cm"), 1),
      gait_asymmetry: round(avg(series, "gait_asymmetry"), 1),
      steps: Math.round(avg(series, "steps")),
    },
    trends: trendKeys.map((key) =>
      buildTrend(key, avg(series, key), previousSeries.length ? avg(previousSeries, key) : avg(series, key)),
    ),
    series,
    previousSeries,
  };
}

/** Prototype-only energy thresholds. These are NOT clinical thresholds. */
export const ENERGY_THRESHOLDS = { good: 12, moderate: 7 };

export function getEnergyData(patientId: PatientId, range?: Partial<DateRange>): EnergySummary {
  const series = getDailyData(patientId, range);
  const harvested = series.map((r) => r.energy_harvested_mj);
  const last = series[series.length - 1];
  const harvestedToday = last?.energy_harvested_mj ?? 0;
  const status: EnergySummary["status"] =
    harvestedToday >= ENERGY_THRESHOLDS.good
      ? "Good"
      : harvestedToday >= ENERGY_THRESHOLDS.moderate
        ? "Moderate"
        : "Low";

  return {
    patient_id: patientId,
    harvestedToday: round(harvestedToday, 2),
    averageDaily: round(mean(harvested), 2),
    maximum: harvested.length ? round(Math.max(...harvested), 2) : 0,
    minimum: harvested.length ? round(Math.min(...harvested), 2) : 0,
    stored: round(last?.energy_stored_mj ?? 0, 2),
    estimatedConsumption: round(mean(series.map((r) => r.energy_consumed_mj)), 2),
    status,
    series,
  };
}

export function getPatientReports(patientId: PatientId, range?: Partial<DateRange>): DailyRecord[] {
  return getDailyData(patientId, range);
}

const SENSOR_DEFINITIONS: { id: string; label: string }[] = [
  { id: "fsr1", label: "Pressure Sensor 1 (heel)" },
  { id: "fsr2", label: "Pressure Sensor 2 (lateral midfoot)" },
  { id: "fsr3", label: "Pressure Sensor 3 (metatarsal)" },
  { id: "fsr4", label: "Pressure Sensor 4 (toe-off)" },
  { id: "imu", label: "3-Axis Accelerometer" },
  { id: "energy", label: "Energy Harvesting Sensor" },
];

export function getDataQuality(patientId: PatientId, range?: Partial<DateRange>): DataQualityReport {
  const series = getDailyData(patientId, range);
  const completeness = round(mean(series.map((r) => r.data_completeness)), 1);
  const worst = series.reduce<DailyRecord | undefined>(
    (acc, row) => (!acc || row.data_completeness < acc.data_completeness ? row : acc),
    undefined,
  );
  const last = series[series.length - 1];
  const sensorErrors = series.filter((r) => r.data_completeness < 90).length;

  const sensors: SensorStatus[] = SENSOR_DEFINITIONS.map((sensor, index) => {
    const degraded = sensorErrors > 0 && index === (worst ? worst.steps % SENSOR_DEFINITIONS.length : 0);
    return {
      ...sensor,
      state: degraded ? "degraded" : "online",
      detail: degraded ? "Intermittent samples in demo stream" : "Reporting normally (demo)",
    };
  });

  return {
    patient_id: patientId,
    completeness,
    missingPercent: round(100 - completeness, 1),
    records: series.length,
    communication: completeness > 94 ? "connected" : completeness > 88 ? "intermittent" : "offline",
    lastDataReceived: last?.last_sample_at ?? "—",
    deviceUptime: "18 h 42 min",
    energyStatus: getEnergyData(patientId, range).status,
    sensorErrors,
    sensors,
  };
}

export function getDashboardAlerts(patientId: PatientId, range?: Partial<DateRange>): DashboardAlert[] {
  const quality = getDataQuality(patientId, range);
  const energy = getEnergyData(patientId, range);
  const alerts: DashboardAlert[] = [];

  if (quality.missingPercent > 2) {
    alerts.push({
      id: "dq-missing",
      kind: "data-quality",
      severity: quality.missingPercent > 6 ? "critical" : "warning",
      title: "Data Quality Alert",
      message: `Some sensor records are missing — ${quality.missingPercent}% of expected samples were not received in the selected range.`,
    });
  }

  if (energy.harvestedToday < ENERGY_THRESHOLDS.good) {
    alerts.push({
      id: "energy-low",
      kind: "energy",
      severity: energy.harvestedToday < ENERGY_THRESHOLDS.moderate ? "critical" : "warning",
      title: "Energy Alert",
      message: `Energy harvested (${energy.harvestedToday} mJ) is lower than the prototype reference threshold of ${ENERGY_THRESHOLDS.good} mJ. Prototype threshold only — not a clinical threshold.`,
    });
  }

  alerts.push({
    id: "comm-demo",
    kind: "communication",
    severity: "info",
    title: "Communication Alert",
    message:
      "Running in Demo Mode — no live ESP32 stream is connected, so no new hardware data is expected.",
  });

  return alerts;
}

/** Serialise the currently filtered rows to CSV (used by the export buttons). */
export function toCsv(rows: DailyRecord[]): string {
  return datasetToCsv(rows);
}

export function getDatasetInfo() {
  return {
    mode: DATA_SOURCE_MODE,
    patients: DEMO_PATIENTS.length,
    daysPerPatient: DEMO_DAYS,
    records: DATASET.length,
    sourceFile: "public/data/rehabilitation_data.csv",
    referenceDate: DEMO_REFERENCE_DATE,
  };
}
