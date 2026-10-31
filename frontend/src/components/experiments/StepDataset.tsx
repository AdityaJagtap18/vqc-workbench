import { useEffect, useState } from "react";

import { api } from "../../services/api";
import type { DatasetConfigRequest, DatasetId, DatasetInfo, DatasetPreviewResponse } from "../../types/dataset";
import { Field, NumberInput, SectionCard, StepNav } from "./FormControls";

const IRIS_CLASS_LABELS = ["setosa", "versicolor", "virginica"];

export function StepDataset({
  dataset,
  onChange,
  onPreview,
  onNext,
}: {
  dataset: DatasetConfigRequest;
  onChange: (next: DatasetConfigRequest) => void;
  onPreview: (preview: DatasetPreviewResponse | null) => void;
  onNext: () => void;
}) {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listDatasets().then(setDatasets);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .previewDataset(dataset)
      .then((p) => {
        setPreview(p);
        onPreview(p);
      })
      .catch((err) => {
        setError(String(err));
        setPreview(null);
        onPreview(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dataset)]);

  const activeInfo = datasets.find((d) => d.id === dataset.dataset_id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
      <SectionCard title="Dataset" className="md:col-span-2">
        <div className="space-y-1">
          {datasets.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange({ ...dataset, dataset_id: d.id as DatasetId, selected_classes: null })}
              className={`block w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                dataset.dataset_id === d.id
                  ? "border-accent bg-accent/10"
                  : "border-border hover:bg-canvas"
              }`}
            >
              <span className="font-medium text-ink">{d.name}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {d.n_samples} samples · {d.n_features} features
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="md:col-span-3 space-y-5">
        <SectionCard title="Configuration">
          <div className="flex flex-wrap items-end gap-4">
            {activeInfo?.supports_class_selection && (
              <Field label="Target classes (pick 2)">
                <div className="flex gap-3">
                  {IRIS_CLASS_LABELS.map((label, idx) => {
                    const selected = dataset.selected_classes ?? [0, 1];
                    const checked = selected.includes(idx);
                    return (
                      <label key={idx} className="flex items-center gap-1 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            let next = checked
                              ? selected.filter((v) => v !== idx)
                              : [...selected, idx];
                            if (next.length > 2) next = next.slice(next.length - 2);
                            if (next.length < 1) return;
                            onChange({ ...dataset, selected_classes: next.length === 2 ? next : [next[0], (next[0] + 1) % 3] });
                          }}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </Field>
            )}
            {(dataset.dataset_id === "two_moons" ||
              dataset.dataset_id === "two_circles" ||
              dataset.dataset_id === "synthetic") && (
              <>
                <Field label="Sample count">
                  <NumberInput
                    value={dataset.n_samples ?? 200}
                    min={20}
                    max={400}
                    step={10}
                    onChange={(v) => onChange({ ...dataset, n_samples: v })}
                  />
                </Field>
                <Field label="Noise">
                  <NumberInput
                    value={dataset.noise ?? 0.1}
                    min={0}
                    max={0.5}
                    step={0.05}
                    onChange={(v) => onChange({ ...dataset, noise: v })}
                  />
                </Field>
              </>
            )}
            <Field label="Test split ratio">
              <NumberInput
                value={dataset.test_size}
                min={0.1}
                max={0.5}
                step={0.05}
                onChange={(v) => onChange({ ...dataset, test_size: v })}
              />
            </Field>
            <Field label="Random seed">
              <NumberInput value={dataset.random_seed} onChange={(v) => onChange({ ...dataset, random_seed: v })} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Preview">
          {loading && <p className="text-sm text-muted">Loading…</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
          {preview && !loading && (
            <dl className="grid grid-cols-2 gap-y-1 font-mono-tech text-sm">
              <dt className="text-muted">Total samples</dt>
              <dd>{preview.shape[0]}</dd>
              <dt className="text-muted">Features</dt>
              <dd>{preview.shape[1]}</dd>
              <dt className="text-muted">Train / test</dt>
              <dd>
                {preview.train_shape[0]} / {preview.test_shape[0]}
              </dd>
              <dt className="text-muted">Classes</dt>
              <dd>
                {preview.class_distribution.map((c) => `${c.class_name} (${c.count})`).join(", ")}
              </dd>
            </dl>
          )}
        </SectionCard>
      </div>

      <div className="md:col-span-5">
        <StepNav onNext={onNext} nextDisabled={!preview || loading} />
      </div>
    </div>
  );
}
