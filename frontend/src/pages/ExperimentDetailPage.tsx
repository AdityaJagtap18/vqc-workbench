import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../components/layout/PageHeader";
import { ResultsView } from "../components/results/ResultsView";
import { api } from "../services/api";
import type { ExperimentDetail } from "../types/vqc";

export default function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ExperimentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getExperiment(id).then(setDetail).catch((err) => setError(String(err)));
  }, [id]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!detail) return <p className="text-sm text-muted">Loading experiment…</p>;

  return (
    <div className="max-w-6xl">
      <PageHeader title={detail.name} description={`Dataset: ${detail.dataset_id} · Status: ${detail.status}`} />

      {detail.status !== "COMPLETED" && (
        <div className="mb-5 rounded border border-border bg-surface p-4 text-sm text-muted">
          {detail.status === "FAILED"
            ? `This experiment failed: ${detail.error}`
            : `This experiment is still ${detail.status.toLowerCase()} — results will appear once it completes.`}
        </div>
      )}

      {detail.result && <ResultsView detail={detail} />}

      <div className="mt-6 flex gap-3">
        <Link to="/history" className="text-sm text-muted hover:text-ink">
          ← Back to history
        </Link>
        <button
          onClick={() => navigate("/experiments/new", { state: { duplicateConfig: detail.config } })}
          className="text-sm text-accent hover:underline"
        >
          Duplicate configuration
        </button>
      </div>
    </div>
  );
}
