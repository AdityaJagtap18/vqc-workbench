import { useState } from "react";
import { useLocation } from "react-router-dom";

import { StepAnsatz } from "../components/experiments/StepAnsatz";
import { StepClassical } from "../components/experiments/StepClassical";
import { StepDataset } from "../components/experiments/StepDataset";
import { StepFeatureMap } from "../components/experiments/StepFeatureMap";
import { StepOptimizer } from "../components/experiments/StepOptimizer";
import { StepPreprocessing } from "../components/experiments/StepPreprocessing";
import { StepReview } from "../components/experiments/StepReview";
import { StepTraining } from "../components/experiments/StepTraining";
import { Stepper } from "../components/experiments/Stepper";
import { TrainingMonitor } from "../components/experiments/TrainingMonitor";
import { PageHeader } from "../components/layout/PageHeader";
import { ResultsView } from "../components/results/ResultsView";
import { api } from "../services/api";
import type { DatasetPreviewResponse } from "../types/dataset";
import type { ExperimentCreateRequest, ExperimentDetail } from "../types/vqc";

const STEPS = [
  { key: "dataset", label: "Dataset" },
  { key: "preprocessing", label: "Preprocessing" },
  { key: "feature_map", label: "Feature Map" },
  { key: "ansatz", label: "Ansatz" },
  { key: "optimizer", label: "Optimizer" },
  { key: "training", label: "Training Config" },
  { key: "classical", label: "Classical" },
  { key: "review", label: "Review" },
  { key: "execute", label: "Execute & Results" },
];

const DEFAULT_DRAFT: ExperimentCreateRequest = {
  name: "",
  dataset: {
    dataset_id: "two_moons",
    selected_classes: null,
    test_size: 0.3,
    random_seed: 42,
    n_samples: 100,
    noise: 0.1,
  },
  preprocessing: { scaling: "standard", use_pca: false, n_components: null },
  feature_map: { feature_map: "ZZFeatureMap", n_qubits: 2, reps: 1, entanglement: "linear", paulis: null },
  ansatz: { ansatz: "RealAmplitudes", reps: 2, entanglement: "linear", su2_gates: null },
  optimizer: { optimizer: "COBYLA", maxiter: 60, learning_rate: null, perturbation: null, tolerance: null },
  training: {
    execution_mode: "ideal",
    shots: 1024,
    random_seed: 42,
    noise: { enabled: false, depolarizing_prob: 0.01, readout_error_prob: 0.01 },
  },
  classical: {
    logistic_regression: { enabled: true, search_hyperparameters: false },
    mlp: { enabled: true, search_hyperparameters: false },
    rbf_svm: { enabled: true, search_hyperparameters: false },
    random_forest: { enabled: false, search_hyperparameters: false },
  },
};

export default function NewExperiment() {
  const location = useLocation();
  const duplicated = (location.state as { duplicateConfig?: ExperimentCreateRequest } | null)?.duplicateConfig;
  const [draft, setDraft] = useState<ExperimentCreateRequest>(
    duplicated ? { ...duplicated, name: `${duplicated.name} (copy)` } : DEFAULT_DRAFT
  );
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [completedDetail, setCompletedDetail] = useState<ExperimentDetail | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  function goTo(index: number) {
    setStepIndex(index);
    setFurthestIndex((f) => Math.max(f, index));
  }

  const finalDim = draft.preprocessing.use_pca
    ? draft.preprocessing.n_components ?? 2
    : preview?.shape[1] ?? draft.feature_map.n_qubits;

  async function handleRun() {
    setRunning(true);
    setRunError(null);
    try {
      const detail = await api.createExperiment(draft);
      setExperimentId(detail.id);
      goTo(STEPS.length - 1);
    } catch (err) {
      setRunError(String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="New Experiment"
        description="Configure dataset, feature map, ansatz, optimizer, and classical baselines, then run a real VQC training job."
      />

      <Stepper steps={STEPS} currentIndex={stepIndex} furthestIndex={furthestIndex} onJump={goTo} />

      {stepIndex === 0 && (
        <StepDataset
          dataset={draft.dataset}
          onChange={(dataset) => setDraft({ ...draft, dataset })}
          onPreview={setPreview}
          onNext={() => goTo(1)}
        />
      )}
      {stepIndex === 1 && (
        <StepPreprocessing
          preprocessing={draft.preprocessing}
          onChange={(preprocessing) => setDraft({ ...draft, preprocessing })}
          preview={preview}
          onBack={() => goTo(0)}
          onNext={() => goTo(2)}
        />
      )}
      {stepIndex === 2 && (
        <StepFeatureMap
          config={draft.feature_map}
          onChange={(feature_map) => setDraft({ ...draft, feature_map })}
          ansatzConfig={draft.ansatz}
          finalDim={finalDim}
          onBack={() => goTo(1)}
          onNext={() => goTo(3)}
        />
      )}
      {stepIndex === 3 && (
        <StepAnsatz
          config={draft.ansatz}
          onChange={(ansatz) => setDraft({ ...draft, ansatz })}
          featureMapConfig={draft.feature_map}
          onBack={() => goTo(2)}
          onNext={() => goTo(4)}
        />
      )}
      {stepIndex === 4 && (
        <StepOptimizer
          config={draft.optimizer}
          onChange={(optimizer) => setDraft({ ...draft, optimizer })}
          onBack={() => goTo(3)}
          onNext={() => goTo(5)}
        />
      )}
      {stepIndex === 5 && (
        <StepTraining
          config={draft.training}
          onChange={(training) => setDraft({ ...draft, training })}
          onBack={() => goTo(4)}
          onNext={() => goTo(6)}
        />
      )}
      {stepIndex === 6 && (
        <StepClassical
          classical={draft.classical}
          onChange={(classical) => setDraft({ ...draft, classical })}
          onBack={() => goTo(5)}
          onNext={() => goTo(7)}
        />
      )}
      {stepIndex === 7 && (
        <StepReview
          draft={draft}
          name={draft.name}
          onNameChange={(name) => setDraft({ ...draft, name })}
          onBack={() => goTo(6)}
          onRun={handleRun}
          running={running}
          error={runError}
        />
      )}
      {stepIndex === 8 && experimentId && !completedDetail && (
        <TrainingMonitor experimentId={experimentId} onComplete={setCompletedDetail} />
      )}
      {stepIndex === 8 && completedDetail && <ResultsView detail={completedDetail} />}
    </div>
  );
}
