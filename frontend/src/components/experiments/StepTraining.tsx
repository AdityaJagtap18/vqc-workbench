import type { VQCTrainingConfig } from "../../types/vqc";
import { Field, NumberInput, SectionCard, Select, StepNav } from "./FormControls";

export function StepTraining({
  config,
  onChange,
  onBack,
  onNext,
}: {
  config: VQCTrainingConfig;
  onChange: (next: VQCTrainingConfig) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <SectionCard title="Execution configuration">
        <div className="space-y-4">
          <Field
            label="Execution mode"
            hint="VQC is always shot-based (it measures the circuit) — 'ideal' means noiseless sampling, not exact math."
          >
            <Select
              value={config.execution_mode}
              onChange={(v) =>
                onChange({
                  ...config,
                  execution_mode: v as VQCTrainingConfig["execution_mode"],
                  noise: { ...config.noise, enabled: v === "noisy" },
                })
              }
              options={[
                { value: "ideal", label: "Ideal (noiseless, shot-based)" },
                { value: "noisy", label: "Noisy (synthetic Aer noise model)" },
              ]}
            />
          </Field>

          <Field label="Shots per circuit evaluation">
            <NumberInput value={config.shots} min={16} max={20000} step={16} onChange={(v) => onChange({ ...config, shots: v })} />
          </Field>

          <Field label="Random seed">
            <NumberInput value={config.random_seed} onChange={(v) => onChange({ ...config, random_seed: v })} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Noise model">
        {config.execution_mode === "ideal" ? (
          <p className="text-sm text-muted">
            Switch execution mode to "Noisy" to configure a synthetic Aer noise model.
          </p>
        ) : (
          <div className="space-y-4">
            <Field label="Depolarizing error probability">
              <NumberInput
                value={config.noise.depolarizing_prob}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => onChange({ ...config, noise: { ...config.noise, enabled: true, depolarizing_prob: v } })}
              />
            </Field>
            <Field label="Readout error probability">
              <NumberInput
                value={config.noise.readout_error_prob}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => onChange({ ...config, noise: { ...config.noise, enabled: true, readout_error_prob: v } })}
              />
            </Field>
            <p className="text-xs leading-relaxed text-muted">
              Synthetic, configurable noise applied uniformly to gates and readout — not a
              calibration of any real device.
            </p>
          </div>
        )}
      </SectionCard>

      <div className="md:col-span-2">
        <StepNav onBack={onBack} onNext={onNext} />
      </div>
    </div>
  );
}
