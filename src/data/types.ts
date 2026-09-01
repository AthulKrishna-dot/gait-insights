/**
 * Shared domain types for the Smart Rehabilitation Analytics prototype.
 *
 * These types describe the contract between the data source (currently demo
 * CSV/generated data) and the UI. A future MySQL/PostgreSQL + ESP32 backend
 * only has to satisfy these same shapes — no UI changes required.
 */

export type PatientId = string;

export interface Patient {
  patient_id: PatientId;
  /** Fictional label — no real patient information is used anywhere. */
  alias: string;
  age_band: string;
  rehab_program: string;
  enrolled_on: string;
  /** Fictional side under rehabilitation, used only for demo labelling. */
  focus_limb: "Left" | "Right";
}

/** One aggregated day of monitoring data for one patient. */
export interface DailyRecord {
  patient_id: PatientId;
  date: string; // YYYY-MM-DD
  steps: number;
  distance_km: number;
  gait_speed: number; // m/s
  stride_length_cm: number;
  gait_asymmetry: number; // %
  activity_minutes: number;
  energy_harvested_mj: number;
  energy_stored_mj: number;
  energy_consumed_mj: number;
  data_completeness: number; // %
  pain_score: number; // 0-100 self reported
  anxiety_score: number;
  depression_score: number;
  appetite_score: number;
  sleep_score: number;
  general_condition_score: number;
  /** Timestamp of the last packet aggregated into this day. */
  last_sample_at: string;
}

export type DailyMetricKey =
  | "steps"
  | "distance_km"
  | "gait_speed"
  | "stride_length_cm"
  | "gait_asymmetry"
  | "activity_minutes"
  | "energy_harvested_mj"
  | "energy_stored_mj"
  | "energy_consumed_mj"
  | "data_completeness"
  | "pain_score"
  | "anxiety_score"
  | "depression_score"
  | "appetite_score"
  | "sleep_score"
  | "general_condition_score";

export type TrendDirection = "increased" | "decreased" | "stable";

export interface MetricTrend {
  key: DailyMetricKey;
  label: string;
  unit: string;
  current: number;
  previous: number;
  changePercent: number;
  direction: TrendDirection;
}

export interface GaitSummary {
  patient_id: PatientId;
  windowDays: number;
  totals: { steps: number; distance_km: number; activity_minutes: number };
  averages: {
    gait_speed: number;
    stride_length_cm: number;
    gait_asymmetry: number;
    steps: number;
  };
  trends: MetricTrend[];
  series: DailyRecord[];
  previousSeries: DailyRecord[];
}

export interface EnergySummary {
  patient_id: PatientId;
  harvestedToday: number;
  averageDaily: number;
  maximum: number;
  minimum: number;
  stored: number;
  estimatedConsumption: number;
  status: "Good" | "Moderate" | "Low";
  series: DailyRecord[];
}

export interface SensorStatus {
  id: string;
  label: string;
  state: "online" | "degraded" | "offline";
  detail: string;
}

export interface DataQualityReport {
  patient_id: PatientId;
  completeness: number;
  missingPercent: number;
  records: number;
  communication: "connected" | "intermittent" | "offline";
  lastDataReceived: string;
  deviceUptime: string;
  energyStatus: EnergySummary["status"];
  sensorErrors: number;
  sensors: SensorStatus[];
}

export interface DashboardAlert {
  id: string;
  kind: "data-quality" | "energy" | "communication";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
}

/** Payload the future ESP32 firmware will POST to /api/public/sensor-data. */
export interface SensorDataPacket {
  patient_id: PatientId;
  timestamp: string;
  steps: number;
  distance_km: number;
  gait_speed: number;
  stride_length_cm: number;
  gait_asymmetry: number;
  activity_minutes: number;
  energy_harvested_mj: number;
  energy_stored_mj: number;
}

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}
