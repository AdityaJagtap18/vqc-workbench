import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "../components/layout/PageHeader";
import { api } from "../services/api";
import type { DatasetId, DatasetInfo, DatasetPreviewResponse } from "../types/dataset";
import { histogram, mean, std } from "../utils/stats";

const PIE_COLORS = ["#315E9E", "#697386", "#1F8A5A", "#B5750A"];

export default function DatasetExplorer() {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [datasetId, setDatasetId] = useState<DatasetId | "">("");
  const [testSize, setTestSize] = useState(0.3);
  const [seed, setSeed] = useState(42);
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null);
  const [feature, setFeature] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listDatasets().then((ds) => {
      setDatasets(ds);
      if (ds.length > 0) setDatasetId(ds[0].id);
    });
  }, []);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    api
      .previewDataset({ dataset_id: datasetId, test_size: testSize, random_seed: seed })
      .then((p) => {
        setPreview(p);
        setFeature(Object.keys(p.feature_distributions)[0] ?? "");
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [datasetId, testSize, seed]);

  const histogramData = useMemo(() => {
    if (!preview || !feature) return [];
    return histogram(preview.feature_distributions[feature]);
  }, [preview, feature]);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Dataset Explorer"
        description="Inspect a dataset before configuring a VQC experiment."
      />

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded border border-border bg-surface p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Dataset</span>
          <select
            className="rounded border border-border bg-canvas px-2 py-1.5 text-sm"
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value as DatasetId)}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Test size</span>
          <input
            type="number"
            step={0.05}
            min={0.1}
            max={0.9}
            value={testSize}
            onChange={(e) => setTestSize(Number(e.target.value))}
            className="w-24 rounded border border-border bg-canvas px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Random seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="w-24 rounded border border-border bg-canvas px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      {loading && <p className="text-sm text-muted">Loading dataset…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {preview && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="rounded border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">{preview.dataset.name}</h2>
            <p className="mb-3 text-sm text-muted">{preview.dataset.description}</p>
            <dl className="grid grid-cols-2 gap-y-1 text-sm font-mono-tech">
              <dt className="text-muted">Total samples</dt>
              <dd>{preview.shape[0]}</dd>
              <dt className="text-muted">Features</dt>
              <dd>{preview.shape[1]}</dd>
              <dt className="text-muted">Train samples</dt>
              <dd>{preview.train_shape[0]}</dd>
              <dt className="text-muted">Test samples</dt>
              <dd>{preview.test_shape[0]}</dd>
            </dl>
          </section>

          <section className="rounded border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Class distribution</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={preview.class_distribution}
                  dataKey="count"
                  nameKey="class_name"
                  outerRadius={60}
                >
                  {preview.class_distribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
              {preview.class_distribution.map((c, i) => (
                <li key={c.label} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {c.class_name}: {c.count}
                </li>
              ))}
            </ul>
          </section>

          <section className="md:col-span-2 rounded border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Feature distribution</h2>
              <select
                className="rounded border border-border bg-canvas px-2 py-1 text-xs"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
              >
                {Object.keys(preview.feature_distributions).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            {feature && (
              <>
                <div className="mb-3 flex gap-6 text-xs font-mono-tech text-muted">
                  <span>mean: {mean(preview.feature_distributions[feature]).toFixed(3)}</span>
                  <span>std: {std(preview.feature_distributions[feature]).toFixed(3)}</span>
                  <span>min: {Math.min(...preview.feature_distributions[feature]).toFixed(3)}</span>
                  <span>max: {Math.max(...preview.feature_distributions[feature]).toFixed(3)}</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={histogramData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#315E9E" />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </section>

          <section className="md:col-span-2 rounded border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Sample preview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    {Object.keys(preview.sample_rows[0] ?? {}).map((k) => (
                      <th key={k} className="px-2 py-1 font-medium">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample_rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/60">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-2 py-1 font-mono-tech text-xs">
                          {typeof v === "number" ? v.toFixed(3) : v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
