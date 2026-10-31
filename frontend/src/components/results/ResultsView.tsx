import { Download } from "lucide-react";
import { useState } from "react";

import type { ExperimentDetail } from "../../types/vqc";
import {
  exportExperimentJson,
  exportMarkdownReport,
  exportMetricsCsv,
  exportTrainingHistoryCsv,
} from "../../utils/export";
import { CircuitAnalysisPanel } from "./CircuitAnalysisPanel";
import { ComparisonPanel } from "./ComparisonPanel";
import { ModelResultsPanel } from "./ModelResultsPanel";

type Tab = "comparison" | "models" | "circuit";

export function ResultsView({ detail }: { detail: ExperimentDetail }) {
  const [tab, setTab] = useState<Tab>("comparison");
  const result = detail.result;
  if (!result) return null;

  const TABS: { key: Tab; label: string }[] = [
    { key: "comparison", label: "Model Comparison" },
    { key: "models", label: "Model Results" },
    { key: "circuit", label: "Circuit Analysis" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-1 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButton label="CSV metrics" onClick={() => exportMetricsCsv(detail)} />
          <ExportButton label="Training history" onClick={() => exportTrainingHistoryCsv(detail)} />
          <ExportButton label="JSON" onClick={() => exportExperimentJson(detail)} />
          <ExportButton label="Markdown report" onClick={() => exportMarkdownReport(detail)} />
        </div>
      </div>

      {tab === "comparison" && <ComparisonPanel result={result} />}
      {tab === "models" && <ModelResultsPanel result={result} />}
      {tab === "circuit" && <CircuitAnalysisPanel detail={detail} />}
    </div>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 border border-border px-2.5 py-1 text-xs text-ink hover:bg-canvas"
    >
      <Download size={12} />
      {label}
    </button>
  );
}
