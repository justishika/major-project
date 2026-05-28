"""Unit tests for classical and quantum model modules."""
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
)
from classical_models import run_classical_models, evaluate_model
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier


class TestClassicalModels(unittest.TestCase):
    """Test classical model training and evaluation."""

    def setUp(self):
        """Prepare a small train-test split for fast testing."""
        X, y, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)
        X_sub, y_sub = get_stratified_subsample(X, y, sample_size=50, random_state=42)
        self.X_train, self.X_test, self.y_train, self.y_test = (
            prepare_train_test_split(X_sub, y_sub, test_size=0.3, random_state=42)
        )

    def test_svm_produces_valid_predictions(self):
        """SVM should produce valid binary predictions."""
        model = SVC(kernel='rbf', C=10, gamma='scale', probability=True, random_state=42)
        model.fit(self.X_train, self.y_train)
        y_pred = model.predict(self.X_test)
        
        # Check shape
        self.assertEqual(len(y_pred), len(self.y_test))
        
        # Check values are binary
        self.assertTrue(np.all((y_pred == 0) | (y_pred == 1)))

    def test_logistic_regression_produces_valid_predictions(self):
        """Logistic Regression should produce valid binary predictions."""
        model = LogisticRegression(max_iter=1000, random_state=42)
        model.fit(self.X_train, self.y_train)
        y_pred = model.predict(self.X_test)
        
        self.assertEqual(len(y_pred), len(self.y_test))
        self.assertTrue(np.all((y_pred == 0) | (y_pred == 1)))

    def test_random_forest_produces_valid_predictions(self):
        """Random Forest should produce valid binary predictions."""
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(self.X_train, self.y_train)
        y_pred = model.predict(self.X_test)
        
        self.assertEqual(len(y_pred), len(self.y_test))
        self.assertTrue(np.all((y_pred == 0) | (y_pred == 1)))

    def test_all_classical_models_run_successfully(self):
        """run_classical_models should execute without error."""
        results = run_classical_models(
            self.X_train, self.X_test, self.y_train, self.y_test
        )
        
        # Check expected models
        expected_models = ['SVM', 'Logistic Regression', 'Random Forest']
        for model_name in expected_models:
            self.assertIn(model_name, results, f"Missing model: {model_name}")

    def test_metrics_in_valid_range(self):
        """All metrics should be in [0, 1] or NaN."""
        results = run_classical_models(
            self.X_train, self.X_test, self.y_train, self.y_test
        )
        
        metric_keys = ['Accuracy', 'Precision', 'Recall', 'F1-score', 'ROC-AUC']
        
        for model_name, metrics in results.items():
            for key in metric_keys:
                if key in metrics:
                    val = metrics[key]
                    if not np.isnan(val):
                        self.assertTrue(
                            0 <= val <= 1,
                            f"{model_name} {key}={val} out of range"
                        )

    def test_accuracy_precision_recall_consistency(self):
        """F1-score should be derivable from Precision and Recall."""
        results = run_classical_models(
            self.X_train, self.X_test, self.y_train, self.y_test
        )
        
        for model_name, metrics in results.items():
            prec = metrics.get('Precision')
            rec = metrics.get('Recall')
            f1 = metrics.get('F1-score')
            
            if prec is not None and rec is not None and f1 is not None:
                if not (np.isnan(prec) or np.isnan(rec) or np.isnan(f1)):
                    if prec > 0 and rec > 0:
                        expected_f1 = 2 * (prec * rec) / (prec + rec)
                        self.assertAlmostEqual(
                            f1, expected_f1, places=2,
                            msg=f"{model_name}: F1 inconsistent"
                        )

    def test_generalization_gap_sensible(self):
        """Generalization gap should be train_acc - test_acc, typically >= 0."""
        results = run_classical_models(
            self.X_train, self.X_test, self.y_train, self.y_test
        )
        
        for model_name, metrics in results.items():
            train_acc = metrics.get('Train Accuracy')
            test_acc = metrics.get('Accuracy')
            gen_gap = metrics.get('Generalization Gap')
            
            if train_acc is not None and test_acc is not None and gen_gap is not None:
                if not any(np.isnan(x) for x in [train_acc, test_acc, gen_gap]):
                    # Gap should roughly equal train - test
                    expected_gap = train_acc - test_acc
                    self.assertAlmostEqual(
                        gen_gap, expected_gap, places=2,
                        msg=f"{model_name}: Gen gap mismatch"
                    )


class TestMetricsComputation(unittest.TestCase):
    """Test that metrics are computed correctly."""

    def setUp(self):
        """Create simple ground truth and predictions."""
        # Binary classification: 10 samples
        self.y_true = np.array([0, 0, 0, 0, 1, 1, 1, 1, 0, 1])
        self.y_pred = np.array([0, 0, 1, 0, 1, 1, 0, 1, 0, 1])

    def test_evaluate_model_returns_dict(self):
        """evaluate_model should return a dictionary with required keys."""
        # Create a mock model
        from sklearn.linear_model import LogisticRegression
        X_train = np.random.randn(50, 4)
        y_train = np.random.randint(0, 2, 50)
        
        model = LogisticRegression(random_state=42)
        model.fit(X_train, y_train)
        
        X_test = np.random.randn(10, 4)
        metrics = evaluate_model(model, X_test, self.y_true)
        
        self.assertIsInstance(metrics, dict)
        self.assertIn('Accuracy', metrics)
        self.assertIn('Precision', metrics)
        self.assertIn('Recall', metrics)
        self.assertIn('F1-score', metrics)


if __name__ == '__main__':
    unittest.main()
