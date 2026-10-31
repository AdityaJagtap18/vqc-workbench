import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ExperimentResult } from "../../types/vqc";
import { SectionCard } from "../experiments/FormControls";
import { DecisionBoundarySection } from "./DecisionBoundarySection";

const MODEL_LABELS: Record<string, string> = {
  vqc: "VQC",
  logistic_regression: "Logistic Regression",
  rbf_svm: "RBF SVM",
  mlp: "MLP",
  random_forest: "Random Forest",
};
const MODEL_COLORS: Record<string, string> = {
  vqc: "#315E9E",
  logistic_regression: "#697386",
  rbf_svm: "#1F8A5A",
  mlp: "#B5750A",
  random_forest: "#8E44AD",
};

const METRIC_ROWS: [string, string][] = [
  ["accuracy", "Accuracy"],
  ["precision", "Precision"],
  ["recall", "Recall"],
  ["f1", "F1"],
  ["roc_auc", "ROC-AUC"],
  ["pr_auc", "PR-AUC"],
  ["balanced_accuracy", "Balanced accuracy"],
  ["mcc", "MCC"],
];

export function ComparisonPanel({ result }: { result: ExperimentResult }) {
  const names = Object.keys(result.models);

  const metricChartData = METRIC_ROWS.map(([key, label]) => {
    const row: Record<string, string | number> = { metric: label };
    for (const name of names) {
      const value = (result.models[name].metrics as any)[key];
      row[name] = typeof value === "number" ? value : 0;
    }
    return row;
  });

  const timingData = [
    {
      metric: "Train time (s)",
      ...Object.fromEntries(names.map((n) => [n, result.models[n].train_seconds])),
    },
    {
      metric: "Inference time (s)",
      ...Object.fromEntries(names.map((n) => [n, result.models[n].inference_seconds])),
    },
  ];

  const bestAccuracy = names.reduce((a, b) => (result.models[a].metrics.accuracy >= result.models[b].metrics.accuracy ? a : b));
  const bestF1 = names.reduce((a, b) => (result.models[a].metrics.f1 >= result.models[b].metrics.f1 ? a : b));
  const fastestTrain = names.reduce((a, b) => (result.models[a].train_seconds <= result.models[b].train_seconds ? a : b));
  const vqcAcc = result.models.vqc?.metrics.accuracy;
  const classicalNames = names.filter((n) => n !== "vqc");
  const bestClassical = classicalNames.length
    ? classicalNames.reduce((a, b) => (result.models[a].metrics.accuracy >= result.models[b].metrics.accuracy ? a : b))
    : null;

  return (
    <div className="space-y-5">
      <SectionCard title="Training summary">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-1.5 font-mono-tech text-sm">
          <dt className="text-muted">Optimizer</dt>
          <dd>{result.training.optimizer}</dd>
          <dt className="text-muted">Execution</dt>
          <dd>{result.training.execution_mode}</dd>
          <dt className="text-muted">Initial loss</dt>
          <dd>{result.training.initial_objective?.toFixed(4) ?? "n/a"}</dd>
          <dt className="text-muted">Final loss</dt>
          <dd>{result.training.final_objective?.toFixed(4) ?? "n/a"}</dd>
          <dt className="text-muted">Best loss</dt>
          <dd>{result.training.best_objective?.toFixed(4) ?? "n/a"}</dd>
          <dt className="text-muted">Evaluations</dt>
          <dd>
            {result.training.n_function_evaluations} / {result.training.configured_maxiter}
          </dd>
          <dt className="text-muted">Train time</dt>
          <dd>{result.training.train_seconds.toFixed(3)}s</dd>
          <dt className="text-muted">Qubits / trainable params</dt>
          <dd>
            {result.circuit.n_qubits} / {result.circuit.n_trainable_parameters}
          </dd>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted">{result.training.stopped_reason}</p>
      </SectionCard>

      <SectionCard title="Metric comparison">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-2 py-1 font-medium">Metric</th>
                {names.map((n) => (
                  <th key={n} className="px-2 py-1 font-medium">
                    {MODEL_LABELS[n] ?? n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map(([key, label]) => (
                <tr key={key} className="border-b border-border/60">
                  <td className="px-2 py-1 text-muted">{label}</td>
                  {names.map((n) => {
                    const value = (result.models[n].metrics as any)[key];
                    return (
                      <td key={n} className="px-2 py-1 font-mono-tech">
                        {typeof value === "number" ? value.toFixed(3) : "n/a"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-b border-border/60">
                <td className="px-2 py-1 text-muted">Train time (s)</td>
                {names.map((n) => (
                  <td key={n} className="px-2 py-1 font-mono-tech">
                    {result.models[n].train_seconds.toFixed(3)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-2 py-1 text-muted">Inference time (s)</td>
                {names.map((n) => (
                  <td key={n} className="px-2 py-1 font-mono-tech">
                    {result.models[n].inference_seconds.toFixed(4)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <DecisionBoundarySection boundary={result.decision_boundary} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Grouped metric comparison">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metricChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" />
              <XAxis dataKey="metric" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {names.map((n) => (
                <Bar key={n} dataKey={n} name={MODEL_LABELS[n] ?? n} fill={MODEL_COLORS[n] ?? "#315E9E"} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Training / inference time comparison">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" />
              <XAxis dataKey="metric" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {names.map((n) => (
                <Bar key={n} dataKey={n} name={MODEL_LABELS[n] ?? n} fill={MODEL_COLORS[n] ?? "#315E9E"} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="ROC curve comparison">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" />
              <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fontSize: 9 }} />
              <YAxis type="number" domain={[0, 1]} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {names.map((n) => {
                const curve = result.models[n].metrics.roc_curve;
                if (!curve) return null;
                const data = curve.fpr.map((x, i) => ({ fpr: x, [n]: curve.tpr[i] }));
                return (
                  <Line
                    key={n}
                    data={data}
                    type="monotone"
                    dataKey={n}
                    name={MODEL_LABELS[n] ?? n}
                    stroke={MODEL_COLORS[n] ?? "#315E9E"}
                    dot={false}
                    strokeWidth={2}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Precision-Recall curve comparison">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" />
              <XAxis dataKey="recall" type="number" domain={[0, 1]} tick={{ fontSize: 9 }} />
              <YAxis type="number" domain={[0, 1]} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {names.map((n) => {
                const curve = result.models[n].metrics.pr_curve;
                if (!curve) return null;
                const data = curve.recall.map((x, i) => ({ recall: x, [n]: curve.precision[i] }));
                return (
                  <Line
                    key={n}
                    data={data}
                    type="monotone"
                    dataKey={n}
                    name={MODEL_LABELS[n] ?? n}
                    stroke={MODEL_COLORS[n] ?? "#315E9E"}
                    dot={false}
                    strokeWidth={2}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <SectionCard title="Research interpretation">
        <ul className="list-inside list-disc space-y-1.5 text-sm text-ink">
          <li>
            Highest accuracy: <strong>{MODEL_LABELS[bestAccuracy] ?? bestAccuracy}</strong> (
            {result.models[bestAccuracy].metrics.accuracy.toFixed(3)})
          </li>
          <li>
            Highest F1: <strong>{MODEL_LABELS[bestF1] ?? bestF1}</strong> ({result.models[bestF1].metrics.f1.toFixed(3)})
          </li>
          <li>
            Fastest training: <strong>{MODEL_LABELS[fastestTrain] ?? fastestTrain}</strong> (
            {result.models[fastestTrain].train_seconds.toFixed(3)}s)
          </li>
          {vqcAcc !== undefined && bestClassical && (
            <li>
              {vqcAcc > result.models[bestClassical].metrics.accuracy
                ? `VQC achieved higher accuracy (${vqcAcc.toFixed(3)}) than the best classical baseline, ${MODEL_LABELS[bestClassical]} (${result.models[bestClassical].metrics.accuracy.toFixed(3)}), on this split.`
                : vqcAcc < result.models[bestClassical].metrics.accuracy
                ? `The classical ${MODEL_LABELS[bestClassical]} baseline outperformed VQC on this split (${result.models[bestClassical].metrics.accuracy.toFixed(3)} vs ${vqcAcc.toFixed(3)} accuracy).`
                : `VQC and the best classical baseline (${MODEL_LABELS[bestClassical]}) tied on accuracy (${vqcAcc.toFixed(3)}) on this split.`}
            </li>
          )}
          <li>
            Training {result.training.stopped_reason} — this is not a claim of convergence,
            since none of the supported optimizers expose a convergence flag.
          </li>
          <li>
            Circuit: {result.circuit.feature_map} + {result.circuit.ansatz} on {result.circuit.n_qubits}{" "}
            qubits, combined depth {result.circuit.combined_depth}, {result.circuit.n_trainable_parameters}{" "}
            trainable parameters.
          </li>
          <li>
            Limitations: results come from a single train/test split of {result.dataset.n_samples}{" "}
            classically simulated samples — treat this as a methodology check, not evidence of
            quantum advantage. Repeat with multiple seeds before drawing conclusions.
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
