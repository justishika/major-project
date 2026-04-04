from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────────────────────
# CLASSICAL BASELINES
# Three well-established ML models that serve as the benchmark.
# The quantum model is judged by how it compares to these.
# ─────────────────────────────────────────────────────────────────────────────


def evaluate_model(y_true, y_pred, y_prob=None):
    """
    Computes all classification metrics from predictions.
    Returns: Accuracy, Precision, Recall, F1, Sensitivity, Specificity, ROC-AUC.

    In medical diagnosis:
      - Sensitivity (Recall) = "Did we catch all sick patients?"  (false negative cost is high)
      - Specificity          = "Did we avoid falsely alarming healthy patients?"
    """
    # Confusion matrix gives us: True Negatives, False Positives, False Negatives, True Positives
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

    # Specificity = TN / (TN + FP) — how good the model is at ruling OUT disease
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    metrics = {
        'Accuracy':    accuracy_score(y_true, y_pred),
        'Precision':   precision_score(y_true, y_pred, zero_division=0),
        'Recall':      recall_score(y_true, y_pred, zero_division=0),
        'F1-score':    f1_score(y_true, y_pred, zero_division=0),
        'Sensitivity': recall_score(y_true, y_pred, zero_division=0),  # same as Recall for binary
        'Specificity': specificity,
    }

    # ROC-AUC requires probability scores, not just hard predictions.
    # It measures the model's ability to rank positive samples higher than negatives.
    if y_prob is not None:
        try:
            metrics['ROC-AUC'] = roc_auc_score(y_true, y_prob)
        except Exception:
            metrics['ROC-AUC'] = None  # can fail if only one class in test set
    else:
        metrics['ROC-AUC'] = None
    return metrics


def run_classical_models(X_train, y_train, X_test, y_test):
    """
    Trains and evaluates all three classical baselines on the same (X_train, X_test) split.
    Returns a dictionary: { model_name: { 'metrics': {...}, 'y_pred': ..., ... } }
    """

    # ── Three classical models ────────────────────────────────────────────────
    models = {
        # SVM with RBF kernel: projects data into higher-dimensional space to find
        # the widest margin boundary. C=10 = aggressive (low tolerance for misclassified points).
        # Closest classical analogue to the Quantum Kernel SVM.
        'SVM': SVC(kernel='rbf', C=10, gamma='scale', probability=True, random_state=42),

        # Logistic Regression: draws a linear decision boundary.
        # Simplest baseline — if quantum can't beat this, it's a significant finding.
        # L2 regularization prevents overfitting by penalizing large weights.
        'Logistic Regression': LogisticRegression(max_iter=500, C=1.0, random_state=42),

        # Random Forest: ensemble of 100 decision trees, each trained on random subsets.
        # Individual tree errors cancel out → very stable, low variance.
        # Also the classical component of the Hybrid model.
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=None, random_state=42)
    }

    results = {}
    for name, model in models.items():
        # Train on training set
        model.fit(X_train, y_train)

        # Predict on both train and test so we can compute generalization gap
        y_train_pred = model.predict(X_train)
        y_pred = model.predict(X_test)

        # Get probability scores for ROC-AUC (most sklearn classifiers support this)
        if hasattr(model, "predict_proba"):
            y_train_prob = model.predict_proba(X_train)[:, 1]  # probability of class 1 (Parkinson's)
            y_prob = model.predict_proba(X_test)[:, 1]
        else:
            y_train_prob = None
            y_prob = None

        # Evaluate on both splits
        train_metrics = evaluate_model(y_train, y_train_pred, y_train_prob)
        test_metrics  = evaluate_model(y_test, y_pred, y_prob)

        # Generalization Gap = Train Accuracy - Test Accuracy.
        # A large gap means the model overfits the training data.
        test_metrics['Train Accuracy']      = train_metrics['Accuracy']
        test_metrics['Generalization Gap']  = train_metrics['Accuracy'] - test_metrics['Accuracy']

        results[name] = {
            'metrics':        test_metrics,
            'y_true':         y_test,
            'y_pred':         y_pred,
            'y_score':        y_prob,
            'train_accuracy': train_metrics['Accuracy']
        }

    return results
