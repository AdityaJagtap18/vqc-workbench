import type { ExperimentCreateRequest } from "../../types/vqc";
import { SectionCard, StepNav } from "./FormControls";

export function StepReview({
  draft,
  name,
  onNameChange,
  onBack,
  onRun,
  running,
  error,
}: {
  draft: ExperimentCreateRequest;
  name: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onRun: () => void;
  running: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="Experiment name">
        <input
          className="w-full max-w-md rounded border border-border bg-canvas px-2 py-1.5 text-sm"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. zz-realamplitudes-two-moons"
        />
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Dataset">
          <dl className="grid grid-cols-2 gap-y-1 font-mono-tech text-sm">
            <dt className="text-muted">Dataset</dt>
            <dd>{draft.dataset.dataset_id}</dd>
            <dt className="text-muted">Test split</dt>
            <dd>{draft.dataset.test_size}</dd>
            <dt className="text-muted">Random seed</dt>
            <dd>{draft.dataset.random_seed}</dd>
          </dl>
        </SectionCard>

        <SectionCard title="Preprocessing">
          <dl className="grid grid-cols-2 gap-y-1 font-mono-tech text-sm">
            <dt className="text-muted">Scaling</dt>
            <dd>{draft.preprocessing.scaling}</dd>
            <dt className="text-muted">PCA</dt>
            <dd>{draft.preprocessing.use_pca ? `yes -> ${draft.preprocessing.n_components}` : "no"}</dd>
          </dl>
        </SectionCard>

        <SectionCard title="Quantum circuit">
          <dl className="grid grid-cols-2 gap-y-1 font-mono-tech text-sm">
            <dt className="text-muted">Feature map</dt>
            <dd>{draft.feature_map.feature_map}</dd>
            <dt className="text-muted">Qubits</dt>
            <dd>{draft.feature_map.n_qubits}</dd>
            <dt className="text-muted">Ansatz</dt>
            <dd>{draft.ansatz.ansatz}</dd>
            <dt className="text-muted">Ansatz reps</dt>
            <dd>{draft.ansatz.reps}</dd>
          </dl>
        </SectionCard>

        <SectionCard title="Optimizer & training">
          <dl className="grid grid-cols-2 gap-y-1 font-mono-tech text-sm">
            <dt className="text-muted">Optimizer</dt>
            <dd>{draft.optimizer.optimizer}</dd>
            <dt className="text-muted">Max iterations</dt>
            <dd>{draft.optimizer.maxiter}</dd>
            <dt className="text-muted">Execution</dt>
            <dd>{draft.training.execution_mode}</dd>
            {draft.training.execution_mode === "noisy" && (
              <>
                <dt className="text-muted">Depolarizing / readout</dt>
                <dd>
                  {draft.training.noise.depolarizing_prob} / {draft.training.noise.readout_error_prob}
                </dd>
              </>
            )}
          </dl>
        </SectionCard>

        <SectionCard title="Classical baselines" className="md:col-span-2">
          <dl className="grid grid-cols-2 gap-y-1 font-mono-tech text-sm">
            <dt className="text-muted">Logistic Regression</dt>
            <dd>{draft.classical.logistic_regression.enabled ? "enabled" : "disabled"}</dd>
            <dt className="text-muted">RBF SVM</dt>
            <dd>{draft.classical.rbf_svm.enabled ? "enabled" : "disabled"}</dd>
            <dt className="text-muted">MLP</dt>
            <dd>{draft.classical.mlp.enabled ? "enabled" : "disabled"}</dd>
            <dt className="text-muted">Random Forest</dt>
            <dd>{draft.classical.random_forest.enabled ? "enabled" : "disabled"}</dd>
          </dl>
        </SectionCard>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <StepNav
        onBack={onBack}
        onNext={onRun}
        nextLabel={running ? "Starting…" : "Run experiment"}
        nextDisabled={running || !name.trim()}
      />
    </div>
  );
}
