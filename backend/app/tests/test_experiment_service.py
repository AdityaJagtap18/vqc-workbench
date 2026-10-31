from app.core.database import init_db
from app.schemas.dataset import DatasetConfigRequest
from app.schemas.experiment import ExperimentCreateRequest
from app.schemas.vqc import (
    AnsatzConfig,
    ClassicalConfig,
    ClassicalModelConfig,
    FeatureMapConfig,
    OptimizerConfig,
    VQCTrainingConfig,
)
from app.services import experiment_service

init_db()


def _small_request(name: str) -> ExperimentCreateRequest:
    return ExperimentCreateRequest(
        name=name,
        dataset=DatasetConfigRequest(dataset_id="two_moons", n_samples=20, test_size=0.3, random_seed=0),
        feature_map=FeatureMapConfig(feature_map="ZZFeatureMap", n_qubits=2, reps=1, entanglement="linear"),
        ansatz=AnsatzConfig(ansatz="RealAmplitudes", reps=1, entanglement="linear"),
        optimizer=OptimizerConfig(optimizer="COBYLA", maxiter=8),
        training=VQCTrainingConfig(execution_mode="ideal"),
        classical=ClassicalConfig(
            logistic_regression=ClassicalModelConfig(enabled=True),
            mlp=ClassicalModelConfig(enabled=False),
            rbf_svm=ClassicalModelConfig(enabled=True),
            random_forest=ClassicalModelConfig(enabled=False),
        ),
    )


def test_full_experiment_lifecycle_completes():
    record = experiment_service.create_experiment(_small_request("lifecycle-test"))
    assert record.status == "QUEUED"

    experiment_service.run_experiment(record.id)

    finished = experiment_service.get_experiment(record.id)
    assert finished.status == "COMPLETED"
    assert finished.stage == "COMPLETED"
    assert finished.result is not None
    assert "vqc" in finished.result["models"]
    assert "logistic_regression" in finished.result["models"]
    assert "rbf_svm" in finished.result["models"]
    assert "mlp" not in finished.result["models"]
    assert finished.result["decision_boundary"]["available"] is True
    assert len(finished.training_history) == 8


def test_invalid_feature_map_config_fails_gracefully():
    request = _small_request("invalid-test")
    request.feature_map.n_qubits = 5  # dataset has 2 features
    record = experiment_service.create_experiment(request)

    experiment_service.run_experiment(record.id)

    finished = experiment_service.get_experiment(record.id)
    assert finished.status == "FAILED"
    assert finished.error is not None


def test_list_and_delete_experiment():
    record = experiment_service.create_experiment(_small_request("to-delete"))
    ids = [r.id for r in experiment_service.list_experiments()]
    assert record.id in ids

    assert experiment_service.delete_experiment(record.id) is True
    assert experiment_service.get_experiment(record.id) is None
