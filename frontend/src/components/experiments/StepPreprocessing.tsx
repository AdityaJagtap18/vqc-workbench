import type { DatasetPreviewResponse } from "../../types/dataset";
import type { PreprocessingConfig } from "../../types/vqc";
import { Field, NumberInput, SectionCard, Select, StepNav } from "./FormControls";

const MAX_QUBITS = 6;

export function StepPreprocessing({
  preprocessing,
  onChange,
  preview,
  onBack,
  onNext,
}: {
  preprocessing: PreprocessingConfig;
  onChange: (next: PreprocessingConfig) => void;
  preview: DatasetPreviewResponse | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const originalDim = preview?.shape[1] ?? 0;
  const finalDim = preprocessing.use_pca ? preprocessing.n_components ?? 2 : originalDim;
  const requiresPca = originalDim > MAX_QUBITS;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <SectionCard title="Preprocessing pipeline">
        <div className="space-y-4">
          <Field label="Scaling method" hint="MinMax maps features into [0, pi] for rotation-angle encoding.">
            <Select
              value={preprocessing.scaling}
              onChange={(v) => onChange({ ...preprocessing, scaling: v as PreprocessingConfig["scaling"] })}
              options={[
                { value: "standard", label: "StandardScaler" },
                { value: "minmax", label: "MinMaxScaler -> [0, pi]" },
                { value: "none", label: "None" },
              ]}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={preprocessing.use_pca || requiresPca}
              disabled={requiresPca}
              onChange={(e) =>
                onChange({
                  ...preprocessing,
                  use_pca: e.target.checked,
                  n_components: e.target.checked ? preprocessing.n_components ?? 2 : null,
                })
              }
            />
            Reduce dimensionality with PCA
            {requiresPca && (
              <span className="text-xs text-muted">
                (required — this dataset has {originalDim} features, more than the {MAX_QUBITS}-qubit limit)
              </span>
            )}
          </label>

          {(preprocessing.use_pca || requiresPca) && (
            <Field label="Target component count (= qubit count)">
              <NumberInput
                value={preprocessing.n_components ?? 2}
                min={1}
                max={Math.min(MAX_QUBITS, originalDim || MAX_QUBITS)}
                onChange={(v) => onChange({ ...preprocessing, use_pca: true, n_components: v })}
              />
            </Field>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Resulting configuration">
        <dl className="grid grid-cols-2 gap-y-1.5 font-mono-tech text-sm">
          <dt className="text-muted">Original feature dimensions</dt>
          <dd>{originalDim}</dd>
          <dt className="text-muted">Transformed feature dimensions</dt>
          <dd>{finalDim}</dd>
          <dt className="text-muted">Qubits required</dt>
          <dd>{finalDim}</dd>
          <dt className="text-muted">Training samples</dt>
          <dd>{preview?.train_shape[0] ?? "—"}</dd>
          <dt className="text-muted">Testing samples</dt>
          <dd>{preview?.test_shape[0] ?? "—"}</dd>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          All scaling and dimensionality-reduction transforms are fit on the
          training split only, then applied to the test split — the same
          pipeline feeds both the VQC and the classical baselines.
        </p>
      </SectionCard>

      <div className="md:col-span-2">
        <StepNav onBack={onBack} onNext={onNext} />
      </div>
    </div>
  );
}
