import type { ClassicalConfig, ClassicalModelConfig } from "../../types/vqc";
import { SectionCard, StepNav } from "./FormControls";

function ModelRow({
  title,
  explanation,
  config,
  onChange,
}: {
  title: string;
  explanation: string;
  config: ClassicalModelConfig;
  onChange: (next: ClassicalModelConfig) => void;
}) {
  return (
    <div className="rounded border border-border p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
        />
        {title}
      </label>
      <p className="mb-2 mt-1 text-xs text-muted">{explanation}</p>
      <label className="flex items-center gap-2 text-xs text-ink">
        <input
          type="checkbox"
          checked={config.search_hyperparameters}
          disabled={!config.enabled}
          onChange={(e) => onChange({ ...config, search_hyperparameters: e.target.checked })}
        />
        Use grid-search hyperparameter tuning
      </label>
    </div>
  );
}

export function StepClassical({
  classical,
  onChange,
  onBack,
  onNext,
}: {
  classical: ClassicalConfig;
  onChange: (next: ClassicalConfig) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="Classical baselines">
        <p className="mb-4 text-xs text-muted">
          Every enabled baseline trains on the identical split and preprocessing as the VQC.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ModelRow
            title="Logistic Regression"
            explanation="A linear classifier — the simplest fair baseline."
            config={classical.logistic_regression}
            onChange={(v) => onChange({ ...classical, logistic_regression: v })}
          />
          <ModelRow
            title="RBF SVM"
            explanation="A nonlinear classical kernel method — a strong classical comparison point."
            config={classical.rbf_svm}
            onChange={(v) => onChange({ ...classical, rbf_svm: v })}
          />
          <ModelRow
            title="MLP (neural network)"
            explanation="A small feed-forward neural network — scikit-learn's MLPClassifier."
            config={classical.mlp}
            onChange={(v) => onChange({ ...classical, mlp: v })}
          />
          <ModelRow
            title="Random Forest (optional)"
            explanation="An ensemble of decision trees, included for a broader classical comparison."
            config={classical.random_forest}
            onChange={(v) => onChange({ ...classical, random_forest: v })}
          />
        </div>
      </SectionCard>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  );
}
