"""
regenerate_graphs.py
────────────────────
Loads the existing benchmark CSVs, renames all 'VQC' labels to 'QK-SVM',
and regenerates every graph — no quantum model re-training needed.

Usage:
    python regenerate_graphs.py
"""

import os
import ast
import numpy as np
import pandas as pd
from visualization import (
    save_results_table,
    plot_accuracy_vs_size,
    plot_model_stability,
    plot_noise_sensitivity,
    plot_precision_recall_tradeoff,
    plot_roc_curve,
    plot_overfitting_behavior,
    plot_confusion_matrices,
    plot_all_individual_metrics,
)

# ── Paths ──────────────────────────────────────────────────────────────────────
OUTPUT_GRAPHS = os.path.join('results', 'graphs')
OUTPUT_DATA   = os.path.join('results', 'data')
CSV_PATH      = os.path.join(OUTPUT_DATA, 'benchmark_results.csv')

# ── Label rename map ───────────────────────────────────────────────────────────
# Keys = old labels as they appear in the CSV's 'Model' column
# Values = new labels to use in all graphs
RENAME_MAP = {
    'VQC (Noiseless)':             'QK-SVM (Noiseless)',
    'VQC (Noiseless Noise-Curve)': 'QK-SVM (Noiseless Noise-Curve)',
    'VQC (Noisy)':                 'QK-SVM (Noisy)',
}

# ── Load & rename ──────────────────────────────────────────────────────────────
print(f"Loading results from {CSV_PATH} ...")
df = pd.read_csv(CSV_PATH)

print("Model labels BEFORE rename:", df['Model'].unique().tolist())
df['Model'] = df['Model'].replace(RENAME_MAP)
print("Model labels AFTER  rename:", df['Model'].unique().tolist())

# ── Build canonical subset (same logic as main.py) ────────────────────────────
canonical_mask = (
    ((df['Model'] == 'QK-SVM (Noiseless)') & (df['Noise Level'] == 0.0)) |
    ((df['Model'] == 'QK-SVM (Noisy)')     & (df['Noise Level'] == 0.01)) |
    (df['Model'] == 'Hybrid (Classical+Quantum)') |
    (df['Model'] == 'SVM') |
    (df['Model'] == 'Logistic Regression') |
    (df['Model'] == 'Random Forest')
)
df_canonical = df[canonical_mask].copy()

# ── Regenerate graphs ──────────────────────────────────────────────────────────
os.makedirs(OUTPUT_GRAPHS, exist_ok=True)
os.makedirs(OUTPUT_DATA,   exist_ok=True)

# NOTE: curve_records (ROC/PR/confusion matrix) are not stored in the CSV —
# those curves require the raw y_true/y_score arrays from the original run.
# We skip those three charts here (they already exist from the original run).
# All other charts (accuracy, stability, noise sensitivity, per-metric) are regenerated.

print("\nGenerating graphs...")
plot_accuracy_vs_size(df_canonical,  output_dir=OUTPUT_GRAPHS)   # Graph 1
plot_model_stability(df_canonical,   output_dir=OUTPUT_GRAPHS)   # Graph 2
plot_noise_sensitivity(df,           baseline_model='SVM', output_dir=OUTPUT_GRAPHS)  # Graph 3
plot_overfitting_behavior(df,        output_dir=OUTPUT_GRAPHS)   # Graph 6
plot_all_individual_metrics(df,      output_dir=OUTPUT_GRAPHS)   # Per-metric charts

print(f"\n✓ Done! Graphs saved to: {OUTPUT_GRAPHS}")
print("  (ROC, PR-curve, and confusion matrix charts kept from original run —")
print("   they need raw prediction arrays not stored in the CSV.)")
