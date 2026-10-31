import type { DecisionBoundary } from "../../types/vqc";
import { SectionCard } from "../experiments/FormControls";
import { DecisionBoundaryPlot } from "./DecisionBoundaryPlot";

const MODEL_LABELS: Record<string, string> = {
  vqc: "VQC",
  logistic_regression: "Logistic Regression",
  rbf_svm: "RBF SVM",
  mlp: "MLP",
  random_forest: "Random Forest",
};

export function DecisionBoundarySection({ boundary }: { boundary: DecisionBoundary | undefined }) {
  if (!boundary || !boundary.available) {
    return (
      <SectionCard title="Decision boundary">
        <p className="text-sm text-muted">
          {boundary && !boundary.available
            ? boundary.reason
            : "Not available for this experiment."}
        </p>
      </SectionCard>
    );
  }

  const modelNames = Object.keys(boundary.labels);

  return (
    <SectionCard title="Decision boundary comparison">
      <p className="mb-3 text-xs text-muted">
        Computed directly in the model's actual 2D preprocessed feature space — not a
        projection. Dots: training samples (solid) and test samples (white ring), colored by
        true label. Background: predicted region.
      </p>
      <div className="flex flex-wrap gap-6">
        {modelNames.map((name) => (
          <DecisionBoundaryPlot
            key={name}
            title={MODEL_LABELS[name] ?? name}
            xs={boundary.xs}
            ys={boundary.ys}
            grid={boundary.labels[name]}
            trainPoints={boundary.train_points}
            testPoints={boundary.test_points}
          />
        ))}
      </div>
    </SectionCard>
  );
}
