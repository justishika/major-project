"""
regenerate_graphs.py
────────────────────
Re-generates all per-disease and cross-disease graphs from the saved CSV
(benchmark_results.csv) WITHOUT re-running the expensive quantum experiments.

Usage:
    python regenerate_graphs.py
"""

import pandas as pd
import os
import sys

from data_preprocessing import DATASET_CONFIG
from visualization import (
    plot_accuracy_vs_size,
    plot_model_stability,
    plot_noise_sensitivity,
    plot_overfitting_behavior,
    plot_all_individual_metrics,
    plot_metric_heatmap,
    plot_cross_disease_summary,
)

OUTPUT_GRAPHS = os.path.join('results', 'graphs')
OUTPUT_DATA   = os.path.join('results', 'data')
CSV_PATH      = os.path.join(OUTPUT_DATA, 'benchmark_results.csv')


def _canonical_mask(df):
    return (
        ((df['Model'] == 'QK-SVM (Noiseless)') & (df['Noise Level'] == 0.0))  |
        ((df['Model'] == 'QK-SVM (Noisy)')     & (df['Noise Level'] == 0.01)) |
        (df['Model'] == 'Hybrid (Classical+Quantum)')                           |
        (df['Model'] == 'SVM')                                                  |
        (df['Model'] == 'Logistic Regression')                                  |
        (df['Model'] == 'Random Forest')
    )


def regenerate():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: {CSV_PATH} not found.")
        print("Please run main.py once to generate the baseline data.")
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    if df.empty:
        print("ERROR: benchmark_results.csv is empty.")
        sys.exit(1)

    print(f"Loaded {len(df)} records from {CSV_PATH}")
    print(f"Datasets found: {df['Dataset'].unique().tolist()}")

    os.makedirs(OUTPUT_GRAPHS, exist_ok=True)

    # ── Per-disease graphs ────────────────────────────────────────────────────
    for dataset_name in df['Dataset'].unique():
        ds_df     = df[df['Dataset'] == dataset_name].copy()
        ds_output = os.path.join(OUTPUT_GRAPHS, dataset_name)
        os.makedirs(ds_output, exist_ok=True)

        df_can = ds_df[_canonical_mask(ds_df)].copy()

        # determine max_size from config or data
        if dataset_name in DATASET_CONFIG:
            max_size = max(DATASET_CONFIG[dataset_name]['sizes'])
        else:
            max_size = int(ds_df['Dataset Size'].max())

        print(f"\n  Regenerating graphs for: {dataset_name}  →  {ds_output}/")
        plot_accuracy_vs_size(df_can,  output_dir=ds_output)
        plot_model_stability(df_can,   output_dir=ds_output)
        plot_noise_sensitivity(ds_df, baseline_model='SVM', output_dir=ds_output)
        plot_overfitting_behavior(ds_df, output_dir=ds_output)
        plot_all_individual_metrics(ds_df, output_dir=ds_output)
        plot_metric_heatmap(ds_df, max_size=max_size, output_dir=ds_output)
        print(f"  ✓ {dataset_name} done.")

    # ── Cross-disease summary ─────────────────────────────────────────────────
    print("\n  Generating cross-disease summary...")
    plot_cross_disease_summary(df, output_dir=OUTPUT_GRAPHS)

    print("\nSUCCESS — all graphs regenerated.")
    print(f"Note: Precision-Recall and ROC curves require raw probability vectors")
    print(f"which are not stored in the CSV. Re-run main.py to get those curves.")


if __name__ == "__main__":
    regenerate()
