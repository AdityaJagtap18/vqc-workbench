import pytest

from app.schemas.vqc import OptimizerConfig
from app.services import optimizer_service


@pytest.mark.parametrize("name", ["COBYLA", "SPSA", "L_BFGS_B", "GradientDescent"])
def test_build_optimizer_succeeds_for_every_supported_type(name):
    config = OptimizerConfig(optimizer=name, maxiter=10)
    optimizer = optimizer_service.build_optimizer(config)
    assert optimizer is not None


def test_optimizer_info_flags_gradient_usage_correctly():
    assert optimizer_service.OPTIMIZER_INFO["COBYLA"]["uses_gradient"] is False
    assert optimizer_service.OPTIMIZER_INFO["SPSA"]["uses_gradient"] is False
    assert optimizer_service.OPTIMIZER_INFO["L_BFGS_B"]["uses_gradient"] is True
    assert optimizer_service.OPTIMIZER_INFO["GradientDescent"]["uses_gradient"] is True
