import { useEffect, useState } from "react";

import { api } from "../../services/api";
import type { AnsatzConfig, CircuitPreviewResponse, FeatureMapConfig } from "../../types/vqc";
import { Field, NumberInput, SectionCard, Select, StepNav } from "./FormControls";

export function StepFeatureMap({
  config,
  onChange,
  ansatzConfig,
  finalDim,
  onBack,
  onNext,
}: {
  config: FeatureMapConfig;
  onChange: (next: FeatureMapConfig) => void;
  ansatzConfig: AnsatzConfig;
  finalDim: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const [preview, setPreview] = useState<CircuitPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config.n_qubits !== finalDim && finalDim > 0) {
      onChange({ ...config, n_qubits: finalDim });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalDim]);

  useEffect(() => {
    if (config.feature_map === "PauliFeatureMap" && (!config.paulis || config.paulis.length === 0)) return;
    setError(null);
    api
      .previewCircuit(config, ansatzConfig)
      .then(setPreview)
      .catch((err) => {
        setError(String(err));
        setPreview(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <SectionCard title="Quantum feature map">
        <div className="space-y-4">
          <Field label="Feature map" hint="Encodes classical features into a quantum state — parameters are the data values, never trained.">
            <Select
              value={config.feature_map}
              onChange={(v) =>
                onChange({
                  ...config,
                  feature_map: v as FeatureMapConfig["feature_map"],
                  paulis: v === "PauliFeatureMap" ? ["Z", "ZZ"] : null,
                })
              }
              options={[
                { value: "ZFeatureMap", label: "ZFeatureMap" },
                { value: "ZZFeatureMap", label: "ZZFeatureMap" },
                { value: "PauliFeatureMap", label: "PauliFeatureMap" },
              ]}
            />
          </Field>

          <Field label="Number of qubits" hint="Locked to the preprocessed feature count.">
            <NumberInput value={config.n_qubits} onChange={() => {}} min={1} max={6} />
          </Field>

          <Field label="Repetitions">
            <NumberInput value={config.reps} min={1} max={4} onChange={(v) => onChange({ ...config, reps: v })} />
          </Field>

          {config.feature_map !== "ZFeatureMap" && (
            <Field label="Entanglement pattern">
              <Select
                value={config.entanglement}
                onChange={(v) => onChange({ ...config, entanglement: v as FeatureMapConfig["entanglement"] })}
                options={[
                  { value: "linear", label: "Linear" },
                  { value: "circular", label: "Circular" },
                  { value: "full", label: "Full" },
                ]}
              />
            </Field>
          )}

          {config.feature_map === "PauliFeatureMap" && (
            <Field label="Pauli strings (comma separated)" hint="e.g. Z, ZZ, XX">
              <input
                className="border border-border bg-canvas px-2 py-1.5 text-sm"
                defaultValue={(config.paulis ?? ["Z", "ZZ"]).join(", ")}
                onBlur={(e) =>
                  onChange({
                    ...config,
                    paulis: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Feature map circuit">
        {error && <p className="text-sm text-danger">{error}</p>}
        {preview && (
          <>
            <dl className="mb-4 grid grid-cols-2 gap-y-1.5 font-mono-tech text-sm">
              <dt className="text-muted">Qubits</dt>
              <dd>{preview.feature_map.n_qubits}</dd>
              <dt className="text-muted">Depth</dt>
              <dd>{preview.feature_map.depth}</dd>
              <dt className="text-muted">Encoding parameters</dt>
              <dd>{preview.feature_map.num_parameters}</dd>
              <dt className="text-muted">Gate counts</dt>
              <dd>
                {Object.entries(preview.feature_map.gate_counts)
                  .map(([g, c]) => `${g}:${c}`)
                  .join(", ")}
              </dd>
            </dl>
            <pre className="overflow-x-auto whitespace-pre bg-canvas p-3 text-[10px] leading-tight font-mono-tech text-ink">
              {preview.feature_map.ascii_drawing}
            </pre>
          </>
        )}
      </SectionCard>

      <div className="md:col-span-2">
        <StepNav onBack={onBack} onNext={onNext} nextDisabled={!preview} />
      </div>
    </div>
  );
}
