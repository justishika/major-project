"""
regenerate_curves.py
────────────────────
Re-generates Precision-Recall and ROC curves for one or all diseases
by running a single inference pass at the maximum dataset size.

Does NOT re-run the full quantum experiment — only the final train/predict
step at max_size is repeated, which is fast for classical models and
reasonable for QK-SVM.

Usage:
    python regenerate_curves.py                        # all diseases
    python regenerate_curves.py --disease parkinsons   # single disease
    python regenerate_curves.py -d als
"""

import time
import os
import sys
import argparse
import numpy as np
import pandas as pd

from data_preprocessing import (
    load_and_preprocess_data,
    get_stratified_subsample,
    prepare_train_test_split,
    DATASET_CONFIG,
)
from classical_models import run_classical_models, evaluate_model
from quantum_models import get_vqc, HybridClassicalQuantumClassifier
from visualization import plot_precision_recall_tradeoff, plot_roc_curve

SEED          = 42
OUTPUT_GRAPHS = os.path.join('results', 'graphs')
np.random.seed(SEED)


def _curves_for_disease(dataset_name: str, pca_components: int = 4):
    """Run one train/predict pass at max_size and return curve_records."""
    cfg      = DATASET_CONFIG[dataset_name]
    max_size = max(cfg['sizes'])

    print(f"\n  Loading: {cfg['display_name']}  (max_size={max_size})")
    X, y, _ = load_and_preprocess_data(
        dataset_name=dataset_name, n_components=pca_components, use_pca=True
    )
    X_sub, y_sub     = get_stratified_subsample(X, y, sample_size=max_size, random_state=SEED)
    X_tr, X_te, y_tr, y_te = prepare_train_test_split(
        X_sub, y_sub, test_size=0.3, random_state=SEED
    )

    curve_records = []

    # ── 1) Classical models ───────────────────────────────────────────────────
    print("    Classical models...")
    classical = run_classical_models(X_tr, y_tr, X_te, y_te)
    for mname, payload in classical.items():
        if payload['y_score'] is not None:
            curve_records.append({
                'Dataset': dataset_name, 'Model': mname,
                'y_true': payload['y_true'],
                'y_score': payload['y_score'],
                'y_pred': payload['y_pred'],
            })

    # ── 2) QK-SVM Noiseless ──────────────────────────────────────────────────
    print("    QK-SVM (Noiseless)...")
    try:
        qk = get_vqc(num_qubits=pca_components, noisy=False)
        qk.fit(X_tr, y_tr)
        curve_records.append({
            'Dataset': dataset_name, 'Model': 'QK-SVM (Noiseless)',
            'y_true': y_te,
            'y_score': qk.predict_proba(X_te)[:, 1],
            'y_pred': qk.predict(X_te),
        })
    except Exception as e:
        print(f"    ✗ QK-SVM Noiseless failed: {e}")

    # ── 3) QK-SVM Noisy (0.01) ───────────────────────────────────────────────
    print("    QK-SVM (Noisy, p=0.01)...")
    try:
        qk_n = get_vqc(num_qubits=pca_components, noisy=True, error_prob=0.01)
        qk_n.fit(X_tr, y_tr)
        curve_records.append({
            'Dataset': dataset_name, 'Model': 'QK-SVM (Noisy)',
            'y_true': y_te,
            'y_score': qk_n.predict_proba(X_te)[:, 1],
            'y_pred': qk_n.predict(X_te),
        })
    except Exception as e:
        print(f"    ✗ QK-SVM Noisy failed: {e}")

    # ── 4) Hybrid ─────────────────────────────────────────────────────────────
    print("    Hybrid (Classical+Quantum)...")
    try:
        hybrid = HybridClassicalQuantumClassifier(
            num_qubits=pca_components, noisy=False, error_prob=0.01
        )
        hybrid.fit(X_tr, y_tr)
        curve_records.append({
            'Dataset': dataset_name, 'Model': 'Hybrid (Classical+Quantum)',
            'y_true': y_te,
            'y_score': hybrid.predict_proba(X_te)[:, 1],
            'y_pred': hybrid.predict(X_te),
        })
    except Exception as e:
        print(f"    ✗ Hybrid failed: {e}")

    return curve_records


def regenerate_curves(diseases: list):
    print(f"Regenerating PR and ROC curves for: {diseases}")

    for dataset_name in diseases:
        if dataset_name not in DATASET_CONFIG:
            print(f"  SKIP: unknown disease '{dataset_name}'")
            continue

        try:
            curve_records = _curves_for_disease(dataset_name)
        except Exception as ex:
            print(f"  FATAL: {dataset_name} — {ex}")
            continue

        ds_output = os.path.join(OUTPUT_GRAPHS, dataset_name)
        os.makedirs(ds_output, exist_ok=True)

        print(f"    Saving PR + ROC curves → {ds_output}/")
        plot_precision_recall_tradeoff(curve_records, output_dir=ds_output)
        plot_roc_curve(curve_records, output_dir=ds_output)
        print(f"  ✓ {dataset_name} curves done.")

    print("\nSUCCESS — all requested curves regenerated.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Regenerate Precision-Recall and ROC curves'
    )
    parser.add_argument(
        '--disease', '-d',
        type=str,
        default=None,
        choices=list(DATASET_CONFIG.keys()),
        metavar='DISEASE',
        help=(
            'Regenerate curves for a single disease only. '
            'If omitted, runs all diseases. Choices: '
            + ', '.join(DATASET_CONFIG.keys())
        ),
    )
    args = parser.parse_args()

    target_diseases = [args.disease] if args.disease else list(DATASET_CONFIG.keys())
    regenerate_curves(target_diseases)
