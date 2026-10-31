import { PageHeader } from "../components/layout/PageHeader";

export default function Documentation() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Documentation"
        description="Background on variational quantum classification and this workbench's methodology."
      />
      <section className="space-y-4 border border-border border-t-2 border-t-accent bg-surface p-5 text-sm leading-relaxed text-ink">
        <p>
          <strong>Feature map.</strong> A circuit U(x) encodes a classical feature vector x
          into a quantum state — the same family of circuits (ZFeatureMap, ZZFeatureMap,
          PauliFeatureMap) used in Experiment 1's quantum kernel. Its parameters are the
          classical feature values themselves: fixed per data point, never trained.
        </p>
        <p>
          <strong>Ansatz.</strong> A second, parameterized circuit (RealAmplitudes or
          EfficientSU2) follows the feature map. Its rotation angles are the model's
          trainable weights — these, and only these, are updated during optimization.
        </p>
        <p>
          <strong>Training loop.</strong> Measuring the combined circuit yields bitstrings
          that are mapped to class probabilities; a loss (cross-entropy) compares these to
          the true labels; a classical optimizer (COBYLA, SPSA, L-BFGS-B, or Gradient
          Descent) proposes new ansatz parameters to reduce that loss. This repeats for a
          configured number of iterations/evaluations.
        </p>
        <p>
          <strong>Ideal vs. noisy.</strong> Every VQC evaluation here is shot-based — there
          is no analytic, sampling-free path the way Experiment 1's kernel had. "Ideal"
          means noiseless shot-based simulation; "noisy" injects a configurable, synthetic
          Aer noise model (depolarizing + readout error) — never a calibration of real
          hardware.
        </p>
        <p>
          <strong>Convergence.</strong> None of the four optimizers exposed here report an
          explicit convergence flag in this qiskit-machine-learning version. The app reports
          whether training used its full evaluation budget rather than ever claiming the
          model "converged."
        </p>
        <p>
          <strong>Research integrity.</strong> Every metric, loss value, and circuit
          statistic shown in this app comes from an actual execution. Preprocessing is
          always fit on the training split only. Random seeds and software versions are
          recorded with every run. Classical baselines run on the identical split and
          preprocessing as the VQC — no artificial handicapping.
        </p>
      </section>
    </div>
  );
}
