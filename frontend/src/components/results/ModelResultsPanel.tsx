import { Fragment } from "react";

import type { ExperimentResult, ModelResult } from "../../types/vqc";
import { SectionCard } from "../experiments/FormControls";
import { ConfusionMatrix } from "./ConfusionMatrix";
import { CurveChart } from "./CurveChart";

const MODEL_LABELS: Record<string, string> = {
  vqc: "Variational Quantum Classifier (VQC)",
  logistic_regression: "Logistic Regression",
  rbf_svm: "RBF SVM",
  mlp: "MLP",
  random_forest: "Random Forest",
};

const METRIC_LABELS: [keyof ModelResult["metrics"], string][] = [
  ["accuracy", "Accuracy"],
  ["precision", "Precision"],
  ["recall", "Recall"],
  ["f1", "F1"],
  ["balanced_accuracy", "Balanced accuracy"],
  ["mcc", "MCC"],
  ["roc_auc", "ROC-AUC"],
  ["pr_auc", "PR-AUC"],
];

function ModelCard({ name, model, classNames }: { name: string; model: ModelResult; classNames: string[] }) {
  return (
    <SectionCard title={MODEL_LABELS[name] ?? name}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <dl className="grid grid-cols-2 gap-y-1 font-mono-tech text-sm">
          {METRIC_LABELS.map(([key, label]) => {
            const value = model.metrics[key];
            return (
              <Fragment key={key}>
                <dt className="text-muted">{label}</dt>
                <dd>{typeof value === "number" ? value.toFixed(3) : "—"}</dd>
              </Fragment>
            );
          })}
          <dt className="text-muted">Train time</dt>
          <dd>{model.train_seconds.toFixed(3)}s</dd>
          <dt className="text-muted">Inference time</dt>
          <dd>{model.inference_seconds.toFixed(4)}s</dd>
        </dl>

        <div>
          <p className="mb-1 text-xs text-muted">Confusion matrix</p>
          <ConfusionMatrix matrix={model.metrics.confusion_matrix} classNames={classNames} />
        </div>

        <div className="space-y-3">
          {model.metrics.roc_curve && (
            <div>
              <p className="text-xs text-muted">ROC curve</p>
              <CurveChart
                points={model.metrics.roc_curve.fpr.map((x, i) => ({ x, y: model.metrics.roc_curve!.tpr[i] }))}
                xKey="fpr"
                yKey="tpr"
                xLabel="FPR"
                yLabel="TPR"
              />
            </div>
          )}
          {model.metrics.pr_curve && (
            <div>
              <p className="text-xs text-muted">Precision-Recall curve</p>
              <CurveChart
                points={model.metrics.pr_curve.recall.map((x, i) => ({ x, y: model.metrics.pr_curve!.precision[i] }))}
                xKey="recall"
                yKey="precision"
                xLabel="Recall"
                yLabel="Precision"
              />
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

export function ModelResultsPanel({ result }: { result: ExperimentResult }) {
  return (
    <div className="space-y-5">
      {Object.entries(result.models).map(([name, model]) => (
        <ModelCard key={name} name={name} model={model} classNames={result.dataset.class_names} />
      ))}
    </div>
  );
}
