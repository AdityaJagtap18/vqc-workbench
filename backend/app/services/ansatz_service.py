"""Builds the variational ansatz — the TRAINABLE part of the VQC circuit.

Its parameters are optimized during training; feature-map parameters
(feature_map_service) are not. The two parameter sets are kept explicitly
distinct everywhere a circuit summary is reported.
"""

from qiskit import QuantumCircuit
from qiskit.circuit.library import efficient_su2, real_amplitudes

from app.schemas.vqc import AnsatzConfig
from app.services.feature_map_service import CircuitSummary, summarize_circuit


def validate_ansatz_config(config: AnsatzConfig, n_qubits: int) -> None:
    if n_qubits < 1:
        raise ValueError("Ansatz requires at least 1 qubit")
    if config.ansatz == "EfficientSU2" and config.su2_gates is not None and len(config.su2_gates) == 0:
        raise ValueError("EfficientSU2 su2_gates, if provided, must be non-empty")


def build_ansatz(config: AnsatzConfig, n_qubits: int) -> QuantumCircuit:
    if config.ansatz == "RealAmplitudes":
        return real_amplitudes(num_qubits=n_qubits, reps=config.reps, entanglement=config.entanglement)
    if config.ansatz == "EfficientSU2":
        return efficient_su2(
            num_qubits=n_qubits,
            reps=config.reps,
            entanglement=config.entanglement,
            su2_gates=config.su2_gates,
        )
    raise ValueError(f"Unsupported ansatz: {config.ansatz}")


def summarize_ansatz(circuit: QuantumCircuit) -> CircuitSummary:
    return summarize_circuit(circuit)


def build_combined_circuit(feature_map: QuantumCircuit, ansatz: QuantumCircuit) -> QuantumCircuit:
    """Feature map followed by ansatz — exactly what VQC itself evaluates."""
    combined = QuantumCircuit(feature_map.num_qubits)
    combined.compose(feature_map, inplace=True)
    combined.compose(ansatz, inplace=True)
    return combined
