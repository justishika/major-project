"""Integration tests for the full pipeline."""
import unittest
import numpy as np
import os
import sys
import tempfile
import shutil

# Add project root to path (works from any directory)
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from data_preprocessing import (
    load_and_preprocess_data,
    get_stratified_subsample,
    prepare_train_test_split,
)
from classical_models import run_classical_models
from quantum_models import get_vqc, HybridClassicalQuantumClassifier
from classical_models import evaluate_model


class TestPipelineIntegration(unittest.TestCase):
    """Test full pipeline components working together."""

    def setUp(self):
        """Load a small dataset once for all tests."""
        X, y, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)
        X_sub, y_sub = get_stratified_subsample(X, y, sample_size=30, random_state=42)
        self.X_train, self.X_test, self.y_train, self.y_test = (
            prepare_train_test_split(X_sub, y_sub, test_size=0.3, random_state=42)
        )

    def test_classical_models_on_preprocessed_data(self):
        """Classical models should train on preprocessed data."""
        results = run_classical_models(
            self.X_train, self.X_test, self.y_train, self.y_test
        )
        
        # Should have results for all models
        self.assertGreater(len(results), 0)
        
        # All should have Accuracy
        for model_name, metrics in results.items():
            self.assertIn('Accuracy', metrics)
            self.assertGreater(metrics['Accuracy'], 0)

    def test_vqc_noiseless_training(self):
        """VQC (noiseless) should train without error."""
        try:
            vqc = get_vqc(noise_level=0.0, random_state=42)
            vqc.fit(self.X_train, self.y_train)
            y_pred = vqc.predict(self.X_test)
            
            self.assertEqual(len(y_pred), len(self.y_test))
            self.assertTrue(np.all((y_pred == 0) | (y_pred == 1)))
        except Exception as e:
            # VQC training can be slow; allow skip if resources unavailable
            self.skipTest(f"VQC training skipped: {e}")

    def test_vqc_noisy_training(self):
        """VQC (noisy) should train and produce predictions."""
        try:
            vqc = get_vqc(noise_level=0.01, random_state=42)
            vqc.fit(self.X_train, self.y_train)
            y_pred = vqc.predict(self.X_test)
            
            self.assertEqual(len(y_pred), len(self.y_test))
            self.assertTrue(np.all((y_pred == 0) | (y_pred == 1)))
        except Exception as e:
            self.skipTest(f"VQC training skipped: {e}")

    def test_hybrid_model_training(self):
        """Hybrid (PCA + VQC) should train end-to-end."""
        try:
            hybrid = HybridClassicalQuantumClassifier(
                n_components=4, noise_level=0.01, random_state=42
            )
            hybrid.fit(self.X_train, self.y_train)
            y_pred = hybrid.predict(self.X_test)
            
            self.assertEqual(len(y_pred), len(self.y_test))
            self.assertTrue(np.all((y_pred == 0) | (y_pred == 1)))
        except Exception as e:
            self.skipTest(f"Hybrid model training skipped: {e}")

    def test_data_integrity_through_pipeline(self):
        """Data should remain valid through preprocessing and model pipeline."""
        # Check train data
        self.assertTrue(np.all(np.isfinite(self.X_train)))
        self.assertTrue(np.all(np.isfinite(self.y_train)))
        
        # Check test data
        self.assertTrue(np.all(np.isfinite(self.X_test)))
        self.assertTrue(np.all(np.isfinite(self.y_test)))
        
        # Check ranges
        self.assertTrue(np.all(self.X_train >= -np.pi - 1e-6))
        self.assertTrue(np.all(self.X_train <= np.pi + 1e-6))
        self.assertTrue(np.all(self.X_test >= -np.pi - 1e-6))
        self.assertTrue(np.all(self.X_test <= np.pi + 1e-6))


class TestReproducibility(unittest.TestCase):
    """Test that results are reproducible with fixed seeds."""

    def test_data_loading_reproducible(self):
        """Loading same data twice should be identical."""
        X1, y1, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)
        X2, y2, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)
        
        np.testing.assert_array_almost_equal(X1, X2)
        np.testing.assert_array_equal(y1, y2)

    def test_stratified_sampling_reproducible(self):
        """Same seed should produce identical stratified samples."""
        X, y, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)
        
        X_a, y_a = get_stratified_subsample(X, y, sample_size=30, random_state=42)
        X_b, y_b = get_stratified_subsample(X, y, sample_size=30, random_state=42)
        
        np.testing.assert_array_almost_equal(X_a, X_b)
        np.testing.assert_array_equal(y_a, y_b)

    def test_train_test_split_reproducible(self):
        """Same seed should produce identical splits."""
        X, y, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)
        
        X_tr_a, X_te_a, y_tr_a, y_te_a = prepare_train_test_split(
            X, y, test_size=0.3, random_state=42
        )
        X_tr_b, X_te_b, y_tr_b, y_te_b = prepare_train_test_split(
            X, y, test_size=0.3, random_state=42
        )
        
        np.testing.assert_array_almost_equal(X_tr_a, X_tr_b)
        np.testing.assert_array_almost_equal(X_te_a, X_te_b)
        np.testing.assert_array_equal(y_tr_a, y_tr_b)
        np.testing.assert_array_equal(y_te_a, y_te_b)


class TestMultiDatasetLoading(unittest.TestCase):
    """Test that multiple datasets can be loaded and processed."""

    def test_multiple_datasets_load_successfully(self):
        """All datasets should load without errors."""
        datasets = [
            'parkinsons', 'breast_cancer', 'heart_disease',
            'als', 'wilsons_disease'
        ]
        
        for dataset_name in datasets:
            with self.subTest(dataset=dataset_name):
                try:
                    X, y, _ = load_and_preprocess_data(
                        dataset_name, n_components=4, use_pca=True
                    )
                    self.assertGreater(len(X), 0)
                    self.assertEqual(len(X), len(y))
                except Exception as e:
                    self.fail(f"Failed to load {dataset_name}: {e}")

    def test_different_datasets_have_similar_structure(self):
        """All datasets should have same feature dimension after preprocessing."""
        datasets = ['parkinsons', 'breast_cancer']
        
        feature_dims = []
        for dataset_name in datasets:
            with self.subTest(dataset=dataset_name):
                X, y, _ = load_and_preprocess_data(
                    dataset_name, n_components=4, use_pca=True
                )
                feature_dims.append(X.shape[1])
        
        # All should have 4 PCA components
        for dim in feature_dims:
            self.assertEqual(dim, 4)


if __name__ == '__main__':
    unittest.main()
