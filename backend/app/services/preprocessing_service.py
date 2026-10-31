"""Scaling and optional dimensionality reduction, always fit on the
training split only so no information from the test split leaks in.
Includes range mapping to keep encoded feature values well-scaled for
rotation-angle encoding in the quantum feature map.
"""

from dataclasses import dataclass

import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler, StandardScaler

from app.schemas.vqc import PreprocessingConfig


@dataclass
class PreprocessedData:
    X_train: np.ndarray
    X_test: np.ndarray
    original_dim: int
    final_dim: int
    pipeline_description: list[str]


def apply_preprocessing(
    X_train: np.ndarray, X_test: np.ndarray, config: PreprocessingConfig
) -> PreprocessedData:
    original_dim = X_train.shape[1]
    pipeline_description: list[str] = []

    if config.scaling == "standard":
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)
        pipeline_description.append("StandardScaler (fit on train)")
    elif config.scaling == "minmax":
        scaler = MinMaxScaler(feature_range=(0, np.pi))
        X_train = scaler.fit_transform(X_train)
        X_test = scaler.transform(X_test)
        pipeline_description.append("MinMaxScaler -> [0, pi] (fit on train)")
    else:
        pipeline_description.append("No scaling")

    if config.use_pca:
        n_components = config.n_components or min(X_train.shape[1], 2)
        if n_components > original_dim:
            raise ValueError(
                f"n_components ({n_components}) cannot exceed original feature count ({original_dim})"
            )
        pca = PCA(n_components=n_components, random_state=0)
        X_train = pca.fit_transform(X_train)
        X_test = pca.transform(X_test)
        pipeline_description.append(f"PCA -> {n_components} components (fit on train)")

    return PreprocessedData(
        X_train=X_train,
        X_test=X_test,
        original_dim=original_dim,
        final_dim=X_train.shape[1],
        pipeline_description=pipeline_description,
    )
