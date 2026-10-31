"""Builds and trains the VQC, using each optimizer's REAL callback — the
three different callback signatures (confirmed empirically; see
docs/VQC_IMPLEMENTATION_PLAN.md) are normalized to (step, objective_value)
without inventing or interpolating any loss value.
"""

import time
from dataclasses import dataclass, field

import numpy as np
from qiskit.circuit import QuantumCircuit
from qiskit.primitives import StatevectorSampler
from qiskit_aer.primitives import SamplerV2 as AerSampler
from qiskit_machine_learning.algorithms.classifiers import VQC

from app.schemas.vqc import VQCTrainingConfig
from app.services import noise_service, optimizer_service


@dataclass
class TrainingHistoryPoint:
    step: int
    objective_value: float


@dataclass
class TrainingResult:
    model: VQC
    history: list[TrainingHistoryPoint] = field(default_factory=list)
    train_seconds: float = 0.0
    final_objective: float | None = None
    best_objective: float | None = None
    initial_objective: float | None = None
    n_function_evaluations: int = 0
    configured_maxiter: int = 0
    stopped_reason: str = "unknown"


def _build_sampler(config: VQCTrainingConfig, n_qubits: int):
    if config.execution_mode == "ideal":
        return StatevectorSampler(seed=config.random_seed)

    noise_model = noise_service.build_noise_model(config.noise, n_qubits)
    options = {"backend_options": {"noise_model": noise_model}} if noise_model is not None else {}
    return AerSampler(default_shots=config.shots, seed=config.random_seed, options=options)


def _make_callback(history: list[TrainingHistoryPoint], on_point=None):
    """Adapts COBYLA/L_BFGS_B's (params, fx), GradientDescent's
    (nfev, params, fx, stepsize), and SPSA's (nfev, params, fx, stepsize,
    accepted) into a single (step, objective_value) history entry."""
    counter = {"n": 0}

    def callback(*args):
        if len(args) == 2:
            params, fx = args
            counter["n"] += 1
            step = counter["n"]
        else:
            step = int(args[0])
            fx = args[2]
        point = TrainingHistoryPoint(step=step, objective_value=float(fx))
        history.append(point)
        if on_point is not None:
            on_point(point)

    return callback


def build_and_train(
    feature_map: QuantumCircuit,
    ansatz: QuantumCircuit,
    optimizer_config,
    training_config: VQCTrainingConfig,
    X_train: np.ndarray,
    y_train: np.ndarray,
    on_point=None,
) -> TrainingResult:
    sampler = _build_sampler(training_config, feature_map.num_qubits)
    optimizer = optimizer_service.build_optimizer(optimizer_config)

    history: list[TrainingHistoryPoint] = []
    callback = _make_callback(history, on_point=on_point)

    rng = np.random.default_rng(training_config.random_seed)
    initial_point = rng.uniform(-np.pi, np.pi, size=ansatz.num_parameters)

    vqc = VQC(
        feature_map=feature_map,
        ansatz=ansatz,
        optimizer=optimizer,
        sampler=sampler,
        callback=callback,
        initial_point=initial_point,
    )

    start = time.perf_counter()
    vqc.fit(X_train, y_train)
    train_seconds = time.perf_counter() - start

    objectives = [p.objective_value for p in history]
    nfev = getattr(vqc.fit_result, "nfev", len(history)) or len(history)

    # No optimizer here exposes an explicit convergence flag (confirmed on
    # OptimizerResult for this qiskit-machine-learning version) — report
    # whether the run used up its full evaluation budget rather than
    # claiming convergence either way.
    if nfev >= optimizer_config.maxiter:
        stopped_reason = "reached the configured iteration/evaluation limit"
    else:
        stopped_reason = (
            "stopped before the configured limit — the optimizer's own "
            "internal criteria were satisfied, but no library-level "
            "convergence flag is exposed to confirm this is a true optimum"
        )

    return TrainingResult(
        model=vqc,
        history=history,
        train_seconds=train_seconds,
        final_objective=objectives[-1] if objectives else None,
        best_objective=min(objectives) if objectives else None,
        initial_objective=objectives[0] if objectives else None,
        n_function_evaluations=int(nfev),
        configured_maxiter=optimizer_config.maxiter,
        stopped_reason=stopped_reason,
    )
