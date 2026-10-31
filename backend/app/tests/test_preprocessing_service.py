import numpy as np
import pytest

from app.schemas.vqc import PreprocessingConfig
from app.services import preprocessing_service


def _toy_data():
    rng = np.random.default_rng(0)
    X_train = rng.uniform(-5, 5, size=(20, 4))
    X_test = rng.uniform(-5, 5, size=(8, 4))
    return X_train, X_test


def test_standard_scaling_fits_on_train_only():
    X_train, X_test = _toy_data()
    result = preprocessing_service.apply_preprocessing(
        X_train, X_test, PreprocessingConfig(scaling="standard")
    )
    assert abs(result.X_train.mean()) < 1e-6
    # test split need not be centered since the scaler was fit on train only
    assert result.final_dim == 4


def test_minmax_scaling_maps_into_0_pi():
    X_train, X_test = _toy_data()
    result = preprocessing_service.apply_preprocessing(
        X_train, X_test, PreprocessingConfig(scaling="minmax")
    )
    assert result.X_train.min() >= -1e-9
    assert result.X_train.max() <= np.pi + 1e-9


def test_pca_reduces_dimension():
    X_train, X_test = _toy_data()
    result = preprocessing_service.apply_preprocessing(
        X_train, X_test, PreprocessingConfig(use_pca=True, n_components=2)
    )
    assert result.final_dim == 2
    assert result.original_dim == 4


def test_pca_rejects_too_many_components():
    X_train, X_test = _toy_data()
    with pytest.raises(ValueError):
        preprocessing_service.apply_preprocessing(
            X_train, X_test, PreprocessingConfig(use_pca=True, n_components=10)
        )
