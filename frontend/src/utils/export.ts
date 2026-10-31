import type { ExperimentDetail } from "../types/vqc";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportExperimentJson(detail: ExperimentDetail) {
  download(`${detail.name}-experiment.json`, JSON.stringify(detail, null, 2), "application/json");
}

export function exportMetricsCsv(detail: ExperimentDetail) {
  if (!detail.result) return;
  const names = Object.keys(detail.result.models);
  const metricKeys = ["accuracy", "precision", "recall", "f1", "balanced_accuracy", "mcc", "roc_auc", "pr_auc"] as const;
  const header = ["model", ...metricKeys, "train_seconds", "inference_seconds"];
  const rows = names.map((n) => {
    const m = detail.result!.models[n];
    return [n, ...metricKeys.map((k) => String(m.metrics[k] ?? "")), m.train_seconds, m.inference_seconds].join(",");
  });
  download(`${detail.name}-metrics.csv`, [header.join(","), ...rows].join("\n"), "text/csv");
}

export function exportTrainingHistoryCsv(detail: ExperimentDetail) {
  const history = detail.training_history ?? [];
  const header = "step,objective_value";
  const rows = history.map((p) => `${p.step},${p.objective_value}`);
  download(`${detail.name}-training-history.csv`, [header, ...rows].join("\n"), "text/csv");
}

export function exportMarkdownReport(detail: ExperimentDetail) {
  if (!detail.result) return;
  const r = detail.result;
  const lines: string[] = [];
  lines.push(`# VQC experiment report: ${detail.name}`);
  lines.push("");
  lines.push(`Dataset: ${r.dataset.name} (${r.dataset.n_samples} samples, ${r.dataset.n_features} features)`);
  lines.push(`Train/test: ${r.dataset.train_size}/${r.dataset.test_size}, seed ${r.dataset.random_seed}`);
  lines.push(`Preprocessing: ${r.preprocessing.pipeline.join(" -> ")} (${r.preprocessing.original_dim} -> ${r.preprocessing.final_dim} dims)`);
  lines.push(`Circuit: ${r.circuit.feature_map} + ${r.circuit.ansatz} on ${r.circuit.n_qubits} qubits, combined depth ${r.circuit.combined_depth}, ${r.circuit.n_trainable_parameters} trainable parameters`);
  lines.push(`Optimizer: ${r.training.optimizer}, ${r.training.n_function_evaluations}/${r.training.configured_maxiter} evaluations, execution: ${r.training.execution_mode}`);
  lines.push(`Stopped reason: ${r.training.stopped_reason}`);
  lines.push("");
  lines.push("## Model comparison");
  lines.push("");
  lines.push("| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | Train (s) | Inference (s) |");
  lines.push("|---|---|---|---|---|---|---|---|");
  for (const [name, model] of Object.entries(r.models)) {
    lines.push(
      `| ${name} | ${model.metrics.accuracy.toFixed(3)} | ${model.metrics.precision.toFixed(3)} | ${model.metrics.recall.toFixed(3)} | ${model.metrics.f1.toFixed(3)} | ${model.metrics.roc_auc?.toFixed(3) ?? "n/a"} | ${model.train_seconds.toFixed(3)} | ${model.inference_seconds.toFixed(4)} |`
    );
  }
  lines.push("");
  lines.push("## Software versions");
  lines.push("");
  for (const [pkg, version] of Object.entries(r.software_versions)) {
    lines.push(`- ${pkg}: ${version}`);
  }
  download(`${detail.name}-report.md`, lines.join("\n"), "text/markdown");
}
