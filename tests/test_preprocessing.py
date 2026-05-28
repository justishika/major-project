"""Unit tests for data preprocessing module."""
import unittest
import numpy as np
import sys
import os

# Add project root to path (works from any directory)
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from data_preprocessing import (
    load_and_preprocess_data,
    get_stratified_subsample,
    prepare_train_test_split,
    DATASET_CONFIG,
)


class TestDataPreprocessing(unittest.TestCase):
    """Test data loading, scaling, and preprocessing."""

    def setUp(self):
        """Load parkinsons dataset for unit tests."""
        self.X, self.y, self.pca_info = load_and_preprocess_data(
            'parkinsons', n_components=4, use_pca=True
        )

    def test_feature_scaling_range(self):
        """Verify all features are scaled to [-π, π]."""
        self.assertTrue(
            np.all(self.X >= -np.pi - 1e-6),
            f"Some features < -π: min={self.X.min()}"
        )
        self.assertTrue(
            np.all(self.X <= np.pi + 1e-6),
            f"Some features > π: max={self.X.max()}"
        )

    def test_no_nan_values(self):
        """Ensure no NaN or inf values."""
        self.assertFalse(np.any(np.isnan(self.X)), "X contains NaN values")
        self.assertFalse(np.any(np.isinf(self.X)), "X contains inf values")
        self.assertFalse(np.any(np.isnan(self.y)), "y contains NaN values")

    def test_label_binary(self):
        """Confirm labels are {0, 1}."""
        unique_labels = sorted(set(self.y))
        self.assertEqual(unique_labels, [0, 1], f"Expected labels {{0,1}}, got {unique_labels}")

    def test_correct_dimensions(self):
        """Check X and y have matching first dimension."""
        self.assertEqual(
            len(self.X), len(self.y),
            f"X and y length mismatch: {len(self.X)} vs {len(self.y)}"
        )
        self.assertEqual(
            self.X.shape[1], 4,
            f"Expected 4 PCA components, got {self.X.shape[1]}"
        )

    def test_pca_info_structure(self):
        """Verify PCA info dict has expected keys."""
        expected_keys = {'explained_variance_ratio'}
        self.assertTrue(
            expected_keys.issubset(self.pca_info.keys()),
            f"Missing keys in pca_info: {expected_keys - self.pca_info.keys()}"
        )
        # Cumsum of variance should be close to total variance
        var_ratio = self.pca_info['explained_variance_ratio']
        self.assertGreater(np.sum(var_ratio), 0.7, "PCA explains < 70% variance")


class TestStratifiedSampling(unittest.TestCase):
    """Test stratified subsampling functionality."""

    def setUp(self):
        """Load data."""
        self.X, self.y, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)

    def test_subsample_size(self):
        """Verify returned subset has correct size."""
        for size in [20, 50, 100]:
            X_sub, y_sub = get_stratified_subsample(
                self.X, self.y, sample_size=size, random_state=42
            )
            self.assertEqual(len(X_sub), size, f"Expected size {size}, got {len(X_sub)}")
            self.assertEqual(len(y_sub), size, f"Expected size {size}, got {len(y_sub)}")

    def test_stratified_preserves_class_ratio(self):
        """Check stratified sample maintains approximate class balance."""
        original_ratio = (self.y == 1).sum() / len(self.y)
        
        for size in [20, 50, 100]:
            X_sub, y_sub = get_stratified_subsample(
                self.X, self.y, sample_size=size, random_state=42
            )
            sampled_ratio = (y_sub == 1).sum() / len(y_sub)
            
            # Allow up to 15 percentage point deviation
            self.assertAlmostEqual(
                sampled_ratio, original_ratio, delta=0.15,
                msg=f"Size {size}: ratio {sampled_ratio:.2f} too far from {original_ratio:.2f}"
            )

    def test_reproducibility_fixed_seed(self):
        """Same seed should produce identical subsamples."""
        X_a, y_a = get_stratified_subsample(
            self.X, self.y, sample_size=50, random_state=42
        )
        X_b, y_b = get_stratified_subsample(
            self.X, self.y, sample_size=50, random_state=42
        )
        
        np.testing.assert_array_almost_equal(X_a, X_b)
        np.testing.assert_array_equal(y_a, y_b)


class TestTrainTestSplit(unittest.TestCase):
    """Test train-test splitting."""

    def setUp(self):
        """Prepare a small subsample."""
        X, y, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)
        self.X_sub, self.y_sub = get_stratified_subsample(X, y, sample_size=50, random_state=42)

    def test_split_proportions(self):
        """Verify train-test split respects test_size parameter."""
        X_train, X_test, y_train, y_test = prepare_train_test_split(
            self.X_sub, self.y_sub, test_size=0.3, random_state=42
        )
        
        test_ratio = len(X_test) / len(self.X_sub)
        self.assertAlmostEqual(test_ratio, 0.3, places=1)
        self.assertAlmostEqual(len(X_train) / len(self.X_sub), 0.7, places=1)

    def test_split_preserves_data(self):
        """Total size should equal original."""
        X_train, X_test, y_train, y_test = prepare_train_test_split(
            self.X_sub, self.y_sub, test_size=0.3, random_state=42
        )
        
        self.assertEqual(
            len(X_train) + len(X_test), len(self.X_sub),
            "Split does not preserve total size"
        )
        self.assertEqual(len(y_train) + len(y_test), len(self.y_sub))

    def test_split_stratified(self):
        """Class balance should be maintained in both train and test."""
        X_train, X_test, y_train, y_test = prepare_train_test_split(
            self.X_sub, self.y_sub, test_size=0.3, random_state=42
        )
        
        train_ratio = (y_train == 1).sum() / len(y_train) if len(y_train) > 0 else 0
        test_ratio = (y_test == 1).sum() / len(y_test) if len(y_test) > 0 else 0
        original_ratio = (self.y_sub == 1).sum() / len(self.y_sub)
        
        # Both should be close to original
        self.assertAlmostEqual(train_ratio, original_ratio, delta=0.15)
        self.assertAlmostEqual(test_ratio, original_ratio, delta=0.15)


class TestAllDatasets(unittest.TestCase):
    """Test that all configured datasets load successfully."""

    def test_all_datasets_load(self):
        """Verify every dataset in DATASET_CONFIG can be loaded."""
        # Some datasets may not be available online; skip them gracefully
        skip_datasets = {'mammographic_mass'}  # Known to have download issues
        
        for dataset_name in DATASET_CONFIG.keys():
            if dataset_name in skip_datasets:
                continue  # Skip unavailable datasets
                
            with self.subTest(dataset=dataset_name):
                try:
                    X, y, pca_info = load_and_preprocess_data(
                        dataset_name, n_components=4, use_pca=True
                    )
                    self.assertGreater(len(X), 0, f"Empty dataset: {dataset_name}")
                    self.assertEqual(len(X), len(y), f"X-y size mismatch: {dataset_name}")
                    # Verify feature range
                    self.assertTrue(np.all(X >= -np.pi - 1e-6), f"Out of range X: {dataset_name}")
                    self.assertTrue(np.all(X <= np.pi + 1e-6), f"Out of range X: {dataset_name}")
                except Exception as e:
                    # Log but don't fail on network/API errors for optional datasets
                    if 'not found' in str(e).lower() or 'openml' in str(e).lower():
                        self.skipTest(f"Dataset {dataset_name} unavailable online: {e}")
                    else:
                        self.fail(f"Failed to load {dataset_name}: {e}")


if __name__ == '__main__':
    unittest.main()
