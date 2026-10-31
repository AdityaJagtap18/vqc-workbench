import type { OptimizerConfig } from "../../types/vqc";
import { Field, NumberInput, SectionCard, Select, StepNav } from "./FormControls";

const OPTIMIZER_INFO: Record<string, { usesGradient: boolean; description: string }> = {
  COBYLA: {
    usesGradient: false,
    description:
      "Derivative-free: builds a local linear model from function evaluations alone.",
  },
  SPSA: {
    usesGradient: false,
    description:
      "Estimates a gradient direction from two randomly-perturbed evaluations per step — well suited to noisy objectives.",
  },
  L_BFGS_B: {
    usesGradient: true,
    description:
      "Quasi-Newton, gradient-based; gradients are estimated numerically since VQC exposes no analytic gradient by default.",
  },
  GradientDescent: {
    usesGradient: true,
    description: "Plain gradient descent with a configurable learning rate; gradients are estimated numerically.",
  },
};

export function StepOptimizer({
  config,
  onChange,
  onBack,
  onNext,
}: {
  config: OptimizerConfig;
  onChange: (next: OptimizerConfig) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const info = OPTIMIZER_INFO[config.optimizer];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <SectionCard title="Optimizer configuration">
        <div className="space-y-4">
          <Field label="Optimizer">
            <Select
              value={config.optimizer}
              onChange={(v) => onChange({ ...config, optimizer: v as OptimizerConfig["optimizer"] })}
              options={[
                { value: "COBYLA", label: "COBYLA" },
                { value: "SPSA", label: "SPSA" },
                { value: "L_BFGS_B", label: "L-BFGS-B" },
                { value: "GradientDescent", label: "Gradient Descent" },
              ]}
            />
          </Field>

          <Field label="Max iterations / evaluations">
            <NumberInput
              value={config.maxiter}
              min={1}
              max={2000}
              onChange={(v) => onChange({ ...config, maxiter: v })}
            />
          </Field>

          {(config.optimizer === "GradientDescent" || config.optimizer === "SPSA") && (
            <Field label="Learning rate" hint="Blank uses the library default.">
              <NumberInput
                value={config.learning_rate ?? 0}
                step={0.001}
                onChange={(v) => onChange({ ...config, learning_rate: v || null })}
              />
            </Field>
          )}

          {config.optimizer === "SPSA" && (
            <Field label="Perturbation" hint="Blank uses the library default.">
              <NumberInput
                value={config.perturbation ?? 0}
                step={0.001}
                onChange={(v) => onChange({ ...config, perturbation: v || null })}
              />
            </Field>
          )}

          {(config.optimizer === "COBYLA" || config.optimizer === "GradientDescent") && (
            <Field label="Convergence tolerance" hint="Blank uses the library default.">
              <NumberInput
                value={config.tolerance ?? 0}
                step={0.0001}
                onChange={(v) => onChange({ ...config, tolerance: v || null })}
              />
            </Field>
          )}
        </div>
      </SectionCard>

      <SectionCard title="About this optimizer">
        {info && (
          <>
            <p className="mb-3 text-sm text-ink">{info.description}</p>
            <span
              className={`inline-block px-2 py-1 text-xs font-medium ${
                info.usesGradient ? "bg-accent/10 text-accent" : "bg-canvas text-muted"
              }`}
            >
              {info.usesGradient ? "Gradient-based (numerically estimated)" : "Gradient-free"}
            </span>
          </>
        )}
        <p className="mt-4 text-xs leading-relaxed text-muted">
          None of these optimizers expose an explicit convergence flag in this
          qiskit-machine-learning version — the Training Monitor and results page report
          whether the run used its full evaluation budget rather than claiming convergence.
        </p>
      </SectionCard>

      <div className="md:col-span-2">
        <StepNav onBack={onBack} onNext={onNext} />
      </div>
    </div>
  );
}
