from typing import Literal

from pydantic import BaseModel, Field

FeatureMapType = Literal["ZFeatureMap", "ZZFeatureMap", "PauliFeatureMap"]
AnsatzType = Literal["RealAmplitudes", "EfficientSU2"]
Entanglement = Literal["linear", "circular", "full"]
ScalingMethod = Literal["standard", "minmax", "none"]
OptimizerType = Literal["COBYLA", "SPSA", "L_BFGS_B", "GradientDescent"]
ExecutionMode = Literal["ideal", "noisy"]


class PreprocessingConfig(BaseModel):
    scaling: ScalingMethod = "standard"
    use_pca: bool = False
    n_components: int | None = None


class FeatureMapConfig(BaseModel):
    feature_map: FeatureMapType = "ZZFeatureMap"
    n_qubits: int = Field(ge=1, le=6)
    reps: int = Field(default=2, ge=1, le=4)
    entanglement: Entanglement = "linear"
    paulis: list[str] | None = None


class AnsatzConfig(BaseModel):
    ansatz: AnsatzType = "RealAmplitudes"
    reps: int = Field(default=2, ge=1, le=5)
    entanglement: Entanglement = "linear"
    su2_gates: list[str] | None = Field(
        default=None, description="Only used when ansatz == EfficientSU2, e.g. ['ry', 'rz']."
    )


class OptimizerConfig(BaseModel):
    optimizer: OptimizerType = "COBYLA"
    maxiter: int = Field(default=100, ge=1, le=2000)
    learning_rate: float | None = Field(
        default=None, description="GradientDescent / SPSA only; None uses the library default."
    )
    perturbation: float | None = Field(
        default=None, description="SPSA only; None uses the library default."
    )
    tolerance: float | None = Field(
        default=None, description="COBYLA / GradientDescent convergence tolerance; None uses the library default."
    )


class NoiseConfig(BaseModel):
    enabled: bool = False
    depolarizing_prob: float = Field(default=0.01, ge=0.0, le=1.0)
    readout_error_prob: float = Field(default=0.01, ge=0.0, le=1.0)


class VQCTrainingConfig(BaseModel):
    execution_mode: ExecutionMode = "ideal"
    shots: int = Field(default=1024, ge=16, le=20000)
    random_seed: int = Field(default=42)
    noise: NoiseConfig = NoiseConfig()


class ClassicalModelConfig(BaseModel):
    enabled: bool = True
    search_hyperparameters: bool = False


class ClassicalConfig(BaseModel):
    logistic_regression: ClassicalModelConfig = ClassicalModelConfig()
    mlp: ClassicalModelConfig = ClassicalModelConfig()
    rbf_svm: ClassicalModelConfig = ClassicalModelConfig()
    random_forest: ClassicalModelConfig = ClassicalModelConfig(enabled=False)
