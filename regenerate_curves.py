import time
import os
import numpy as np
import pandas as pd
from data_preprocessing import load_and_preprocess_data, get_stratified_subsample, prepare_train_test_split
from classical_models import run_classical_models, evaluate_model
from quantum_models import get_vqc, HybridClassicalQuantumClassifier
from visualization import (
    plot_precision_recall_tradeoff,
    plot_roc_curve,
)

SEED = 42
np.random.seed(SEED)
OUTPUT_GRAPHS = os.path.join('results', 'graphs')

def regenerate_curves():
    print("Regenerating PR and ROC curves (Single run at max dataset size)...")
    
    dataset_name = 'parkinsons'
    max_size = 195
    pca_components = 4
    
    X, y, _ = load_and_preprocess_data(dataset_name=dataset_name, n_components=pca_components, use_pca=True)
    X_sub, y_sub = get_stratified_subsample(X, y, sample_size=max_size, random_state=SEED)
    X_train, X_test, y_train, y_test = prepare_train_test_split(X_sub, y_sub, test_size=0.3, random_state=SEED)

    curve_records = []

    # 1. Classical Models
    print("  Evaluating Classical Models...")
    classical_results = run_classical_models(X_train, y_train, X_test, y_test)
    for model_name, payload in classical_results.items():
        if payload['y_score'] is not None:
            curve_records.append({
                'Dataset': dataset_name,
                'Model': model_name,
                'y_true': payload['y_true'],
                'y_score': payload['y_score'],
                'y_pred': payload['y_pred'],
            })

    # 2. VQC (Noiseless)
    print("  Evaluating VQC (Noiseless)...")
    try:
        qk_ideal = get_vqc(num_qubits=pca_components, noisy=False)
        qk_ideal.fit(X_train, y_train)
        y_pred_test  = qk_ideal.predict(X_test)
        y_score_test = qk_ideal.predict_proba(X_test)[:, 1]
        curve_records.append({
            'Dataset': dataset_name, 'Model': 'VQC (Noiseless)',
            'y_true': y_test, 'y_score': y_score_test, 'y_pred': y_pred_test,
        })
    except Exception as e:
        print(f"  ✗ VQC Noiseless failed: {e}")

    # 3. VQC (Noisy at 0.01)
    print("  Evaluating VQC (Noisy, 0.01)...")
    try:
        qk_noisy = get_vqc(num_qubits=pca_components, noisy=True, error_prob=0.01)
        qk_noisy.fit(X_train, y_train)
        y_pred_noisy  = qk_noisy.predict(X_test)
        y_score_noisy = qk_noisy.predict_proba(X_test)[:, 1]
        curve_records.append({
            'Dataset': dataset_name, 'Model': 'VQC (Noisy)',
            'y_true': y_test, 'y_score': y_score_noisy, 'y_pred': y_pred_noisy,
        })
    except Exception as e:
        print(f"  ✗ VQC Noisy failed: {e}")

    # 4. Hybrid
    print("  Evaluating Hybrid (Classical+Quantum)...")
    try:
        hybrid = HybridClassicalQuantumClassifier(num_qubits=pca_components, noisy=True, error_prob=0.01)
        hybrid.fit(X_train, y_train)
        y_pred_hybrid  = hybrid.predict(X_test)
        y_score_hybrid = hybrid.predict_proba(X_test)[:, 1]
        curve_records.append({
            'Dataset': dataset_name, 'Model': 'Hybrid (Classical+Quantum)',
            'y_true': y_test, 'y_score': y_score_hybrid, 'y_pred': y_pred_hybrid,
        })
    except Exception as e:
        print(f"  ✗ Hybrid failed: {e}")

    print("Generating updated PR and ROC curve plots...")
    plot_precision_recall_tradeoff(curve_records, output_dir=OUTPUT_GRAPHS)
    plot_roc_curve(curve_records, output_dir=OUTPUT_GRAPHS)
    print(f"Done! Updated curve graphs are in {OUTPUT_GRAPHS}")

if __name__ == "__main__":
    regenerate_curves()
