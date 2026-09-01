import { ArrowDown, BrainCircuit, Footprints, HeartPulse, MessageSquareText, Zap } from "lucide-react";

const SOURCES = [
  { icon: Footprints, source: "Smart Insole", output: "Gait Data", detail: "4 pressure sensors + 3-axis IMU" },
  { icon: HeartPulse, source: "Smart Band / Activity", output: "Activity Data", detail: "Steps, heart rate, sleep (optional)" },
  { icon: MessageSquareText, source: "Patient Input", output: "Self-Reported Data", detail: "Pain, sleep, mood, appetite" },
  { icon: Zap, source: "Energy Harvester", output: "Energy Data", detail: "Piezo/tribo harvest + supercapacitor" },
];

/** Visual architecture of the multimodal edge-fusion pipeline. */
export function MultimodalDiagram() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SOURCES.map((item) => (
          <div key={item.source} className="rounded-xl border border-border bg-surface p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <item.icon className="size-4" aria-hidden="true" />
              </span>
              <p className="text-xs font-semibold text-card-foreground">{item.source}</p>
            </div>
            <ArrowDown className="my-2 size-3.5 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs font-medium text-primary">{item.output}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <ArrowDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary-soft p-4 text-center">
        <p className="font-display text-sm font-semibold text-primary">Edge Data Fusion</p>
        <p className="mt-1 text-[11px] text-primary/80">
          All modalities are aligned per patient and per day on the edge device before summarisation.
        </p>
      </div>

      <div className="flex justify-center">
        <ArrowDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-3.5 text-center">
          <BrainCircuit className="mx-auto size-4 text-accent" aria-hidden="true" />
          <p className="mt-2 text-xs font-semibold text-card-foreground">Local SLM</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Planned — rule-based engine active today</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3.5 text-center">
          <p className="text-xs font-semibold text-card-foreground">Clinical Summary</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Non-diagnostic observation text</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3.5 text-center">
          <p className="text-xs font-semibold text-card-foreground">Selected Local Language</p>
          <p className="mt-1 text-[11px] text-muted-foreground">English · Tamil · Malayalam · Hindi</p>
        </div>
      </div>
    </div>
  );
}
