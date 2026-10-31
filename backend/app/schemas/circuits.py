from pydantic import BaseModel

from app.schemas.vqc import AnsatzConfig, FeatureMapConfig


class CircuitPreviewRequest(BaseModel):
    feature_map: FeatureMapConfig
    ansatz: AnsatzConfig


class CircuitSummaryResponse(BaseModel):
    n_qubits: int
    depth: int
    gate_counts: dict[str, int]
    num_parameters: int
    ascii_drawing: str


class CircuitPreviewResponse(BaseModel):
    feature_map: CircuitSummaryResponse
    ansatz: CircuitSummaryResponse
    combined: CircuitSummaryResponse
    n_encoding_parameters: int
    n_trainable_parameters: int
