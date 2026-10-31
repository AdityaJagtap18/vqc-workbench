"""Classical baselines, trained on the identical preprocessed split as VQC
so the comparison is fair. Optional grid search uses a documented search
space, the same for every model of a given type.
"""

import time
from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC

GRID_SEARCH_SPACE = {
    "logistic_regression": {"C": [0.1, 1.0, 10.0]},
    "rbf_svm": {"C": [0.1, 1.0, 10.0], "gamma": ["scale", 0.1, 1.0]},
    "mlp": {"hidden_layer_sizes": [(16,), (32,), (16, 16)], "alpha": [1e-4, 1e-3]},
    "random_forest": {"n_estimators": [100, 200], "max_depth": [None, 5, 10]},
}


@dataclass
class ClassicalModelResult:
    y_pred: np.ndarray
    decision_scores: np.ndarray
    train_seconds: float
    inference_seconds: float
    model: object


def _decision_scores(model, X: np.ndarray) -> np.ndarray:
    if hasattr(model, "decision_function"):
        return model.decision_function(X)
    # MLP / RandomForest: use the positive-class probability as a score.
    return model.predict_proba(X)[:, 1]


def _base_model(name: str, random_seed: int):
    if name == "logistic_regression":
        return LogisticRegression(max_iter=2000, random_state=random_seed)
    if name == "rbf_svm":
        return SVC(kernel="rbf")
    if name == "mlp":
        return MLPClassifier(max_iter=2000, random_state=random_seed)
    if name == "random_forest":
        return RandomForestClassifier(random_state=random_seed)
    raise ValueError(f"Unsupported classical model: {name}")


def train_classical_model(
    name: str,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    random_seed: int,
    search_hyperparameters: bool = False,
) -> ClassicalModelResult:
    start = time.perf_counter()
    if search_hyperparameters:
        _, class_counts = np.unique(y_train, return_counts=True)
        cv = max(2, min(5, int(class_counts.min())))
        search = GridSearchCV(_base_model(name, random_seed), GRID_SEARCH_SPACE[name], cv=cv)
        search.fit(X_train, y_train)
        model = search.best_estimator_
    else:
        model = _base_model(name, random_seed)
        model.fit(X_train, y_train)
    train_seconds = time.perf_counter() - start

    start = time.perf_counter()
    y_pred = model.predict(X_test)
    decision_scores = _decision_scores(model, X_test)
    inference_seconds = time.perf_counter() - start

    return ClassicalModelResult(
        y_pred=y_pred,
        decision_scores=decision_scores,
        train_seconds=train_seconds,
        inference_seconds=inference_seconds,
        model=model,
    )
