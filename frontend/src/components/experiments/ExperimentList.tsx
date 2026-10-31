import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../services/api";
import type { ExperimentSummary } from "../../types/vqc";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "text-success",
  FAILED: "text-danger",
  RUNNING: "text-accent",
  QUEUED: "text-muted",
};

export function ExperimentList({
  onlyCompleted = false,
  emptyLabel = "No experiments yet.",
}: {
  onlyCompleted?: boolean;
  emptyLabel?: string;
}) {
  const [experiments, setExperiments] = useState<ExperimentSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [datasetFilter, setDatasetFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.listExperiments().then(setExperiments);
  }, [refreshKey]);

  if (!experiments) return <p className="text-sm text-muted">Loading…</p>;

  const datasetIds = Array.from(new Set(experiments.map((e) => e.dataset_id)));
  const filtered = experiments
    .filter((e) => (onlyCompleted ? e.status === "COMPLETED" : true))
    .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => datasetFilter === "all" || e.dataset_id === datasetFilter);

  async function handleDelete(id: string) {
    await api.deleteExperiment(id);
    setRefreshKey((k) => k + 1);
  }

  if (experiments.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        <input
          className="border border-border bg-canvas px-2 py-1.5 text-sm"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-border bg-canvas px-2 py-1.5 text-sm"
          value={datasetFilter}
          onChange={(e) => setDatasetFilter(e.target.value)}
        >
          <option value="all">All datasets</option>
          {datasetIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No experiments match these filters.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-2 py-1.5 font-medium">Name</th>
              <th className="px-2 py-1.5 font-medium">Dataset</th>
              <th className="px-2 py-1.5 font-medium">Status</th>
              <th className="px-2 py-1.5 font-medium">Created</th>
              <th className="px-2 py-1.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-border/60">
                <td className="px-2 py-1.5">
                  <Link to={`/experiments/${e.id}`} className="font-medium text-accent hover:underline">
                    {e.name}
                  </Link>
                </td>
                <td className="px-2 py-1.5 font-mono-tech text-xs">{e.dataset_id}</td>
                <td className={`px-2 py-1.5 font-mono-tech text-xs ${STATUS_COLORS[e.status] ?? ""}`}>
                  {e.status}
                </td>
                <td className="px-2 py-1.5 font-mono-tech text-xs text-muted">
                  {new Date(e.created_at).toLocaleString()}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button onClick={() => handleDelete(e.id)} className="text-xs text-muted hover:text-danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
