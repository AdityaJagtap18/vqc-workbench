import type { DatasetConfigRequest } from "./dataset";

export type FeatureMapType = "ZFeatureMap" | "ZZFeatureMap" | "PauliFeatureMap";
export type AnsatzType = "RealAmplitudes" | "EfficientSU2";
export type Entanglement = "linear" | "circular" | "full";
export type ScalingMethod = "standard" | "minmax" | "none";
export type OptimizerType = "COBYLA" | "SPSA" | "L_BFGS_B" | "GradientDescent";
export type ExecutionMode = "ideal" | "noisy";

export interface PreprocessingConfig {
  scaling: ScalingMethod;
  use_pca: boolean;
  n_components: number | null;
}

export interface FeatureMapConfig {
  feature_map: FeatureMapType;
  n_qubits: number;
  reps: number;
  entanglement: Entanglement;
  paulis: string[] | null;
}

export interface AnsatzConfig {
  ansatz: AnsatzType;
  reps: number;
  entanglement: Entanglement;
  su2_gates: string[] | null;
}

export interface OptimizerConfig {
  optimizer: OptimizerType;
  maxiter: number;
  learning_rate: number | null;
  perturbation: number | null;
  tolerance: number | null;
}

export interface NoiseConfig {
  enabled: boolean;
  depolarizing_prob: number;
  readout_error_prob: number;
}

export interface VQCTrainingConfig {
  execution_mode: ExecutionMode;
  shots: number;
  random_seed: number;
  noise: NoiseConfig;
}

export interface ClassicalModelConfig {
  enabled: boolean;
  search_hyperparameters: boolean;
}

export interface ClassicalConfig {
  logistic_regression: ClassicalModelConfig;
  mlp: ClassicalModelConfig;
  rbf_svm: ClassicalModelConfig;
  random_forest: ClassicalModelConfig;
}

export interface ExperimentCreateRequest {
  name: string;
  dataset: DatasetConfigRequest;
  preprocessing: PreprocessingConfig;
  feature_map: FeatureMapConfig;
  ansatz: AnsatzConfig;
  optimizer: OptimizerConfig;
  training: VQCTrainingConfig;
  classical: ClassicalConfig;
}

export type ExperimentStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type ExperimentStage =
  | "QUEUED"
  | "VALIDATING"
  | "PREPROCESSING"
  | "BUILDING_CIRCUIT"
  | "TRAINING_VQC"
  | "TRAINING_CLASSICAL_MODELS"
  | "EVALUATING"
  | "COMPLETED"
  | "FAILED";

export interface ExperimentSummary {
  id: string;
  name: string;
  status: ExperimentStatus;
  stage: ExperimentStage;
  dataset_id: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

export interface TrainingHistoryPoint {
  step: number;
  objective_value: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  balanced_accuracy: number;
  mcc: number;
  roc_auc: number | null;
  pr_auc: number | null;
  confusion_matrix: number[][];
  roc_curve: { fpr: number[]; tpr: number[] } | null;
  pr_curve: { precision: number[]; recall: number[] } | null;
}

export interface ModelResult {
  metrics: ModelMetrics;
  train_seconds: number;
  inference_seconds: number;
  config: Record<string, unknown>;
}

export interface DecisionBoundaryPoint {
  x: number;
  y: number;
  label: number;
}

export type DecisionBoundary =
  | {
      available: true;
      xs: number[];
      ys: number[];
      labels: Record<string, number[][]>;
      train_points: DecisionBoundaryPoint[];
      test_points: DecisionBoundaryPoint[];
    }
  | {
      available: false;
      reason: string;
    };

export interface ResourceSummary {
  n_qubits: number;
  feature_map_depth: number;
  ansatz_depth: number;
  combined_depth: number;
  gate_counts: Record<string, number>;
  n_encoding_parameters: number;
  n_trainable_parameters: number;
  n_function_evaluations: number;
  shots: number | null;
  simulation_backend: string;
}

export interface ExperimentResult {
  dataset: {
    id: string;
    name: string;
    n_samples: number;
    n_features: number;
    class_names: string[];
    train_size: number;
    test_size: number;
    random_seed: number;
  };
  preprocessing: {
    pipeline: string[];
    original_dim: number;
    final_dim: number;
  };
  circuit: {
    feature_map: string;
    ansatz: string;
    n_qubits: number;
    feature_map_depth: number;
    ansatz_depth: number;
    combined_depth: number;
    gate_counts: Record<string, number>;
    n_encoding_parameters: number;
    n_trainable_parameters: number;
    ascii_drawing: string;
  };
  resource_summary: ResourceSummary;
  training: {
    execution_mode: ExecutionMode;
    shots: number | null;
    noise: NoiseConfig | null;
    optimizer: OptimizerType;
    configured_maxiter: number;
    n_function_evaluations: number;
    initial_objective: number | null;
    final_objective: number | null;
    best_objective: number | null;
    train_seconds: number;
    stopped_reason: string;
    random_seed: number;
  };
  decision_boundary: DecisionBoundary;
  models: Record<string, ModelResult>;
  labels: {
    y_train: number[];
    y_test: number[];
  };
  software_versions: Record<string, string>;
}

export interface ExperimentDetail extends ExperimentSummary {
  config: ExperimentCreateRequest;
  result: ExperimentResult | null;
  training_history: TrainingHistoryPoint[] | null;
}

export interface CircuitSummaryResponse {
  n_qubits: number;
  depth: number;
  gate_counts: Record<string, number>;
  num_parameters: number;
  ascii_drawing: string;
}

export interface CircuitPreviewResponse {
  feature_map: CircuitSummaryResponse;
  ansatz: CircuitSummaryResponse;
  combined: CircuitSummaryResponse;
  n_encoding_parameters: number;
  n_trainable_parameters: number;
}
