import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/AppShell";
import { FilterBar } from "@/components/common/FilterBar";
import { SectionCard, EmptyState } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TrendPill } from "@/components/common/TrendPill";
import { MultimodalDiagram } from "@/components/common/MultimodalDiagram";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFilters, useSafeRange } from "@/context/FilterContext";
import {
  SUMMARY_LANGUAGES,
  fusePatientData,
  generateClinicalSummary,
  summaryToPlainText,
  type ClinicalSummary,
} from "@/services/aiSummaryService";
import { downloadTextFile } from "@/utils/download";
import { formatTimestamp } from "@/utils/format";

export const Route = createFileRoute("/ai-summary")({
  head: () => ({
    meta: [
      { title: "AI Clinical Summary — Smart Rehabilitation Analytics" },
      {
        name: "description",
        content:
          "Generate non-diagnostic, multilingual rehabilitation summaries from fused gait, activity, self-reported and energy data on the edge device.",
      },
      { property: "og:title", content: "AI Clinical Summary — Smart Rehabilitation Analytics" },
      {
        property: "og:description",
        content:
          "Multilingual, non-diagnostic clinical summaries generated locally from fused rehabilitation demo data.",
      },
    ],
  }),
  component: AiSummaryPage,
});

function AiSummaryPage() {
  const { patientId, patient, language, setLanguage } = useFilters();
  const range = useSafeRange();

  const fused = useMemo(() => fusePatientData(patientId, range), [patientId, range]);
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    // Async shape kept deliberately: a local SLM call will be awaited here later.
    setTimeout(() => {
      setSummary(generateClinicalSummary(fused, language));
      setGenerating(false);
    }, 250);
  };

  const copy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summaryToPlainText(summary));
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Could not copy", { description: "Your browser blocked clipboard access." });
    }
  };

  const download = () => {
    if (!summary) return;
    downloadTextFile(`${patientId}_clinical_summary_${summary.language}.txt`, summaryToPlainText(summary));
    toast.success("Summary downloaded");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Clinical Summary"
        subtitle="Fuses gait, activity, self-reported and energy data for the selected patient and produces a plain-language, non-diagnostic summary in the chosen local language."
      />

      <FilterBar showDate />

      <SectionCard
        title="Summary Generator"
        description="A rule-based engine runs today. The same interface will call a local small language model on the edge device — no cloud, no patient data leaving the device."
      >
        <div className="flex flex-wrap items-center gap-2">
          {SUMMARY_LANGUAGES.map((option) => (
            <Button
              key={option.code}
              type="button"
              size="sm"
              variant={language === option.code ? "default" : "outline"}
              onClick={() => setLanguage(option.code)}
              className={cn("rounded-full text-xs", language !== option.code && "text-muted-foreground")}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={generate} disabled={generating} className="gap-2">
            <Sparkles className="size-4" aria-hidden="true" />
            {generating ? "Generating…" : "Generate Summary"}
          </Button>
          <Button type="button" variant="outline" onClick={copy} disabled={!summary} className="gap-2">
            <Copy className="size-4" aria-hidden="true" />
            Copy
          </Button>
          <Button type="button" variant="outline" onClick={download} disabled={!summary} className="gap-2">
            <Download className="size-4" aria-hidden="true" />
            Download .txt
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="info" label="Engine: rule-based (local)" />
          <StatusBadge tone="neutral" label="Local SLM integration: planned" />
          <StatusBadge tone="neutral" label={`Records fused: ${fused.gait.series.length}`} />
        </div>
      </SectionCard>

      {!fused.gait.series.length ? (
        <EmptyState
          title="Nothing to summarise"
          message="No demo data is available for the selected patient and date range."
        />
      ) : summary ? (
        <SectionCard
          title={`Summary — ${patient?.alias ?? patientId}`}
          description={`Generated ${formatTimestamp(summary.generatedAt)} UTC · ${summary.latencyMs} ms · language: ${summary.language}`}
        >
          <h3 className="font-display text-base font-semibold text-card-foreground">{summary.headline}</h3>

          <div className="mt-3 space-y-3">
            {summary.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-sm leading-relaxed text-foreground/85">
                {paragraph}
              </p>
            ))}
          </div>

          {summary.observations.length ? (
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {summary.observations.map((observation) => (
                <div
                  key={observation.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">{observation.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{observation.value}</p>
                  </div>
                  <TrendPill direction={observation.direction} />
                </div>
              ))}
            </div>
          ) : null}

          <p className="mt-5 rounded-xl border border-warning/40 bg-warning-soft px-3.5 py-3 text-xs leading-relaxed text-warning">
            {summary.disclaimer}
          </p>
        </SectionCard>
      ) : (
        <EmptyState
          title="No summary generated yet"
          message="Choose a language and select Generate Summary to fuse the selected patient's data into a plain-language observation report."
        />
      )}

      <SectionCard
        title="Multimodal Fusion Architecture"
        description="The data path the summary engine consumes, from sensors to local-language output."
      >
        <MultimodalDiagram />
      </SectionCard>
    </div>
  );
}
