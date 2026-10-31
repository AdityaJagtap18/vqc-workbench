import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../components/layout/PageHeader";
import { api } from "../services/api";
import type { DatasetInfo } from "../types/dataset";
import type { ExperimentSummary } from "../types/vqc";

const FEATURE_MAPS = ["ZFeatureMap", "ZZFeatureMap", "PauliFeatureMap"];
const ANSATZE = ["RealAmplitudes", "EfficientSU2"];
const OPTIMIZERS = ["COBYLA", "SPSA", "L_BFGS_B", "GradientDescent"];

export default function Overview() {
  const [datasets, setDatasets] = useState<DatasetInfo[] | null>(null);
  const [experiments, setExperiments] = useState<ExperimentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listDatasets().then(setDatasets).catch((err) => setError(String(err)));
    api
      .listExperiments()
      .then((all) => setExperiments(all.slice(0, 5)))
      .catch(() => setExperiments([]));
  }, []);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Overview"
        description="Variational Quantum Classification: a parameterized quantum circuit (feature map + trainable ansatz) is optimized, classically, to minimize a loss over labeled data — a hybrid quantum-classical learning loop."
      />

      <section className="mb-8 border border-border border-t-2 border-t-accent bg-surface p-5">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-accent">What this experiment investigates</h2>
        <p className="text-sm leading-relaxed text-muted">
          A classical feature vector is encoded into a quantum state by a feature map, then
          passed through a parameterized ansatz circuit whose rotation angles are the
          trainable weights. Measurement outcomes are mapped to class probabilities, a loss
          is computed, and a classical optimizer updates the ansatz parameters — repeating
          until the evaluation budget is exhausted. This workbench runs that loop for real,
          on classical simulation of the quantum circuit, and compares the trained VQC against
          classical baselines (Logistic Regression, MLP, RBF SVM) on the same data.
        </p>
      </section>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="border border-border border-t-2 border-t-accent bg-surface p-5">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-accent">Available datasets</h2>
          {error && <p className="text-sm text-danger">{error}</p>}
          {!datasets && !error && <p className="text-sm text-muted">Loading…</p>}
          {datasets && (
            <ul className="space-y-1.5">
              {datasets.map((d) => (
                <li key={d.id} className="text-sm text-ink">
                  {d.name}
                  <span className="ml-2 text-xs text-muted">
                    {d.n_samples} samples · {d.n_features} features
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border border-t-2 border-t-accent bg-surface p-5">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-accent">Supported feature maps</h2>
          <p className="mb-3 text-sm text-muted">{FEATURE_MAPS.join(", ")}</p>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-accent">Supported ansatz circuits</h2>
          <p className="mb-3 text-sm text-muted">{ANSATZE.join(", ")}</p>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-accent">Supported optimizers</h2>
          <p className="text-sm text-muted">{OPTIMIZERS.join(", ")}</p>
        </section>
      </div>

      <section className="border border-border border-t-2 border-t-accent bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-accent">Recent experiments</h2>
          <Link to="/history" className="text-xs text-accent hover:underline">
            View all
          </Link>
        </div>
        {experiments === null && <p className="text-sm text-muted">Loading…</p>}
        {experiments?.length === 0 && (
          <p className="text-sm text-muted">
            No experiments have been run yet — start your first one below.
          </p>
        )}
        {experiments && experiments.length > 0 && (
          <table className="w-full text-left text-sm">
            <tbody>
              {experiments.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="py-1.5">
                    <Link to={`/experiments/${e.id}`} className="text-accent hover:underline">
                      {e.name}
                    </Link>
                  </td>
                  <td className="py-1.5 font-mono-tech text-xs text-muted">{e.dataset_id}</td>
                  <td className="py-1.5 font-mono-tech text-xs text-muted">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-4 flex gap-3">
          <Link
            to="/experiments/new"
            className="inline-block bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {experiments?.length === 0 ? "Start your first experiment" : "Start new experiment"}
          </Link>
          <Link
            to="/datasets"
            className="inline-block border border-border px-3 py-1.5 text-sm font-medium text-ink hover:bg-canvas"
          >
            Explore datasets
          </Link>
        </div>
      </section>
    </div>
  );
}
