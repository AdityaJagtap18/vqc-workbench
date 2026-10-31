import { useEffect, useState } from "react";

import { api } from "../../services/api";
import type { AnsatzConfig, CircuitPreviewResponse, FeatureMapConfig } from "../../types/vqc";
import { Field, NumberInput, SectionCard, Select, StepNav } from "./FormControls";

export function StepAnsatz({
  config,
  onChange,
  featureMapConfig,
  onBack,
  onNext,
}: {
  config: AnsatzConfig;
  onChange: (next: AnsatzConfig) => void;
  featureMapConfig: FeatureMapConfig;
  onBack: () => void;
  onNext: () => void;
}) {
  const [preview, setPreview] = useState<CircuitPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api
      .previewCircuit(featureMapConfig, config)
      .then(setPreview)
      .catch((err) => {
        setError(String(err));
        setPreview(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config), JSON.stringify(featureMapConfig)]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <SectionCard title="Variational ansatz">
        <div className="space-y-4">
          <Field label="Ansatz" hint="The TRAINABLE part of the circuit — distinct from the feature map's fixed encoding parameters.">
            <Select
              value={config.ansatz}
              onChange={(v) => onChange({ ...config, ansatz: v as AnsatzConfig["ansatz"] })}
              options={[
                { value: "RealAmplitudes", label: "RealAmplitudes" },
                { value: "EfficientSU2", label: "EfficientSU2" },
              ]}
            />
          </Field>

          <Field label="Repetitions">
            <NumberInput value={config.reps} min={1} max={5} onChange={(v) => onChange({ ...config, reps: v })} />
          </Field>

          <Field label="Entanglement pattern">
            <Select
              value={config.entanglement}
              onChange={(v) => onChange({ ...config, entanglement: v as AnsatzConfig["entanglement"] })}
              options={[
                { value: "linear", label: "Linear" },
                { value: "circular", label: "Circular" },
                { value: "full", label: "Full" },
              ]}
            />
          </Field>

          {config.ansatz === "EfficientSU2" && (
            <Field label="Rotation gates (comma separated)" hint="e.g. ry, rz">
              <input
                className="rounded border border-border bg-canvas px-2 py-1.5 text-sm"
                defaultValue={(config.su2_gates ?? ["ry", "rz"]).join(", ")}
                onBlur={(e) =>
                  onChange({
                    ...config,
                    su2_gates: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
          )}
        </div>

        {preview && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs font-mono-tech">
            <div>
              <p className="text-muted">Encoding parameters (fixed)</p>
              <p className="text-base text-ink">{preview.n_encoding_parameters}</p>
            </div>
            <div>
              <p className="text-muted">Trainable parameters</p>
              <p className="text-base text-accent">{preview.n_trainable_parameters}</p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Ansatz + combined circuit">
        {error && <p className="text-sm text-danger">{error}</p>}
        {preview && (
          <>
            <dl className="mb-3 grid grid-cols-2 gap-y-1.5 font-mono-tech text-sm">
              <dt className="text-muted">Ansatz depth</dt>
              <dd>{preview.ansatz.depth}</dd>
              <dt className="text-muted">Combined depth</dt>
              <dd>{preview.combined.depth}</dd>
            </dl>
            <p className="mb-1 text-xs text-muted">Ansatz only</p>
            <pre className="mb-3 overflow-x-auto whitespace-pre rounded bg-canvas p-2 text-[10px] leading-tight font-mono-tech text-ink">
              {preview.ansatz.ascii_drawing}
            </pre>
            <p className="mb-1 text-xs text-muted">Combined (feature map + ansatz) — what VQC actually evaluates</p>
            <pre className="overflow-x-auto whitespace-pre rounded bg-canvas p-2 text-[10px] leading-tight font-mono-tech text-ink">
              {preview.combined.ascii_drawing}
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
