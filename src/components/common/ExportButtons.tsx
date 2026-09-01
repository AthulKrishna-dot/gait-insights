import { Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toCsv } from "@/services/dataService";
import { downloadCsv, downloadTextFile, printCurrentView } from "@/utils/download";
import type { DailyRecord } from "@/data/types";

interface ExportButtonsProps {
  rows: DailyRecord[];
  patientId: string;
  context: string;
  showPrint?: boolean | undefined;
}

/** CSV / report / analytics exports for the currently filtered rows. */
export function ExportButtons({ rows, patientId, context, showPrint = true }: ExportButtonsProps) {
  const guard = () => {
    if (!rows.length) {
      toast.error("Nothing to export", {
        description: "No demo records match the current filters.",
      });
      return false;
    }
    return true;
  };

  const exportCsv = () => {
    if (!guard()) return;
    downloadCsv(`${patientId}_${context}_demo.csv`, toCsv(rows));
    toast.success("CSV downloaded", { description: `${rows.length} filtered demo records exported.` });
  };

  const exportDailyReport = () => {
    if (!guard()) return;
    const last = rows[rows.length - 1]!;
    const lines = [
      "SMART REHABILITATION ANALYTICS — DAILY REPORT (DEMO DATA)",
      "Rehabilitation monitoring / research prototype. Not a medical diagnosis.",
      "",
      `Patient: ${patientId} (fictional demo patient)`,
      `Report date: ${last.date}`,
      `Records in range: ${rows.length}`,
      "",
      `Steps: ${last.steps}`,
      `Walking distance: ${last.distance_km} km`,
      `Gait speed: ${last.gait_speed} m/s`,
      `Stride length: ${last.stride_length_cm} cm`,
      `Gait asymmetry: ${last.gait_asymmetry} %`,
      `Activity duration: ${last.activity_minutes} min`,
      `Energy harvested: ${last.energy_harvested_mj} mJ`,
      `Energy stored: ${last.energy_stored_mj} mJ`,
      `Data completeness: ${last.data_completeness} %`,
      "",
      "Self-reported prototype scores (0-100):",
      `Pain ${last.pain_score} · Anxiety ${last.anxiety_score} · Depression ${last.depression_score}`,
      `Appetite ${last.appetite_score} · Sleep ${last.sleep_score} · General condition ${last.general_condition_score}`,
    ];
    downloadTextFile(`${patientId}_daily_report_${last.date}.txt`, lines.join("\n"));
    toast.success("Daily report downloaded");
  };

  const exportAnalytics = () => {
    if (!guard()) return;
    downloadTextFile(
      `${patientId}_${context}_analytics.json`,
      JSON.stringify({ patient_id: patientId, context, mode: "demo", records: rows }, null, 2),
      "application/json",
    );
    toast.success("Analytics exported as JSON");
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={exportCsv} className="h-8 gap-1.5 text-xs">
        <Download className="size-3.5" aria-hidden="true" />
        Download CSV
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={exportDailyReport} className="h-8 gap-1.5 text-xs">
        <FileText className="size-3.5" aria-hidden="true" />
        Daily Report
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={exportAnalytics} className="h-8 gap-1.5 text-xs">
        <Download className="size-3.5" aria-hidden="true" />
        Export Analytics
      </Button>
      {showPrint ? (
        <Button type="button" variant="ghost" size="sm" onClick={printCurrentView} className="h-8 gap-1.5 text-xs">
          <Printer className="size-3.5" aria-hidden="true" />
          Print view
        </Button>
      ) : null}
    </>
  );
}
