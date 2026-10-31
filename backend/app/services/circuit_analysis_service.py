"""Aggregates circuit resource information for the results payload,
keeping theoretical circuit structure (depth, gate counts, parameter
counts — computable before any execution) explicitly separate from
actual execution measurements (function evaluations, shots, backend)."""

from dataclasses import dataclass

from app.services.feature_map_service import CircuitSummary


@dataclass
class CircuitResourceSummary:
    n_qubits: int
    feature_map_depth: int
    ansatz_depth: int
    combined_depth: int
    gate_counts: dict[str, int]
    n_encoding_parameters: int
    n_trainable_parameters: int
    n_function_evaluations: int
    shots: int | None
    simulation_backend: str


def build_resource_summary(
    feature_map_summary: CircuitSummary,
    ansatz_summary: CircuitSummary,
    combined_summary: CircuitSummary,
    n_function_evaluations: int,
    shots: int | None,
    simulation_backend: str,
) -> CircuitResourceSummary:
    return CircuitResourceSummary(
        n_qubits=combined_summary.n_qubits,
        feature_map_depth=feature_map_summary.depth,
        ansatz_depth=ansatz_summary.depth,
        combined_depth=combined_summary.depth,
        gate_counts=combined_summary.gate_counts,
        n_encoding_parameters=feature_map_summary.num_parameters,
        n_trainable_parameters=ansatz_summary.num_parameters,
        n_function_evaluations=n_function_evaluations,
        shots=shots,
        simulation_backend=simulation_backend,
    )
