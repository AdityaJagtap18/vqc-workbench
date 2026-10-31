import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ExperimentDetail } from "../../types/vqc";
import { SectionCard } from "../experiments/FormControls";

export function CircuitAnalysisPanel({ detail }: { detail: ExperimentDetail }) {
  const result = detail.result;
  if (!result) return null;
  const { circuit, resource_summary, training } = result;
  const history = detail.training_history ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard title="Theoretical circuit resources">
          <p className="mb-3 text-xs text-muted">
            Computable from the circuit structure alone, before any execution.
          </p>
          <dl className="grid grid-cols-2 gap-y-1.5 font-mono-tech text-sm">
            <dt className="text-muted">Qubits</dt>
            <dd>{resource_summary.n_qubits}</dd>
            <dt className="text-muted">Feature map depth</dt>
            <dd>{resource_summary.feature_map_depth}</dd>
            <dt className="text-muted">Ansatz depth</dt>
            <dd>{resource_summary.ansatz_depth}</dd>
            <dt className="text-muted">Combined depth</dt>
            <dd>{resource_summary.combined_depth}</dd>
            <dt className="text-muted">Encoding parameters</dt>
            <dd>{resource_summary.n_encoding_parameters}</dd>
            <dt className="text-muted">Trainable parameters</dt>
            <dd>{resource_summary.n_trainable_parameters}</dd>
            <dt className="text-muted">Gate counts</dt>
            <dd>
              {Object.entries(resource_summary.gate_counts)
                .map(([g, c]) => `${g}:${c}`)
                .join(", ")}
            </dd>
          </dl>
        </SectionCard>

        <SectionCard title="Actual execution measurements">
          <p className="mb-3 text-xs text-muted">Measured from this specific run.</p>
          <dl className="grid grid-cols-2 gap-y-1.5 font-mono-tech text-sm">
            <dt className="text-muted">Simulation backend</dt>
            <dd>{resource_summary.simulation_backend}</dd>
            <dt className="text-muted">Shots</dt>
            <dd>{resource_summary.shots ?? "n/a (StatevectorSampler default)"}</dd>
            <dt className="text-muted">Circuit evaluations</dt>
            <dd>{resource_summary.n_function_evaluations}</dd>
            <dt className="text-muted">Configured max iterations</dt>
            <dd>{training.configured_maxiter}</dd>
            <dt className="text-muted">Training duration</dt>
            <dd>{training.train_seconds.toFixed(3)}s</dd>
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="Final configured circuit diagram">
        <p className="mb-2 text-xs text-muted">
          {circuit.feature_map} (encoding) composed with {circuit.ansatz} (trainable) — exactly
          what VQC evaluates per sample.
        </p>
        <pre className="overflow-x-auto whitespace-pre rounded bg-canvas p-3 text-[10px] leading-tight font-mono-tech text-ink">
          {circuit.ascii_drawing}
        </pre>
      </SectionCard>

      <SectionCard title="Loss progression">
        {history.length === 0 ? (
          <p className="text-sm text-muted">No training history recorded.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7ED" />
              <XAxis dataKey="step" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="objective_value" stroke="#315E9E" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
    </div>
  );
}
