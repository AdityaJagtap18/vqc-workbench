import numpy as np

from app.schemas.dataset import DatasetConfigRequest
from app.services import dataset_service


def test_list_datasets_returns_catalog():
    datasets = dataset_service.list_datasets()
    ids = {d.id for d in datasets}
    assert ids == {
        "iris_binary",
        "breast_cancer",
        "two_moons",
        "two_circles",
        "synthetic",
    }


def test_iris_binary_has_two_classes():
    config = DatasetConfigRequest(dataset_id="iris_binary")
    bundle = dataset_service.load_dataset(config)
    assert set(np.unique(bundle.y)) == {0, 1}
    assert bundle.X.shape[1] == 4


def test_split_is_reproducible_for_same_seed():
    config = DatasetConfigRequest(dataset_id="two_moons", random_seed=7, test_size=0.25)
    bundle = dataset_service.load_dataset(config)
    split_a = dataset_service.split_dataset(bundle, config)
    split_b = dataset_service.split_dataset(bundle, config)
    for a, b in zip(split_a, split_b):
        assert np.array_equal(a, b)


def test_preview_shapes_are_consistent():
    config = DatasetConfigRequest(dataset_id="breast_cancer", test_size=0.2)
    preview = dataset_service.build_preview(config)
    assert preview.shape[0] == preview.train_shape[0] + preview.test_shape[0]
    assert sum(entry.count for entry in preview.class_distribution) == preview.shape[0]


def test_class_selection_remaps_labels():
    config = DatasetConfigRequest(dataset_id="iris_binary", selected_classes=[1, 2])
    bundle = dataset_service.load_dataset(config)
    assert set(np.unique(bundle.y)) == {0, 1}
