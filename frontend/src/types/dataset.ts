export type DatasetId =
  | "iris_binary"
  | "breast_cancer"
  | "two_moons"
  | "two_circles"
  | "synthetic";

export interface DatasetInfo {
  id: DatasetId;
  name: string;
  description: string;
  n_samples: number;
  n_features: number;
  feature_names: string[];
  class_names: string[];
  supports_class_selection: boolean;
}

export interface DatasetConfigRequest {
  dataset_id: DatasetId;
  selected_classes?: number[] | null;
  test_size: number;
  random_seed: number;
  n_samples?: number | null;
  noise?: number | null;
}

export interface ClassDistributionEntry {
  label: number;
  class_name: string;
  count: number;
}

export interface DatasetPreviewResponse {
  dataset: DatasetInfo;
  shape: [number, number];
  train_shape: [number, number];
  test_shape: [number, number];
  class_distribution: ClassDistributionEntry[];
  sample_rows: Record<string, number | string>[];
  feature_distributions: Record<string, number[]>;
}
