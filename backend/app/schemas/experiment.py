from app.schemas.dataset import DatasetConfigRequest
from app.schemas.vqc import (
    AnsatzConfig,
    ClassicalConfig,
    FeatureMapConfig,
    OptimizerConfig,
    PreprocessingConfig,
    VQCTrainingConfig,
)
from pydantic import BaseModel


class ExperimentCreateRequest(BaseModel):
    name: str
    dataset: DatasetConfigRequest
    preprocessing: PreprocessingConfig = PreprocessingConfig()
    feature_map: FeatureMapConfig
    ansatz: AnsatzConfig = AnsatzConfig()
    optimizer: OptimizerConfig = OptimizerConfig()
    training: VQCTrainingConfig = VQCTrainingConfig()
    classical: ClassicalConfig = ClassicalConfig()


class ExperimentSummary(BaseModel):
    id: str
    name: str
    status: str
    stage: str
    dataset_id: str
    created_at: str
    started_at: str | None
    completed_at: str | None
    error: str | None


class ExperimentDetail(ExperimentSummary):
    config: dict
    result: dict | None
    training_history: list | None
