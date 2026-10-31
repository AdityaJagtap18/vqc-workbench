"""Builds the configured optimizer and documents each one briefly.

Not every optimizer here uses gradients — COBYLA is a gradient-free
derivative-free method, SPSA approximates gradients stochastically from
two function evaluations per step, and L_BFGS_B / GradientDescent rely on
(numerically estimated, since VQC exposes no analytic gradient by
default) gradients. The UI must reflect this, not assume uniformity.
"""

from qiskit_machine_learning.optimizers import COBYLA, GradientDescent, L_BFGS_B, Optimizer, SPSA

from app.schemas.vqc import OptimizerConfig

OPTIMIZER_INFO: dict[str, dict[str, str | bool]] = {
    "COBYLA": {
        "uses_gradient": False,
        "description": "Constrained Optimization BY Linear Approximation — a derivative-free "
        "method that builds a local linear model from function evaluations alone.",
    },
    "SPSA": {
        "uses_gradient": False,
        "description": "Simultaneous Perturbation Stochastic Approximation — estimates a "
        "gradient direction from just two randomly-perturbed function evaluations per step, "
        "well suited to noisy quantum objective functions.",
    },
    "L_BFGS_B": {
        "uses_gradient": True,
        "description": "Limited-memory BFGS with box constraints — a quasi-Newton gradient-based "
        "method; gradients are estimated numerically here since VQC provides no analytic gradient "
        "by default.",
    },
    "GradientDescent": {
        "uses_gradient": True,
        "description": "Plain gradient descent with a configurable (optionally decaying) learning "
        "rate; gradients are estimated numerically.",
    },
}


def build_optimizer(config: OptimizerConfig) -> Optimizer:
    if config.optimizer == "COBYLA":
        kwargs = {"maxiter": config.maxiter}
        if config.tolerance is not None:
            kwargs["tol"] = config.tolerance
        return COBYLA(**kwargs)

    if config.optimizer == "SPSA":
        kwargs = {"maxiter": config.maxiter}
        if config.learning_rate is not None:
            kwargs["learning_rate"] = config.learning_rate
        if config.perturbation is not None:
            kwargs["perturbation"] = config.perturbation
        return SPSA(**kwargs)

    if config.optimizer == "L_BFGS_B":
        return L_BFGS_B(maxiter=config.maxiter, maxfun=max(config.maxiter * 20, 1000))

    if config.optimizer == "GradientDescent":
        kwargs = {"maxiter": config.maxiter}
        if config.learning_rate is not None:
            kwargs["learning_rate"] = config.learning_rate
        if config.tolerance is not None:
            kwargs["tol"] = config.tolerance
        return GradientDescent(**kwargs)

    raise ValueError(f"Unsupported optimizer: {config.optimizer}")
