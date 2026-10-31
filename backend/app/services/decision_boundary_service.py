"""Decision-boundary grids for genuinely 2D preprocessed feature spaces.

Only computed when the model was actually trained on 2 features (either a
2-feature dataset, or PCA explicitly reduced to 2 components) — evaluated
directly in that space, so it is the model's real boundary, not a
projection of a higher-dimensional one.
"""

from dataclasses import dataclass

import numpy as np

GRID_RESOLUTION = 35
GRID_PADDING = 0.5


@dataclass
class BoundaryGrid:
    xs: list[float]
    ys: list[float]
    labels: dict[str, list[list[int]]]


def _build_grid(X: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    x_min, x_max = X[:, 0].min() - GRID_PADDING, X[:, 0].max() + GRID_PADDING
    y_min, y_max = X[:, 1].min() - GRID_PADDING, X[:, 1].max() + GRID_PADDING
    xs = np.linspace(x_min, x_max, GRID_RESOLUTION)
    ys = np.linspace(y_min, y_max, GRID_RESOLUTION)
    xx, yy = np.meshgrid(xs, ys)
    grid_points = np.column_stack([xx.ravel(), yy.ravel()])
    return xs, ys, grid_points


def compute_decision_boundaries(
    X_train_2d: np.ndarray, X_test_2d: np.ndarray, models: dict[str, object]
) -> BoundaryGrid:
    combined = np.vstack([X_train_2d, X_test_2d])
    xs, ys, grid_points = _build_grid(combined)

    labels: dict[str, list[list[int]]] = {}
    for name, model in models.items():
        preds = np.asarray(model.predict(grid_points)).astype(int)
        labels[name] = preds.reshape(GRID_RESOLUTION, GRID_RESOLUTION).tolist()

    return BoundaryGrid(xs=xs.tolist(), ys=ys.tolist(), labels=labels)
