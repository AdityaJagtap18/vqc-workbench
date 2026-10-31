import pytest

from app.schemas.vqc import FeatureMapConfig
from app.services import feature_map_service


def test_zz_feature_map_builds_with_correct_qubit_count():
    config = FeatureMapConfig(feature_map="ZZFeatureMap", n_qubits=3, reps=2, entanglement="linear")
    circuit = feature_map_service.build_feature_map(config)
    assert circuit.num_qubits == 3


def test_summary_is_derived_from_the_real_circuit():
    config = FeatureMapConfig(feature_map="ZFeatureMap", n_qubits=2, reps=1, entanglement="linear")
    circuit = feature_map_service.build_feature_map(config)
    summary = feature_map_service.summarize_circuit(circuit)
    assert summary.n_qubits == 2
    assert summary.depth > 0
    assert sum(summary.gate_counts.values()) > 0


def test_validate_rejects_qubit_mismatch():
    config = FeatureMapConfig(feature_map="ZZFeatureMap", n_qubits=4, reps=1, entanglement="linear")
    with pytest.raises(ValueError):
        feature_map_service.validate_feature_map_config(config, n_features=2)


def test_pauli_feature_map_requires_paulis():
    config = FeatureMapConfig(feature_map="PauliFeatureMap", n_qubits=2, reps=1, entanglement="linear")
    with pytest.raises(ValueError):
        feature_map_service.validate_feature_map_config(config, n_features=2)
