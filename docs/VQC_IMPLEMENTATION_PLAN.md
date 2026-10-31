# VQC Workbench — Implementation Plan

## 0. Scope

Standalone QML research app for Experiment 2: Variational Quantum
Classifier (VQC). Independent repository (`vqc-workbench/`), no shared
code with QuantumCloud, `quantum-circuit-visualizer`,
`quantum-kernel-benchmark`, or the Experiment 1 app (`qml-kernel-workbench`).

## 1. Installed versions (checked against the real environment, not assumed)

- `qiskit` 2.6.1
- `qiskit-machine-learning` 0.9.1
- `qiskit-aer` 0.18.2
- `scikit-learn` 1.9.1
- `numpy` 2.5.4

APIs below were verified by running them against this exact environment
before writing any service code — not assumed from older tutorials.

## 2. Confirmed API surface

- Feature maps: `qiskit.circuit.library.{z_feature_map, zz_feature_map,
  pauli_feature_map}` — functional (non-deprecated) builders, same as
  Experiment 1.
- Ansatz: `qiskit.circuit.library.{real_amplitudes, efficient_su2}`.
- Classifier: `qiskit_machine_learning.algorithms.classifiers.VQC(
  feature_map, ansatz, loss, optimizer, sampler, callback, initial_point,
  warm_start)`. Requires a `BaseSamplerV2` (`qiskit.primitives.StatevectorSampler`
  for ideal/noiseless, `qiskit_aer.primitives.SamplerV2` for shot-based /
  noisy).
- Optimizers, all in `qiskit_machine_learning.optimizers` (no separate
  `qiskit-algorithms` dependency needed): `COBYLA`, `L_BFGS_B`, `SPSA`,
  `GradientDescent`.
- **Callback signature is NOT uniform across optimizers** — confirmed
  empirically:
  - `COBYLA`, `L_BFGS_B` (SciPy-backed): `callback(params: ndarray, fx: float)`
  - `GradientDescent`: `callback(nfev: int, params: ndarray, fx: float, stepsize: float)`
  - `SPSA`: `callback(nfev: int, params: ndarray, fx: float, stepsize: float, accepted: bool)`

  `training_service` normalizes these with a `*args` adapter that always
  extracts `(step, params, objective_value)`, synthesizing a step counter
  only when the optimizer doesn't supply `nfev` — the loss value itself is
  always the optimizer's real reported value, never invented.
- Noise: `qiskit_aer.noise.{NoiseModel, depolarizing_error, ReadoutError}`;
  injected into `qiskit_aer.primitives.SamplerV2` via
  `options={"backend_options": {"noise_model": ...}}` — confirmed working.

### Important terminology correction vs. Experiment 1

Experiment 1's kernel had a genuine *exact, no-sampling* statevector path
(direct `|<phi(x)|phi(x')>|^2` overlap — no measurement involved). VQC has
**no equivalent exact path**: a `Sampler` primitive always produces
measurement-outcome bitstrings used to estimate class probabilities, so
every VQC run is shot-based. The distinction here is:

- **Ideal**: noiseless shot-based simulation (`StatevectorSampler`, or
  Aer with no noise model).
- **Noisy**: shot-based simulation through an injected Aer noise model
  (depolarizing and/or readout error).

The UI must say "ideal (noiseless, shot-based) simulation", never "exact"
or "statevector-exact", for anything VQC-related.

## 3. Repository layout

```
backend/app/{main.py, api/routes/, core/, schemas/, services/, models/, workers/, tests/}
frontend/src/{components/{layout,datasets,circuits,training,charts,results,comparison}/, pages/, services/, hooks/, types/, utils/}
docs/
```

## 4. Experiment lifecycle

`QUEUED -> VALIDATING -> PREPROCESSING -> BUILDING_CIRCUIT -> TRAINING_VQC
-> TRAINING_CLASSICAL_MODELS -> EVALUATING -> COMPLETED` (+ `FAILED`,
`CANCELLED`). Background execution via FastAPI `BackgroundTasks`, status
polled from a SQLite-backed `ExperimentRecord`, same pattern as
Experiment 1.

## 5. Phases

### Phase 1 — Dataset and preprocessing
Reuse the same dataset catalog as Experiment 1 (Two Moons, Two Circles,
Iris binary subset, Breast Cancer, synthetic) and the same leakage-safe
preprocessing discipline (fit on train only), implemented fresh in this
repo (no cross-import). Dataset API + Dataset Explorer UI.

### Phase 2 — Quantum feature map and ansatz configuration
`feature_map_service` (same three maps as Experiment 1) +
`ansatz_service` (RealAmplitudes, EfficientSU2) with circuit summaries
(depth, gate counts, parameter count) derived from the real built
circuits, and an explicit split between feature-map parameters
(data-encoding, non-trainable at inference) and ansatz parameters
(trainable). A combined-circuit preview endpoint composes both.

### Phase 3 — VQC training engine and optimizer integration
`optimizer_service` builds the four supported optimizers from config;
`vqc_service` builds the `VQC` object; `training_service` runs `.fit()`
in a background thread, captures real loss history via the
per-optimizer-adapted callback, and records iteration count, duration,
final objective, and whether the run stopped by convergence tolerance or
by hitting `maxiter` (never claims convergence just because training
finished).

### Phase 4 — Classical baselines and evaluation
Logistic Regression, MLPClassifier, RBF SVM (+ optional Random Forest) on
the identical split/preprocessing; `evaluation_service` with the full
metric set (accuracy/precision/recall/F1/ROC-AUC/PR-AUC/balanced
accuracy/MCC/confusion matrix), binary now, structured for multiclass.

### Phase 5 — Experiment Studio UI and circuit preview
Guided stepper: Dataset -> Preprocessing -> Feature Map -> Ansatz ->
Optimizer -> VQC Training Config -> Classical Baselines -> Review ->
Execute. Live circuit preview (feature map, ansatz, and combined) updates
as configuration changes, same pattern as Experiment 1's feature-map
preview endpoint.

### Phase 6 — Training Monitor and loss visualization
Real-time polling of job stage + actual loss history (iteration vs.
objective value), initial/final/best loss, elapsed time, no fabricated
progress percentages — stage name and iteration count stand in for
numerical progress when no better signal exists.

### Phase 7 — Results and model comparison
Metrics, confusion matrices, ROC/PR curves, decision boundaries (only for
genuinely 2D preprocessed spaces, computed directly — not projected, same
rule as Experiment 1), circuit diagram + resource summary, VQC-vs-classical
comparison table and charts, honest interpretation text.

### Phase 8 — Noise experiments and repeated seeds
Optional noisy execution (depolarizing + readout error, explicitly labeled
as synthetic/configurable, never "hardware-calibrated"); ideal-vs-noisy
comparison (accuracy/F1 degradation, measured not assumed). Repeated-seed
runs reporting mean/std across seeds for accuracy, F1, training duration.

### Phase 9 — Experiment history, export, testing, docs
SQLite persistence of full config + training history + results; History UI
(search/filter/duplicate/export); CSV/JSON/Markdown export; full pytest
suite; README + Documentation page.

## 6. Research-integrity rules (enforced throughout)

No fabricated metrics, circuit diagrams, resource counts, loss values, or
progress percentages. Preprocessing fit on train only. Every optimizer's
real callback is used for loss history — never synthesized. Convergence is
only claimed when the optimizer itself reports it, not inferred from
reaching `maxiter`. Noise is always labeled synthetic/configurable.
Quantum vs. classical comparisons always run on identical
splits/preprocessing/protocol. Decision boundaries only shown for genuinely
2D feature spaces.

## 7. Status tracking

Each phase ends with: tests run, regressions fixed, frontend/backend
integration verified manually in the browser, this document updated, and a
short report of what's done vs. outstanding.
