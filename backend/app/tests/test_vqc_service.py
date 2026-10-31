import numpy as np

from app.schemas.vqc import AnsatzConfig, FeatureMapConfig, NoiseConfig, OptimizerConfig, VQCTrainingConfig
from app.services import ansatz_service, feature_map_service, vqc_service


def _toy_data():
    rng = np.random.default_rng(0)
    X = rng.uniform(-1, 1, size=(16, 2))
    y = (X[:, 0] > 0).astype(int)
    return X, y


def _circuits():
    fm = feature_map_service.build_feature_map(
        FeatureMapConfig(feature_map="ZZFeatureMap", n_qubits=2, reps=1, entanglement="linear")
    )
    ansatz = ansatz_service.build_ansatz(
        AnsatzConfig(ansatz="RealAmplitudes", reps=1, entanglement="linear"), n_qubits=2
    )
    return fm, ansatz


def test_ideal_training_produces_real_loss_history():
    X, y = _toy_data()
    fm, ansatz = _circuits()
    result = vqc_service.build_and_train(
        fm, ansatz, OptimizerConfig(optimizer="COBYLA", maxiter=12), VQCTrainingConfig(execution_mode="ideal"), X, y
    )
    assert len(result.history) == 12
    assert result.initial_objective is not None
    assert result.final_objective is not None
    assert result.best_objective <= result.initial_objective


def test_noisy_training_runs_with_depolarizing_and_readout_error():
    X, y = _toy_data()
    fm, ansatz = _circuits()
    noisy_config = VQCTrainingConfig(
        execution_mode="noisy",
        shots=128,
        noise=NoiseConfig(enabled=True, depolarizing_prob=0.05, readout_error_prob=0.05),
    )
    result = vqc_service.build_and_train(
        fm, ansatz, OptimizerConfig(optimizer="SPSA", maxiter=5), noisy_config, X, y
    )
    assert len(result.history) == 5
    preds = result.model.predict(X[:4])
    assert preds.shape == (4,)


def test_every_optimizer_produces_a_history_with_adapted_callback():
    X, y = _toy_data()
    fm, ansatz = _circuits()
    for name in ("COBYLA", "SPSA", "L_BFGS_B", "GradientDescent"):
        result = vqc_service.build_and_train(
            fm, ansatz, OptimizerConfig(optimizer=name, maxiter=6), VQCTrainingConfig(execution_mode="ideal"), X, y
        )
        assert len(result.history) > 0, f"{name} produced no history"
        for point in result.history:
            assert isinstance(point.objective_value, float)


def test_stopped_reason_reflects_evaluation_budget():
    X, y = _toy_data()
    fm, ansatz = _circuits()
    result = vqc_service.build_and_train(
        fm, ansatz, OptimizerConfig(optimizer="COBYLA", maxiter=8), VQCTrainingConfig(execution_mode="ideal"), X, y
    )
    assert result.n_function_evaluations >= result.configured_maxiter
    assert "limit" in result.stopped_reason
