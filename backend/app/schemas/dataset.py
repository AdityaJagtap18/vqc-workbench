from typing import Literal

from pydantic import BaseModel, Field

DatasetId = Literal[
    "iris_binary",
    "breast_cancer",
    "two_moons",
    "two_circles",
    "synthetic",
]


class DatasetInfo(BaseModel):
    id: DatasetId
    name: str
    description: str
    n_samples: int
    n_features: int
    feature_names: list[str]
    class_names: list[str]
    supports_class_selection: bool


class DatasetConfigRequest(BaseModel):
    dataset_id: DatasetId
    selected_classes: list[int] | None = Field(
        default=None,
        description="Subset of class labels to keep, for datasets with >2 classes.",
    )
    test_size: float = Field(default=0.3, gt=0.0, lt=1.0)
    random_seed: int = Field(default=42)
    n_samples: int | None = Field(
        default=None,
        description="Only used by the synthetic dataset generator.",
    )
    noise: float | None = Field(
        default=None,
        description="Only used by two_moons / two_circles / synthetic.",
    )


class ClassDistributionEntry(BaseModel):
    label: int
    class_name: str
    count: int


class DatasetPreviewResponse(BaseModel):
    dataset: DatasetInfo
    shape: tuple[int, int]
    train_shape: tuple[int, int]
    test_shape: tuple[int, int]
    class_distribution: list[ClassDistributionEntry]
    sample_rows: list[dict]
    feature_distributions: dict[str, list[float]]
