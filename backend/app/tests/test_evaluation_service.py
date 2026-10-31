import numpy as np

from app.services import evaluation_service


def test_perfect_predictions_give_perfect_metrics():
    y_true = np.array([0, 1, 0, 1, 0, 1])
    y_pred = np.array([0, 1, 0, 1, 0, 1])
    scores = np.array([-1, 1, -1, 1, -1, 1])
    result = evaluation_service.evaluate(y_true, y_pred, scores)
    assert result.accuracy == 1.0
    assert result.f1 == 1.0
    assert result.mcc == 1.0
    assert result.roc_auc == 1.0


def test_confusion_matrix_matches_inputs():
    y_true = np.array([0, 0, 1, 1])
    y_pred = np.array([0, 1, 1, 1])
    scores = np.array([-2, 0.5, 1, 2])
    result = evaluation_service.evaluate(y_true, y_pred, scores)
    assert result.confusion_matrix == [[1, 1], [0, 2]]
