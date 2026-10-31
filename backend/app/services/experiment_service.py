"""Orchestrates the full experiment lifecycle and its persistence.

QUEUED -> VALIDATING -> PREPROCESSING -> BUILDING_CIRCUIT -> TRAINING_VQC
-> TRAINING_CLASSICAL_MODELS -> EVALUATING -> COMPLETED (or FAILED).
"""

import time
from datetime import datetime, timezone

import numpy as np
import qiskit
import qiskit_machine_learning
import sklearn
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.experiment import ExperimentRecord
from app.schemas.experiment import ExperimentCreateRequest
from app.services import (
    ansatz_service,
    circuit_analysis_service,
    classical_baseline_service,
    dataset_service,
    decision_boundary_service,
    evaluation_service,
    feature_map_service,
    preprocessing_service,
    vqc_service,
)

_SOFTWARE_VERSIONS = {
    "qiskit": qiskit.__version__,
    "qiskit_machine_learning": qiskit_machine_learning.__version__,
    "scikit_learn": sklearn.__version__,
    "numpy": np.__version__,
}

_CLASSICAL_MODEL_NAMES = {
    "logistic_regression": "logistic_regression",
    "mlp": "mlp",
    "rbf_svm": "rbf_svm",
    "random_forest": "random_forest",
}


def create_experiment(request: ExperimentCreateRequest) -> ExperimentRecord:
    db = SessionLocal()
    try:
        record = ExperimentRecord(
            name=request.name,
            status="QUEUED",
            stage="QUEUED",
            dataset_id=request.dataset.dataset_id,
            config=request.model_dump(mode="json"),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        db.expunge(record)
        return record
    finally:
        db.close()


def get_experiment(experiment_id: str) -> ExperimentRecord | None:
    db = SessionLocal()
    try:
        record = db.get(ExperimentRecord, experiment_id)
        if record:
            db.expunge(record)
        return record
    finally:
        db.close()


def list_experiments() -> list[ExperimentRecord]:
    db = SessionLocal()
    try:
        records = db.query(ExperimentRecord).order_by(ExperimentRecord.created_at.desc()).all()
        for r in records:
            db.expunge(r)
        return records
    finally:
        db.close()


def delete_experiment(experiment_id: str) -> bool:
    db = SessionLocal()
    try:
        record = db.get(ExperimentRecord, experiment_id)
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True
    finally:
        db.close()


def _update(db: Session, record: ExperimentRecord, **fields) -> None:
    for key, value in fields.items():
        setattr(record, key, value)
    db.add(record)
    db.commit()


def run_experiment(experiment_id: str) -> None:
    db = SessionLocal()
    try:
        record = db.get(ExperimentRecord, experiment_id)
        if record is None:
            return
        request = ExperimentCreateRequest.model_validate(record.config)
        _update(
            db,
            record,
            status="RUNNING",
            stage="VALIDATING",
            started_at=datetime.now(timezone.utc),
        )

        bundle = dataset_service.load_dataset(request.dataset)
        X_train_raw, X_test_raw, y_train, y_test = dataset_service.split_dataset(bundle, request.dataset)

        _update(db, record, stage="PREPROCESSING")
        preprocessed = preprocessing_service.apply_preprocessing(X_train_raw, X_test_raw, request.preprocessing)
        feature_map_service.validate_feature_map_config(request.feature_map, preprocessed.final_dim)
        ansatz_service.validate_ansatz_config(request.ansatz, preprocessed.final_dim)

        _update(db, record, stage="BUILDING_CIRCUIT")
        fm_circuit = feature_map_service.build_feature_map(request.feature_map)
        ansatz_circuit = ansatz_service.build_ansatz(request.ansatz, preprocessed.final_dim)
        combined_circuit = ansatz_service.build_combined_circuit(fm_circuit, ansatz_circuit)
        fm_summary = feature_map_service.summarize_circuit(fm_circuit)
        ansatz_summary = ansatz_service.summarize_ansatz(ansatz_circuit)
        combined_summary = feature_map_service.summarize_circuit(combined_circuit)

        _update(db, record, stage="TRAINING_VQC")
        local_history: list[dict] = []

        def on_point(point):
            local_history.append({"step": point.step, "objective_value": point.objective_value})
            _update(db, record, training_history=list(local_history))

        training_result = vqc_service.build_and_train(
            fm_circuit,
            ansatz_circuit,
            request.optimizer,
            request.training,
            preprocessed.X_train,
            y_train,
            on_point=on_point,
        )
        _inference_start = time.perf_counter()
        y_pred_vqc = training_result.model.predict(preprocessed.X_test)
        decision_scores_vqc = training_result.model.predict_proba(preprocessed.X_test)[:, 1]
        vqc_inference_seconds = time.perf_counter() - _inference_start
        vqc_eval = evaluation_service.evaluate(y_test, y_pred_vqc, decision_scores_vqc)

        _update(db, record, stage="TRAINING_CLASSICAL_MODELS")
        classical_trained: dict[str, object] = {}
        classical_results: dict[str, dict] = {}
        for name in _CLASSICAL_MODEL_NAMES:
            model_config = getattr(request.classical, name)
            if not model_config.enabled:
                continue
            trained = classical_baseline_service.train_classical_model(
                name,
                preprocessed.X_train,
                y_train,
                preprocessed.X_test,
                request.training.random_seed,
                model_config.search_hyperparameters,
            )
            classical_trained[name] = trained.model
            classical_results[name] = {"trained": trained}

        _update(db, record, stage="EVALUATING")
        models_payload = {
            "vqc": {
                "metrics": vqc_eval.__dict__,
                "train_seconds": training_result.train_seconds,
                "inference_seconds": vqc_inference_seconds,
                "config": {"optimizer": request.optimizer.optimizer, "maxiter": request.optimizer.maxiter},
            }
        }
        for name, payload in classical_results.items():
            trained = payload["trained"]
            ev = evaluation_service.evaluate(y_test, trained.y_pred, trained.decision_scores)
            models_payload[name] = {
                "metrics": ev.__dict__,
                "train_seconds": trained.train_seconds,
                "inference_seconds": trained.inference_seconds,
                "config": {"search_hyperparameters": getattr(request.classical, name).search_hyperparameters},
            }

        resource_summary = circuit_analysis_service.build_resource_summary(
            fm_summary,
            ansatz_summary,
            combined_summary,
            training_result.n_function_evaluations,
            request.training.shots if request.training.execution_mode == "noisy" else None,
            "StatevectorSampler (ideal)" if request.training.execution_mode == "ideal" else "AerSampler (noisy)",
        )

        decision_boundary_payload: dict
        if preprocessed.final_dim == 2:
            models_for_boundary = {"vqc": training_result.model, **classical_trained}
            boundary = decision_boundary_service.compute_decision_boundaries(
                preprocessed.X_train, preprocessed.X_test, models_for_boundary
            )
            decision_boundary_payload = {
                "available": True,
                "xs": boundary.xs,
                "ys": boundary.ys,
                "labels": boundary.labels,
                "train_points": [
                    {"x": float(p[0]), "y": float(p[1]), "label": int(label)}
                    for p, label in zip(preprocessed.X_train, y_train)
                ],
                "test_points": [
                    {"x": float(p[0]), "y": float(p[1]), "label": int(label)}
                    for p, label in zip(preprocessed.X_test, y_test)
                ],
            }
        else:
            decision_boundary_payload = {
                "available": False,
                "reason": f"Model operates in a {preprocessed.final_dim}-dimensional feature "
                "space; a genuine 2D decision boundary is only shown when the preprocessed "
                "space is exactly 2D.",
            }

        result = {
            "dataset": {
                "id": bundle.info.id,
                "name": bundle.info.name,
                "n_samples": bundle.X.shape[0],
                "n_features": bundle.X.shape[1],
                "class_names": bundle.class_names,
                "train_size": int(X_train_raw.shape[0]),
                "test_size": int(X_test_raw.shape[0]),
                "random_seed": request.dataset.random_seed,
            },
            "preprocessing": {
                "pipeline": preprocessed.pipeline_description,
                "original_dim": preprocessed.original_dim,
                "final_dim": preprocessed.final_dim,
            },
            "circuit": {
                "feature_map": request.feature_map.feature_map,
                "ansatz": request.ansatz.ansatz,
                "n_qubits": combined_summary.n_qubits,
                "feature_map_depth": fm_summary.depth,
                "ansatz_depth": ansatz_summary.depth,
                "combined_depth": combined_summary.depth,
                "gate_counts": combined_summary.gate_counts,
                "n_encoding_parameters": fm_summary.num_parameters,
                "n_trainable_parameters": ansatz_summary.num_parameters,
                "ascii_drawing": combined_summary.ascii_drawing,
            },
            "resource_summary": resource_summary.__dict__,
            "training": {
                "execution_mode": request.training.execution_mode,
                "shots": request.training.shots if request.training.execution_mode == "noisy" else None,
                "noise": request.training.noise.model_dump() if request.training.execution_mode == "noisy" else None,
                "optimizer": request.optimizer.optimizer,
                "configured_maxiter": training_result.configured_maxiter,
                "n_function_evaluations": training_result.n_function_evaluations,
                "initial_objective": training_result.initial_objective,
                "final_objective": training_result.final_objective,
                "best_objective": training_result.best_objective,
                "train_seconds": training_result.train_seconds,
                "stopped_reason": training_result.stopped_reason,
                "random_seed": request.training.random_seed,
            },
            "decision_boundary": decision_boundary_payload,
            "models": models_payload,
            "labels": {
                "y_train": y_train.tolist(),
                "y_test": y_test.tolist(),
            },
            "software_versions": _SOFTWARE_VERSIONS,
        }

        _update(
            db,
            record,
            status="COMPLETED",
            stage="COMPLETED",
            result=result,
            training_history=local_history,
            completed_at=datetime.now(timezone.utc),
        )
    except Exception as exc:  # noqa: BLE001 - surfaced to the user, not swallowed
        db.rollback()
        record = db.get(ExperimentRecord, experiment_id)
        if record is not None:
            _update(
                db,
                record,
                status="FAILED",
                stage="FAILED",
                error=str(exc),
                completed_at=datetime.now(timezone.utc),
            )
    finally:
        db.close()
