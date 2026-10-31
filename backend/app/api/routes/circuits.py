from fastapi import APIRouter, HTTPException

from app.schemas.circuits import CircuitPreviewRequest, CircuitPreviewResponse, CircuitSummaryResponse
from app.services import ansatz_service, feature_map_service

router = APIRouter(prefix="/circuits", tags=["circuits"])


def _to_response(summary) -> CircuitSummaryResponse:
    return CircuitSummaryResponse(
        n_qubits=summary.n_qubits,
        depth=summary.depth,
        gate_counts=summary.gate_counts,
        num_parameters=summary.num_parameters,
        ascii_drawing=summary.ascii_drawing,
    )


@router.post("/preview", response_model=CircuitPreviewResponse)
def preview_circuit(request: CircuitPreviewRequest) -> CircuitPreviewResponse:
    try:
        feature_map_service.validate_feature_map_config(request.feature_map, request.feature_map.n_qubits)
        ansatz_service.validate_ansatz_config(request.ansatz, request.feature_map.n_qubits)

        fm_circuit = feature_map_service.build_feature_map(request.feature_map)
        ansatz_circuit = ansatz_service.build_ansatz(request.ansatz, request.feature_map.n_qubits)
        combined_circuit = ansatz_service.build_combined_circuit(fm_circuit, ansatz_circuit)

        fm_summary = feature_map_service.summarize_circuit(fm_circuit)
        ansatz_summary = ansatz_service.summarize_ansatz(ansatz_circuit)
        combined_summary = feature_map_service.summarize_circuit(combined_circuit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return CircuitPreviewResponse(
        feature_map=_to_response(fm_summary),
        ansatz=_to_response(ansatz_summary),
        combined=_to_response(combined_summary),
        n_encoding_parameters=fm_summary.num_parameters,
        n_trainable_parameters=ansatz_summary.num_parameters,
    )
