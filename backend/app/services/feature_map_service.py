"""Builds the actual configured Qiskit feature-map circuit.

Feature-map parameters are data-encoding inputs — bound to the classical
feature values at inference time, never trained. This is distinct from
the ansatz's trainable parameters (see ansatz_service).
"""

from dataclasses import dataclass

from qiskit import QuantumCircuit
from qiskit.circuit.library import pauli_feature_map, z_feature_map, zz_feature_map

from app.schemas.vqc import FeatureMapConfig


def validate_feature_map_config(config: FeatureMapConfig, n_features: int) -> None:
    if config.n_qubits != n_features:
        raise ValueError(
            f"Feature map is configured for {config.n_qubits} qubits but the "
            f"preprocessed data has {n_features} features. Adjust qubit count "
            "or enable PCA to match."
        )
    if config.feature_map == "PauliFeatureMap" and not config.paulis:
        raise ValueError("PauliFeatureMap requires at least one Pauli string, e.g. ['Z', 'ZZ'].")


def build_feature_map(config: FeatureMapConfig) -> QuantumCircuit:
    if config.feature_map == "ZFeatureMap":
        return z_feature_map(feature_dimension=config.n_qubits, reps=config.reps)
    if config.feature_map == "ZZFeatureMap":
        return zz_feature_map(
            feature_dimension=config.n_qubits,
            reps=config.reps,
            entanglement=config.entanglement,
        )
    if config.feature_map == "PauliFeatureMap":
        return pauli_feature_map(
            feature_dimension=config.n_qubits,
            reps=config.reps,
            entanglement=config.entanglement,
            paulis=config.paulis or ["Z", "ZZ"],
        )
    raise ValueError(f"Unsupported feature map: {config.feature_map}")


@dataclass
class CircuitSummary:
    n_qubits: int
    depth: int
    gate_counts: dict[str, int]
    num_parameters: int
    ascii_drawing: str


def summarize_circuit(circuit: QuantumCircuit) -> CircuitSummary:
    decomposed = circuit.decompose()
    gate_counts = dict(decomposed.count_ops())
    return CircuitSummary(
        n_qubits=circuit.num_qubits,
        depth=decomposed.depth(),
        gate_counts=gate_counts,
        num_parameters=circuit.num_parameters,
        ascii_drawing=str(circuit.draw(output="text", fold=100)),
    )
