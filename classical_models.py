from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import numpy as np
import warnings
warnings.filterwarnings('ignore')

def evaluate_model(y_true, y_pred, y_prob=None):
    """
    Computes standard classification metrics.
    """
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    false_negative_rate = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    metrics = {
        'Accuracy': accuracy_score(y_true, y_pred),
        'Precision': precision_score(y_true, y_pred, zero_division=0),
        'Recall': recall_score(y_true, y_pred, zero_division=0),
        'F1-score': f1_score(y_true, y_pred, zero_division=0),
        'Sensitivity': recall_score(y_true, y_pred, zero_division=0),
        'Specificity': specificity,
        'False Positive': int(fp),
        'False Negative': int(fn),
        'True Positive': int(tp),
        'True Negative': int(tn),
        'False Negative Rate': false_negative_rate,
    }
    if y_prob is not None:
        try:
            metrics['ROC-AUC'] = roc_auc_score(y_true, y_prob)
        except Exception:
            metrics['ROC-AUC'] = None
    else:
        metrics['ROC-AUC'] = None
    return metrics

def run_classical_models(X_train, y_train, X_test, y_test):
    """
    Trains and evaluates SVM, Logistic Regression, and Random Forest.
    Returns a dictionary with metrics and predictions for each model.
    """
    models = {
        'SVM': SVC(kernel='rbf', probability=True, random_state=42),
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42)
    }
    
    results = {}
    for name, model in models.items():
        model.fit(X_train, y_train)

        y_train_pred = model.predict(X_train)
        y_pred = model.predict(X_test)

        # Determine probabilities for ROC-AUC
        if hasattr(model, "predict_proba"):
            y_train_prob = model.predict_proba(X_train)[:, 1]
            y_prob = model.predict_proba(X_test)[:, 1]
        else:
            y_train_prob = None
            y_prob = None

        train_metrics = evaluate_model(y_train, y_train_pred, y_train_prob)
        test_metrics = evaluate_model(y_test, y_pred, y_prob)
        test_metrics['Train Accuracy'] = train_metrics['Accuracy']
        test_metrics['Generalization Gap'] = train_metrics['Accuracy'] - test_metrics['Accuracy']

        results[name] = {
            'metrics': test_metrics,
            'y_true': y_test,
            'y_pred': y_pred,
            'y_score': y_prob,
            'train_accuracy': train_metrics['Accuracy']
        }
         
    return results
