import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

from app.services import classical_baseline_service


def _split():
    X, y = make_classification(n_samples=40, n_features=4, random_state=0)
    return train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)


def test_all_classical_models_train_and_predict():
    X_train, X_test, y_train, y_test = _split()
    for name in ("logistic_regression", "rbf_svm", "mlp", "random_forest"):
        result = classical_baseline_service.train_classical_model(name, X_train, y_train, X_test, random_seed=0)
        assert result.y_pred.shape == y_test.shape
        assert result.decision_scores.shape == y_test.shape


def test_hyperparameter_search_runs():
    X_train, X_test, y_train, y_test = _split()
    result = classical_baseline_service.train_classical_model(
        "rbf_svm", X_train, y_train, X_test, random_seed=0, search_hyperparameters=True
    )
    assert result.y_pred.shape == y_test.shape
