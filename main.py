import time
import os
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
    plot_metric_heatmap,
    plot_cross_disease_summary,
)

SEED = 42
np.random.seed(SEED)

OUTPUT_GRAPHS = os.path.join('results', 'graphs')
OUTPUT_DATA   = os.path.join('results', 'data')

# ── Global experiment settings ────────────────────────────────────────────────
GLOBAL_CONFIG = {
    # datasets come from DATASET_CONFIG keys — all 8 diseases (incl. Wilson's & ALS)
    'datasets':      list(DATASET_CONFIG.keys()),
    'noise_levels':  [0.0, 0.005, 0.01, 0.02, 0.05],
    'num_runs':      1,       # increase to 3 for full statistical averaging (~3× longer)
    'test_size':     0.3,
    'pca_components': 4,      # 4 qubits → keeps circuits shallow
}

# Metric keys used for null-result placeholders
_METRIC_KEYS = [
    'Accuracy', 'Precision', 'Recall', 'F1-score',
    'ROC-AUC', 'Sensitivity', 'Specificity',
    'Train Accuracy', 'Generalization Gap',
]


def _canonical_mask(df):
    """Select one representative row per model for the primary charts."""
    return (
        ((df['Model'] == 'QK-SVM (Noiseless)') & (df['Noise Level'] == 0.0))  |
        ((df['Model'] == 'QK-SVM (Noisy)')     & (df['Noise Level'] == 0.01)) |
        (df['Model'] == 'Hybrid (Classical+Quantum)')                           |
        (df['Model'] == 'SVM')                                                  |
        (df['Model'] == 'Logistic Regression')                                  |
        (df['Model'] == 'Random Forest')
    )


def _run_dataset(dataset_name, pca_components, num_runs, noise_levels, test_size):
    """
    Run the full benchmark for one disease dataset.
    Returns (ds_results, ds_curves) — plain lists of dicts / curve-record dicts.
    """
    cfg      = DATASET_CONFIG[dataset_name]
    sizes    = cfg['sizes']
    max_size = max(sizes)
    null_met = {k: None for k in _METRIC_KEYS}

    X, y, pca_info = load_and_preprocess_data(
        dataset_name=dataset_name, n_components=pca_components, use_pca=True
    )
    print(f"  PCA explained variance: {pca_info['total_explained_variance']:.4f}")
    print(f"  Dataset shape after PCA: {X.shape}  |  Classes: {np.bincount(y).tolist()}")

    ds_results = []
    ds_curves  = []

    for run_id in range(num_runs):
        run_seed = SEED + run_id
        for size in sizes:
            print(f"\n  === {dataset_name} | Run {run_id+1}/{num_runs} | N={size} ===")

            X_sub, y_sub = get_stratified_subsample(X, y, sample_size=size,
                                                    random_state=run_seed)
            X_tr, X_te, y_tr, y_te = prepare_train_test_split(
                X_sub, y_sub, test_size=test_size, random_state=run_seed
            )
            is_max_run0 = (size == max_size and run_id == 0)

            # ── 1) Classical Models ──────────────────────────────────────────
            print("  Training Classical Models...")
            classical = run_classical_models(X_tr, y_tr, X_te, y_te)
            for mname, payload in classical.items():
                rec = {
                    'Dataset': dataset_name, 'Run': run_id + 1,
                    'Dataset Size': size, 'Model': mname,
                    'Noise Level': 0.0, 'Runtime (s)': None,
                }
                rec.update(payload['metrics'])
                ds_results.append(rec)
                if is_max_run0 and payload['y_score'] is not None:
                    ds_curves.append({
                        'Dataset': dataset_name, 'Model': mname,
                        'y_true': payload['y_true'],
                        'y_score': payload['y_score'],
                        'y_pred': payload['y_pred'],
                    })

            # ── 2) QK-SVM Noiseless ──────────────────────────────────────────
            print("  Training QK-SVM (Noiseless)...")
            try:
                qk = get_vqc(num_qubits=pca_components, noisy=False)
                t0 = time.time()
                qk.fit(X_tr, y_tr)
                yp_q = qk.predict(X_te)
                ys_q = qk.predict_proba(X_te)[:, 1]
                rt_q = time.time() - t0
                m_q  = evaluate_model(y_te, yp_q, ys_q)
                m_q_tr = evaluate_model(y_tr, qk.predict(X_tr))
                m_q['Train Accuracy']     = m_q_tr['Accuracy']
                m_q['Generalization Gap'] = m_q_tr['Accuracy'] - m_q['Accuracy']
                print(f"  ✓ QK-SVM Noiseless: {m_q['Accuracy']:.3f}")
            except Exception as e:
                print(f"  ✗ QK-SVM Noiseless failed: {e}")
                m_q, rt_q, yp_q, ys_q = dict(null_met), None, None, None

            rec_q = {
                'Dataset': dataset_name, 'Run': run_id + 1,
                'Dataset Size': size, 'Model': 'QK-SVM (Noiseless)',
                'Noise Level': 0.0, 'Runtime (s)': rt_q,
            }
            rec_q.update(m_q)
            ds_results.append(rec_q)
            if is_max_run0 and ys_q is not None:
                ds_curves.append({
                    'Dataset': dataset_name, 'Model': 'QK-SVM (Noiseless)',
                    'y_true': y_te, 'y_score': ys_q, 'y_pred': yp_q,
                })

            # ── 3) QK-SVM Noisy sweep ────────────────────────────────────────
            for nl in noise_levels:
                print(f"  Training QK-SVM (Noise={nl})...")
                try:
                    qk_n = get_vqc(num_qubits=pca_components,
                                   noisy=(nl > 0),
                                   error_prob=nl if nl > 0 else 0.0)
                    t0 = time.time()
                    qk_n.fit(X_tr, y_tr)
                    yp_n = qk_n.predict(X_te)
                    ys_n = qk_n.predict_proba(X_te)[:, 1]
                    rt_n = time.time() - t0
                    m_n  = evaluate_model(y_te, yp_n, ys_n)
                    m_n_tr = evaluate_model(y_tr, qk_n.predict(X_tr))
                    m_n['Train Accuracy']     = m_n_tr['Accuracy']
                    m_n['Generalization Gap'] = m_n_tr['Accuracy'] - m_n['Accuracy']
                except Exception as e:
                    print(f"  ✗ QK-SVM Noisy ({nl}) failed: {e}")
                    m_n, rt_n, yp_n, ys_n = dict(null_met), None, None, None

                mn_label = 'QK-SVM (Noisy)' if nl > 0 else 'QK-SVM (Noiseless Noise-Curve)'
                rec_n = {
                    'Dataset': dataset_name, 'Run': run_id + 1,
                    'Dataset Size': size, 'Model': mn_label,
                    'Noise Level': nl, 'Runtime (s)': rt_n,
                }
                rec_n.update(m_n)
                ds_results.append(rec_n)
                if is_max_run0 and nl == 0.01 and ys_n is not None:
                    ds_curves.append({
                        'Dataset': dataset_name, 'Model': 'QK-SVM (Noisy)',
                        'y_true': y_te, 'y_score': ys_n, 'y_pred': yp_n,
                    })

            # ── 4) Hybrid ────────────────────────────────────────────────────
            print("  Training Hybrid (RF + QK-SVM learned stacking)...")
            try:
                hybrid = HybridClassicalQuantumClassifier(
                    num_qubits=pca_components, noisy=False, error_prob=0.01
                )
                t0 = time.time()
                hybrid.fit(X_tr, y_tr)
                yp_h = hybrid.predict(X_te)
                ys_h = hybrid.predict_proba(X_te)[:, 1]
                rt_h = time.time() - t0
                m_h  = evaluate_model(y_te, yp_h, ys_h)
                m_h_tr = evaluate_model(y_tr, hybrid.predict(X_tr))
                m_h['Train Accuracy']     = m_h_tr['Accuracy']
                m_h['Generalization Gap'] = m_h_tr['Accuracy'] - m_h['Accuracy']
                print(f"  ✓ Hybrid: {m_h['Accuracy']:.3f}")
            except Exception as e:
                print(f"  ✗ Hybrid failed: {e}")
                m_h, rt_h, yp_h, ys_h = dict(null_met), None, None, None

            rec_h = {
                'Dataset': dataset_name, 'Run': run_id + 1,
                'Dataset Size': size, 'Model': 'Hybrid (Classical+Quantum)',
                'Noise Level': 0.01, 'Runtime (s)': rt_h,
            }
            rec_h.update(m_h)
            ds_results.append(rec_h)
            if is_max_run0 and ys_h is not None:
                ds_curves.append({
                    'Dataset': dataset_name, 'Model': 'Hybrid (Classical+Quantum)',
                    'y_true': y_te, 'y_score': ys_h, 'y_pred': yp_h,
                })

    return ds_results, ds_curves


def _visualize_dataset(dataset_name, ds_results, ds_curves):
    """Save all per-disease graphs to results/graphs/<dataset_name>/."""
    ds_df     = pd.DataFrame(ds_results)
    ds_output = os.path.join(OUTPUT_GRAPHS, dataset_name)
    os.makedirs(ds_output, exist_ok=True)

    df_can    = ds_df[_canonical_mask(ds_df)].copy()
    max_size  = max(DATASET_CONFIG[dataset_name]['sizes'])

    print(f"\n  Saving graphs → {ds_output}/")
    plot_accuracy_vs_size(df_can,  output_dir=ds_output)
    plot_model_stability(df_can,   output_dir=ds_output)
    plot_noise_sensitivity(ds_df, baseline_model='SVM', output_dir=ds_output)
    plot_precision_recall_tradeoff(ds_curves, output_dir=ds_output)
    plot_roc_curve(ds_curves,      output_dir=ds_output)
    plot_overfitting_behavior(ds_df, output_dir=ds_output)
    plot_confusion_matrices(ds_curves, output_dir=ds_output)
    plot_all_individual_metrics(ds_df, output_dir=ds_output)
    plot_metric_heatmap(ds_df, max_size=max_size, output_dir=ds_output)

    # Per-disease summary CSV
    os.makedirs(OUTPUT_DATA, exist_ok=True)
    summary = (
        df_can.dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)
        .agg(**{'Mean Accuracy': ('Accuracy', 'mean'), 'Std Accuracy': ('Accuracy', 'std')})
    )
    summary.to_csv(os.path.join(OUTPUT_DATA, f'summary_{dataset_name}.csv'), index=False)
    print(f"  ✓ {dataset_name} graphs complete.")


def run_experiment():
    all_results = []

    for dataset_name in GLOBAL_CONFIG['datasets']:
        print(f"\n{'='*65}")
        print(f"  DISEASE: {DATASET_CONFIG[dataset_name]['display_name'].upper()}")
        print(f"{'='*65}")

        try:
            ds_results, ds_curves = _run_dataset(
                dataset_name   = dataset_name,
                pca_components = GLOBAL_CONFIG['pca_components'],
                num_runs       = GLOBAL_CONFIG['num_runs'],
                noise_levels   = GLOBAL_CONFIG['noise_levels'],
                test_size      = GLOBAL_CONFIG['test_size'],
            )
        except Exception as ex:
            print(f"  FATAL: {dataset_name} failed entirely — {ex}")
            continue

        all_results.extend(ds_results)
        _visualize_dataset(dataset_name, ds_results, ds_curves)

    # ── Global unified CSV ────────────────────────────────────────────────────
    print(f"\n{'='*65}")
    print("  GLOBAL SUMMARY")
    print(f"{'='*65}")
    os.makedirs(OUTPUT_DATA,   exist_ok=True)
    os.makedirs(OUTPUT_GRAPHS, exist_ok=True)

    df_all = save_results_table(
        all_results,
        filename=os.path.join(OUTPUT_DATA, 'benchmark_results.csv'),
    )

    overall_summary = (
        df_all[_canonical_mask(df_all)]
        .dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)
        .agg(**{'Mean Accuracy': ('Accuracy', 'mean'), 'Std Accuracy': ('Accuracy', 'std')})
    )
    overall_summary.to_csv(
        os.path.join(OUTPUT_DATA, 'benchmark_results_summary.csv'), index=False
    )

    # Cross-disease comparison chart (in graphs root)
    plot_cross_disease_summary(df_all, output_dir=OUTPUT_GRAPHS)

    print("\n===== FINAL RESULTS =====")
    print(
        df_all[['Dataset', 'Model', 'Dataset Size', 'Accuracy', 'F1-score', 'ROC-AUC']]
        .dropna(subset=['Accuracy'])
        .to_string(index=False)
    )
    print("\n===== OVERALL SUMMARY =====")
    print(overall_summary.to_string(index=False))


if __name__ == "__main__":
    run_experiment()
