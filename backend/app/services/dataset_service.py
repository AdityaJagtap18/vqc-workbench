"""Dataset loading, splitting and inspection.

Nothing here fits a scaler or selector — that happens in
preprocessing_service, strictly on the training split, to avoid leakage.
"""

from dataclasses import dataclass

import numpy as np
from sklearn.datasets import (
    load_breast_cancer,
    load_iris,
    make_circles,
    make_classification,
    make_moons,
)
from sklearn.model_selection import train_test_split

from app.schemas.dataset import (
    ClassDistributionEntry,
    DatasetConfigRequest,
    DatasetId,
    DatasetInfo,
    DatasetPreviewResponse,
)

_CATALOG: dict[DatasetId, DatasetInfo] = {
    "iris_binary": DatasetInfo(
        id="iris_binary",
        name="Iris (binary subset)",
        description="Classic Iris dataset restricted to two of its three classes "
        "for binary classification.",
        n_samples=100,
        n_features=4,
        feature_names=["sepal length", "sepal width", "petal length", "petal width"],
        class_names=["setosa", "versicolor"],
        supports_class_selection=True,
    ),
    "breast_cancer": DatasetInfo(
        id="breast_cancer",
        name="Breast Cancer Wisconsin",
        description="Diagnostic breast cancer dataset (30 features, binary malignant/benign).",
        n_samples=569,
        n_features=30,
        feature_names=[],
        class_names=["malignant", "benign"],
        supports_class_selection=False,
    ),
    "two_moons": DatasetInfo(
        id="two_moons",
        name="Two Moons",
        description="Synthetic 2D interleaving half-moons — a nonlinear separability benchmark.",
        n_samples=200,
        n_features=2,
        feature_names=["x1", "x2"],
        class_names=["class 0", "class 1"],
        supports_class_selection=False,
    ),
    "two_circles": DatasetInfo(
        id="two_circles",
        name="Two Circles",
        description="Synthetic 2D concentric circles — radially separable, linearly inseparable.",
        n_samples=200,
        n_features=2,
        feature_names=["x1", "x2"],
        class_names=["class 0", "class 1"],
        supports_class_selection=False,
    ),
    "synthetic": DatasetInfo(
        id="synthetic",
        name="Synthetic classification",
        description="scikit-learn make_classification — configurable sample count and noise.",
        n_samples=200,
        n_features=4,
        feature_names=["f1", "f2", "f3", "f4"],
        class_names=["class 0", "class 1"],
        supports_class_selection=False,
    ),
}


@dataclass
class DatasetBundle:
    info: DatasetInfo
    X: np.ndarray
    y: np.ndarray
    feature_names: list[str]
    class_names: list[str]


def list_datasets() -> list[DatasetInfo]:
    return list(_CATALOG.values())


def get_dataset_info(dataset_id: DatasetId) -> DatasetInfo:
    if dataset_id not in _CATALOG:
        raise ValueError(f"Unknown dataset id: {dataset_id}")
    return _CATALOG[dataset_id]


def load_dataset(config: DatasetConfigRequest) -> DatasetBundle:
    info = get_dataset_info(config.dataset_id)

    if config.dataset_id == "iris_binary":
        raw = load_iris()
        classes = config.selected_classes or [0, 1]
        if len(classes) != 2:
            raise ValueError("iris_binary requires exactly 2 selected classes")
        mask = np.isin(raw.target, classes)
        X, y_raw = raw.data[mask], raw.target[mask]
        remap = {c: i for i, c in enumerate(sorted(classes))}
        y = np.array([remap[v] for v in y_raw])
        feature_names = list(raw.feature_names)
        class_names = [raw.target_names[c] for c in sorted(classes)]

    elif config.dataset_id == "breast_cancer":
        raw = load_breast_cancer()
        X, y = raw.data, raw.target
        feature_names = list(raw.feature_names)
        class_names = list(raw.target_names)

    elif config.dataset_id == "two_moons":
        n = config.n_samples or 200
        noise = config.noise if config.noise is not None else 0.2
        X, y = make_moons(n_samples=n, noise=noise, random_state=config.random_seed)
        feature_names = ["x1", "x2"]
        class_names = ["class 0", "class 1"]

    elif config.dataset_id == "two_circles":
        n = config.n_samples or 200
        noise = config.noise if config.noise is not None else 0.1
        X, y = make_circles(
            n_samples=n, noise=noise, factor=0.5, random_state=config.random_seed
        )
        feature_names = ["x1", "x2"]
        class_names = ["class 0", "class 1"]

    elif config.dataset_id == "synthetic":
        n = config.n_samples or 200
        noise_frac = config.noise if config.noise is not None else 0.1
        X, y = make_classification(
            n_samples=n,
            n_features=4,
            n_informative=3,
            n_redundant=1,
            n_classes=2,
            flip_y=noise_frac,
            random_state=config.random_seed,
        )
        feature_names = ["f1", "f2", "f3", "f4"]
        class_names = ["class 0", "class 1"]

    else:  # pragma: no cover - exhaustive over DatasetId
        raise ValueError(f"Unsupported dataset id: {config.dataset_id}")

    return DatasetBundle(
        info=info, X=X, y=y, feature_names=feature_names, class_names=class_names
    )


def split_dataset(
    bundle: DatasetBundle, config: DatasetConfigRequest
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    X_train, X_test, y_train, y_test = train_test_split(
        bundle.X,
        bundle.y,
        test_size=config.test_size,
        random_state=config.random_seed,
        stratify=bundle.y,
    )
    return X_train, X_test, y_train, y_test


def build_preview(config: DatasetConfigRequest) -> DatasetPreviewResponse:
    bundle = load_dataset(config)
    X_train, X_test, y_train, y_test = split_dataset(bundle, config)

    labels, counts = np.unique(bundle.y, return_counts=True)
    class_distribution = [
        ClassDistributionEntry(
            label=int(label),
            class_name=bundle.class_names[int(label)],
            count=int(count),
        )
        for label, count in zip(labels, counts)
    ]

    n_preview = min(10, bundle.X.shape[0])
    sample_rows = [
        {
            **{
                name: float(bundle.X[i, j])
                for j, name in enumerate(bundle.feature_names)
            },
            "label": int(bundle.y[i]),
            "class_name": bundle.class_names[int(bundle.y[i])],
        }
        for i in range(n_preview)
    ]

    feature_distributions = {
        name: bundle.X[:, j].tolist() for j, name in enumerate(bundle.feature_names)
    }

    info = bundle.info.model_copy(
        update={
            "n_samples": bundle.X.shape[0],
            "n_features": bundle.X.shape[1],
            "feature_names": bundle.feature_names,
            "class_names": bundle.class_names,
        }
    )

    return DatasetPreviewResponse(
        dataset=info,
        shape=(bundle.X.shape[0], bundle.X.shape[1]),
        train_shape=(X_train.shape[0], X_train.shape[1]),
        test_shape=(X_test.shape[0], X_test.shape[1]),
        class_distribution=class_distribution,
        sample_rows=sample_rows,
        feature_distributions=feature_distributions,
    )
