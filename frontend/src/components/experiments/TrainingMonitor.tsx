import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { api } from "../../services/api";
import type { ExperimentDetail, ExperimentStage } from "../../types/vqc";
import { SectionCard } from "./FormControls";

const STAGES: ExperimentStage[] = [
  "QUEUED",
  "VALIDATING",
  "PREPROCESSING",
  "BUILDING_CIRCUIT",
  "TRAINING_VQC",
  "TRAINING_CLASSICAL_MODELS",
  "EVALUATING",
  "COMPLETED",
];

const STAGE_LABELS: Record<ExperimentStage, string> = {
  QUEUED: "Queued",
  VALIDATING: "Validating configuration",
  PREPROCESSING: "Preprocessing data",
  BUILDING_CIRCUIT: "Building quantum circuit",
  TRAINING_VQC: "Training VQC",
  TRAINING_CLASSICAL_MODELS: "Training classical baselines",
  EVALUATING: "Evaluating models",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export function TrainingMonitor({
  experimentId,
  onComplete,
}: {
  experimentId: string;
  onComplete: (detail: ExperimentDetail) => void;
}) {
  const [detail, setDetail] = useState<ExperimentDetail | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      api.getExperiment(experimentId).then((d) => {
        if (cancelled) return;
        setDetail(d);
        if (d.status === "COMPLETED" || d.status === "FAILED") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          if (d.status === "COMPLETED") onComplete(d);
        }
      });
    };

    poll();
    pollRef.current = window.setInterval(poll, 1000);
    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId]);

  useEffect(() => {
    if (!detail?.started_at) return;
    const start = new Date(detail.started_at).getTime();
    const tick = () => setElapsed((Date.now() - start) / 1000);
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [detail?.started_at]);

  if (!detail) {
    return <p className="text-sm text-muted">Connecting to job…</p>;
  }

  const failed = detail.status === "FAILED";
  const currentIndex = STAGES.indexOf(detail.stage);
  const history = detail.training_history ?? [];
  const currentIteration = history.length > 0 ? history[history.length - 1].step : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <SectionCard title="Execution">
        <dl className="mb-4 grid grid-cols-2 gap-y-1 font-mono-tech text-sm">
          <dt className="text-muted">Job ID</dt>
          <dd className="truncate">{detail.id}</dd>
          <dt className="text-muted">Status</dt>
          <dd>{detail.status}</dd>
          <dt className="text-muted">Elapsed</dt>
          <dd>{elapsed.toFixed(1)}s</dd>
          <dt className="text-muted">Current iteration</dt>
          <dd>{currentIteration ?? "—"}</dd>
        </dl>

        <ol className="space-y-1.5">
          {STAGES.map((stage, i) => {
            const isCurrent = stage === detail.stage && !failed;
            const isDone = i < currentIndex || detail.status === "COMPLETED";
            return (
              <li
                key={stage}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                  isCurrent ? "bg-accent/10 text-accent" : isDone ? "text-ink" : "text-muted"
                }`}
              >
                {isCurrent ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span className="inline-block h-3.5 w-3.5 rounded-full border border-current" />
                )}
                {STAGE_LABELS[stage]}
              </li>
            );
          })}
        </ol>

        {failed && (
          <div className="mt-4 flex items-start gap-2 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Experiment failed</p>
              <p className="text-xs">{detail.error}</p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Training loss">
        {history.length === 0 ? (
          <p className="text-sm text-muted">
            No loss values yet — the chart fills in as the optimizer reports real objective
            values during training.
          </p>
        ) : (
          <>
            <dl className="mb-3 grid grid-cols-3 gap-y-1 font-mono-tech text-xs">
              <dt className="text-muted">Initial</dt>
              <dd className="col-span-2">{history[0].objective_value.toFixed(4)}</dd>
              <dt className="text-muted">Current</dt>
              <dd className="col-span-2">{history[history.length - 1].objective_value.toFixed(4)}</dd>
              <dt className="text-muted">Best</dt>
              <dd className="col-span-2">
                {Math.min(...history.map((p) => p.objective_value)).toFixed(4)}
              </dd>
            </dl>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" />
                <XAxis dataKey="step" tick={{ fontSize: 10 }} label={{ value: "iteration", position: "insideBottom", fontSize: 10, offset: -2 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="objective_value" stroke="#315E9E" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </SectionCard>
    </div>
  );
}
