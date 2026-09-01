/**
 * AI rehabilitation summary service.
 *
 * `generateClinicalSummary(patientData, language)` is the single integration
 * point for the future on-device Small Language Model (SLM). Today it returns a
 * deterministic, rule-based summary — no cloud API, no model weights, no
 * network access required.
 *
 * To connect a local quantized SLM later, replace `runSummaryEngine` with a
 * call into the local runtime (e.g. llama.cpp / ONNX Runtime via a server
 * function) and keep the same input/output contract.
 */

import { METRIC_META, getDataQuality, getEnergyData, getGaitData, getPatientReports } from "./dataService";
import type { DailyRecord, DateRange, MetricTrend, PatientId } from "@/data/types";

export const SUMMARY_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "ml", label: "Malayalam" },
  { code: "hi", label: "Hindi" },
] as const;

export type SummaryLanguage = (typeof SUMMARY_LANGUAGES)[number]["code"];

export type SummaryEngine = "rule-based" | "local-slm";

/** Fusion input — the shape a local SLM would be prompted with. */
export interface FusedPatientData {
  patient_id: PatientId;
  range: DateRange;
  gait: ReturnType<typeof getGaitData>;
  energy: ReturnType<typeof getEnergyData>;
  reports: DailyRecord[];
  quality: ReturnType<typeof getDataQuality>;
}

export interface ClinicalSummary {
  engine: SummaryEngine;
  language: SummaryLanguage;
  generatedAt: string;
  latencyMs: number;
  headline: string;
  paragraphs: string[];
  observations: { label: string; value: string; direction: MetricTrend["direction"] }[];
  disclaimer: string;
}

/** Edge data fusion step: collect all modalities for one patient + range. */
export function fusePatientData(patientId: PatientId, range: DateRange): FusedPatientData {
  return {
    patient_id: patientId,
    range,
    gait: getGaitData(patientId, range),
    energy: getEnergyData(patientId, range),
    reports: getPatientReports(patientId, range),
    quality: getDataQuality(patientId, range),
  };
}

const DIRECTION_WORDS: Record<SummaryLanguage, Record<MetricTrend["direction"], string>> = {
  en: { increased: "increased", decreased: "decreased", stable: "remained relatively stable" },
  ta: { increased: "அதிகரித்தது", decreased: "குறைந்தது", stable: "ஒப்பீட்டளவில் நிலையாக இருந்தது" },
  ml: { increased: "വർദ്ധിച്ചു", decreased: "കുറഞ്ഞു", stable: "താരതമ്യേന സ്ഥിരമായി തുടർന്നു" },
  hi: { increased: "बढ़ा", decreased: "घटा", stable: "तुलनात्मक रूप से स्थिर रहा" },
};

const TEMPLATES: Record<
  SummaryLanguage,
  {
    headline: (patient: string) => string;
    activity: (v: Record<string, string>) => string;
    gait: (v: Record<string, string>) => string;
    energy: (v: Record<string, string>) => string;
    reported: (v: Record<string, string>) => string;
    quality: (v: Record<string, string>) => string;
    disclaimer: string;
  }
> = {
  en: {
    headline: (p) => `Rehabilitation monitoring observations for ${p}`,
    activity: (v) =>
      `During the selected monitoring period the system recorded ${v.steps} steps across ${v.days} days, covering approximately ${v.distance} km with ${v.minutes} minutes of walking activity. Compared with the previous period, recorded walking activity ${v.stepsTrend} (${v.stepsChange}).`,
    gait: (v) =>
      `The measured gait trend indicates that average gait speed ${v.speedTrend} to ${v.speed} m/s and average stride length ${v.strideTrend} to ${v.stride} cm. Recorded gait asymmetry ${v.asymTrend} to ${v.asym}% for the same window.`,
    energy: (v) =>
      `Kinetic energy harvesting followed the activity pattern: the recorded data shows an average of ${v.avgEnergy} mJ harvested per day, a maximum of ${v.maxEnergy} mJ, and ${v.stored} mJ stored at the last sample. Estimated average consumption was ${v.consumed} mJ per day (prototype reference status: ${v.energyStatus}).`,
    reported: (v) =>
      `Self-reported prototype scores for the period averaged pain ${v.pain}/100, sleep ${v.sleep}/100 and general condition ${v.general}/100. Reported sleep and general-condition scores ${v.generalTrend} relative to the previous period.`,
    quality: (v) =>
      `Data completeness for the window was ${v.completeness}% across ${v.records} daily records, with communication reported as ${v.communication}. Values originate from fictional demo data in the current prototype build.`,
    disclaimer:
      "This summary is generated for rehabilitation monitoring and research purposes only. It is not a medical diagnosis, and it does not describe clinical status, recovery or disease.",
  },
  ta: {
    headline: (p) => `${p} க்கான மறுவாழ்வு கண்காணிப்பு அவதானிப்புகள்`,
    activity: (v) =>
      `தேர்ந்தெடுக்கப்பட்ட கண்காணிப்புக் காலத்தில், ${v.days} நாட்களில் ${v.steps} அடிகள், சுமார் ${v.distance} கி.மீ தூரம் மற்றும் ${v.minutes} நிமிட நடை செயல்பாடு பதிவாகியுள்ளது. முந்தைய காலத்துடன் ஒப்பிடும்போது நடை செயல்பாடு ${v.stepsTrend} (${v.stepsChange}).`,
    gait: (v) =>
      `அளவிடப்பட்ட நடை போக்கு: சராசரி நடை வேகம் ${v.speedTrend}, தற்போது ${v.speed} மீ/வி; சராசரி அடி நீளம் ${v.strideTrend}, தற்போது ${v.stride} செ.மீ. நடை சமச்சீரின்மை ${v.asymTrend}, தற்போது ${v.asym}%.`,
    energy: (v) =>
      `இயக்க ஆற்றல் அறுவடை செயல்பாட்டைப் பின்பற்றியது: நாள் சராசரி ${v.avgEnergy} mJ, அதிகபட்சம் ${v.maxEnergy} mJ, கடைசி மாதிரியில் சேமிக்கப்பட்டது ${v.stored} mJ. மதிப்பிடப்பட்ட நுகர்வு நாளுக்கு ${v.consumed} mJ (முன்மாதிரி நிலை: ${v.energyStatus}).`,
    reported: (v) =>
      `நோயாளியால் சொந்தமாக அறிவிக்கப்பட்ட முன்மாதிரி மதிப்பெண்கள்: வலி ${v.pain}/100, தூக்கம் ${v.sleep}/100, பொது நிலை ${v.general}/100. தூக்கம் மற்றும் பொது நிலை மதிப்பெண்கள் ${v.generalTrend}.`,
    quality: (v) =>
      `இந்த காலத்திற்கான தரவு முழுமை ${v.completeness}% (${v.records} பதிவுகள்), தொடர்பு நிலை: ${v.communication}. தற்போதைய கட்டத்தில் இவை கற்பனையான demo தரவுகள்.`,
    disclaimer:
      "இந்த சுருக்கம் மறுவாழ்வு கண்காணிப்பு மற்றும் ஆய்வு நோக்கங்களுக்காக மட்டுமே. இது மருத்துவ நோயறிதல் அல்ல.",
  },
  ml: {
    headline: (p) => `${p} നായുള്ള പുനരധിവാസ നിരീക്ഷണ കണ്ടെത്തലുകൾ`,
    activity: (v) =>
      `തിരഞ്ഞെടുത്ത നിരീക്ഷണ കാലയളവിൽ ${v.days} ദിവസങ്ങളിൽ ${v.steps} ചുവടുകൾ, ഏകദേശം ${v.distance} കി.മീ, ${v.minutes} മിനിറ്റ് നടത്ത പ്രവർത്തനം രേഖപ്പെടുത്തി. മുൻ കാലയളവുമായി താരതമ്യം ചെയ്യുമ്പോൾ നടത്ത പ്രവർത്തനം ${v.stepsTrend} (${v.stepsChange}).`,
    gait: (v) =>
      `അളന്ന നടത്ത പ്രവണത: ശരാശരി വേഗത ${v.speedTrend}, നിലവിൽ ${v.speed} മീ/സെ; ശരാശരി ചുവടു നീളം ${v.strideTrend}, നിലവിൽ ${v.stride} സെ.മീ. നടത്ത അസമത ${v.asymTrend}, നിലവിൽ ${v.asym}%.`,
    energy: (v) =>
      `ഊർജ്ജ ശേഖരണം പ്രവർത്തനത്തിനൊപ്പം നീങ്ങി: പ്രതിദിന ശരാശരി ${v.avgEnergy} mJ, പരമാവധി ${v.maxEnergy} mJ, അവസാന സാമ്പിളിൽ സംഭരിച്ചത് ${v.stored} mJ. കണക്കാക്കിയ ഉപഭോഗം പ്രതിദിനം ${v.consumed} mJ (പ്രോട്ടോടൈപ്പ് നില: ${v.energyStatus}).`,
    reported: (v) =>
      `സ്വയം റിപ്പോർട്ട് ചെയ്ത പ്രോട്ടോടൈപ്പ് സ്കോറുകൾ: വേദന ${v.pain}/100, ഉറക്കം ${v.sleep}/100, പൊതു അവസ്ഥ ${v.general}/100. ഉറക്കവും പൊതു അവസ്ഥയും ${v.generalTrend}.`,
    quality: (v) =>
      `ഡാറ്റ പൂർണ്ണത ${v.completeness}% (${v.records} രേഖകൾ), ആശയവിനിമയം: ${v.communication}. നിലവിലെ ഘട്ടത്തിൽ ഇവ സാങ്കൽപ്പിക ഡെമോ ഡാറ്റയാണ്.`,
    disclaimer:
      "ഈ സംഗ്രഹം പുനരധിവാസ നിരീക്ഷണത്തിനും ഗവേഷണത്തിനും മാത്രമുള്ളതാണ്. ഇത് ഒരു മെഡിക്കൽ രോഗനിർണയമല്ല.",
  },
  hi: {
    headline: (p) => `${p} के लिए पुनर्वास निगरानी अवलोकन`,
    activity: (v) =>
      `चयनित निगरानी अवधि में सिस्टम ने ${v.days} दिनों में ${v.steps} कदम, लगभग ${v.distance} किमी दूरी और ${v.minutes} मिनट की चलने की गतिविधि दर्ज की। पिछली अवधि की तुलना में दर्ज गतिविधि ${v.stepsTrend} (${v.stepsChange})।`,
    gait: (v) =>
      `मापी गई चाल प्रवृत्ति: औसत चाल गति ${v.speedTrend}, वर्तमान ${v.speed} मी/से; औसत स्ट्राइड लंबाई ${v.strideTrend}, वर्तमान ${v.stride} सेमी। चाल असमानता ${v.asymTrend}, वर्तमान ${v.asym}%।`,
    energy: (v) =>
      `ऊर्जा संचयन गतिविधि के अनुरूप रहा: प्रतिदिन औसत ${v.avgEnergy} mJ, अधिकतम ${v.maxEnergy} mJ, अंतिम सैंपल पर संग्रहित ${v.stored} mJ। अनुमानित खपत ${v.consumed} mJ प्रतिदिन (प्रोटोटाइप स्थिति: ${v.energyStatus})।`,
    reported: (v) =>
      `स्व-रिपोर्ट किए गए प्रोटोटाइप स्कोर: दर्द ${v.pain}/100, नींद ${v.sleep}/100, सामान्य स्थिति ${v.general}/100। नींद और सामान्य स्थिति स्कोर ${v.generalTrend}।`,
    quality: (v) =>
      `इस अवधि के लिए डेटा पूर्णता ${v.completeness}% रही (${v.records} रिकॉर्ड), संचार स्थिति: ${v.communication}। वर्तमान बिल्ड में ये काल्पनिक डेमो डेटा हैं।`,
    disclaimer:
      "यह सारांश केवल पुनर्वास निगरानी और शोध उद्देश्यों के लिए है। यह कोई चिकित्सीय निदान नहीं है।",
  },
};

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

const trendOf = (trends: MetricTrend[], key: string) => trends.find((t) => t.key === key);

function formatChange(trend?: MetricTrend): string {
  if (!trend) return "—";
  const sign = trend.changePercent > 0 ? "+" : "";
  return `${sign}${trend.changePercent}%`;
}

/** Replaceable engine: swap this body for a local SLM call. */
function runSummaryEngine(data: FusedPatientData, language: SummaryLanguage): Omit<ClinicalSummary, "latencyMs"> {
  const t = TEMPLATES[language] ?? TEMPLATES.en;
  const words = DIRECTION_WORDS[language] ?? DIRECTION_WORDS.en;
  const { gait, energy, reports, quality } = data;

  const stepsTrend = trendOf(gait.trends, "steps");
  const speedTrend = trendOf(gait.trends, "gait_speed");
  const strideTrend = trendOf(gait.trends, "stride_length_cm");
  const asymTrend = trendOf(gait.trends, "gait_asymmetry");

  const generalAvg = Math.round(mean(reports.map((r) => r.general_condition_score)));
  const generalPrev = Math.round(
    mean(gait.previousSeries.map((r) => r.general_condition_score)) || generalAvg,
  );
  const generalDelta = generalPrev ? ((generalAvg - generalPrev) / generalPrev) * 100 : 0;
  const generalDirection: MetricTrend["direction"] =
    Math.abs(generalDelta) < 1.5 ? "stable" : generalDelta > 0 ? "increased" : "decreased";

  const values: Record<string, string> = {
    days: String(gait.windowDays),
    steps: gait.totals.steps.toLocaleString("en-US"),
    distance: String(gait.totals.distance_km),
    minutes: String(gait.totals.activity_minutes),
    stepsTrend: words[stepsTrend?.direction ?? "stable"],
    stepsChange: formatChange(stepsTrend),
    speed: String(gait.averages.gait_speed),
    speedTrend: words[speedTrend?.direction ?? "stable"],
    stride: String(gait.averages.stride_length_cm),
    strideTrend: words[strideTrend?.direction ?? "stable"],
    asym: String(gait.averages.gait_asymmetry),
    asymTrend: words[asymTrend?.direction ?? "stable"],
    avgEnergy: String(energy.averageDaily),
    maxEnergy: String(energy.maximum),
    stored: String(energy.stored),
    consumed: String(energy.estimatedConsumption),
    energyStatus: energy.status,
    pain: String(Math.round(mean(reports.map((r) => r.pain_score)))),
    sleep: String(Math.round(mean(reports.map((r) => r.sleep_score)))),
    general: String(generalAvg),
    generalTrend: words[generalDirection],
    completeness: String(quality.completeness),
    records: String(quality.records),
    communication: quality.communication,
  };

  const observations: ClinicalSummary["observations"] = [
    stepsTrend, speedTrend, strideTrend, asymTrend,
  ]
    .filter((x): x is MetricTrend => Boolean(x))
    .map((trend) => ({
      label: `${METRIC_META[trend.key].label} (${trend.unit})`,
      value: `${trend.current} · ${formatChange(trend)}`,
      direction: trend.direction,
    }));

  return {
    engine: "rule-based",
    language,
    generatedAt: new Date().toISOString(),
    headline: t.headline(data.patient_id),
    paragraphs: [t.activity(values), t.gait(values), t.energy(values), t.reported(values), t.quality(values)],
    observations,
    disclaimer: t.disclaimer,
  };
}

/**
 * Public interface — mirrors the future Python signature
 * `generate_clinical_summary(patient_data, language)`.
 */
export function generateClinicalSummary(
  patientData: FusedPatientData,
  language: SummaryLanguage = "en",
): ClinicalSummary {
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (!patientData.gait.series.length) {
    return {
      engine: "rule-based",
      language,
      generatedAt: new Date().toISOString(),
      latencyMs: 0,
      headline: "No data available for the selected filters",
      paragraphs: [
        "No daily records were found for the selected patient and date range, so no summary could be generated. Widen the date range or select another demo patient.",
      ],
      observations: [],
      disclaimer: (TEMPLATES[language] ?? TEMPLATES.en).disclaimer,
    };
  }
  const result = runSummaryEngine(patientData, language);
  const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  return { ...result, latencyMs: Math.max(1, Math.round(endedAt - startedAt)) };
}

export function summaryToPlainText(summary: ClinicalSummary): string {
  return [
    summary.headline,
    "",
    ...summary.paragraphs,
    "",
    `Engine: ${summary.engine} (local SLM integration: planned)`,
    `Language: ${summary.language}`,
    `Generated: ${summary.generatedAt}`,
    "",
    summary.disclaimer,
  ].join("\n");
}
