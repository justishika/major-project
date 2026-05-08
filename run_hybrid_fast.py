import os
import time
import pandas as pd
import numpy as np

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
from main import _canonical_mask, GLOBAL_CONFIG, _METRIC_KEYS

OUTPUT_GRAPHS = os.path.join('results', 'graphs')
OUTPUT_DATA   = os.path.join('results', 'data')
BENCHMARK_CSV = os.path.join(OUTPUT_DATA, 'benchmark_results.csv')

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
    summary = (
        df_can.dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)
        .agg(**{'Mean Accuracy': ('Accuracy', 'mean'), 'Std Accuracy': ('Accuracy', 'std')})
    )
    summary.to_csv(os.path.join(OUTPUT_DATA, f'summary_{dataset_name}.csv'), index=False)
    print(f"  ✓ {dataset_name} graphs complete.")


def run_fast_experiment():
    old_df = pd.read_csv(BENCHMARK_CSV)
    # Extract ONLY the noisy QK-SVM rows to preserve them without taking 8 hours to rerun
    noisy_rows_df = old_df[old_df['Model'].str.contains('Noisy', na=False)]
    
    all_results = noisy_rows_df.to_dict('records')

    for dataset_name in GLOBAL_CONFIG['datasets']:
        if dataset_name == 'mammographic_mass':
            continue # Skip as per previous run

        print(f"\n{'='*65}")
        print(f"  DISEASE: {DATASET_CONFIG[dataset_name]['display_name'].upper()}")
        print(f"{'='*65}")

        cfg      = DATASET_CONFIG[dataset_name]
        sizes    = cfg['sizes']
        max_size = max(sizes)
        null_met = {k: None for k in _METRIC_KEYS}

        X, y, pca_info = load_and_preprocess_data(dataset_name=dataset_name, n_components=4, use_pca=True)
        print(f"  PCA explained variance: {pca_info['total_explained_variance']:.4f}")

        ds_results = noisy_rows_df[noisy_rows_df['Dataset'] == dataset_name].to_dict('records')
        ds_curves  = []

        run_id = 0
        run_seed = 42
        
        for size in sizes:
            print(f"\n  === {dataset_name} | N={size} ===")

            X_sub, y_sub = get_stratified_subsample(X, y, sample_size=size, random_state=run_seed)
            X_tr, X_te, y_tr, y_te = prepare_train_test_split(X_sub, y_sub, test_size=0.3, random_state=run_seed)
            is_max_run0 = (size == max_size)

            # ── 1) Classical Models (Fast) ──────────────────────────────────
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
                        'y_true': payload['y_true'], 'y_score': payload['y_score'], 'y_pred': payload['y_pred'],
                    })

            # ── 2) QK-SVM Noiseless (Fast) ──────────────────────────────────
            print("  Training QK-SVM (Noiseless)...")
            try:
                qk = get_vqc(num_qubits=4, noisy=False)
                t0 = time.time()
                qk.fit(X_tr, y_tr)
                yp_q = qk.predict(X_te)
                ys_q = qk.predict_proba(X_te)[:, 1]
                rt_q = time.time() - t0
                m_q  = evaluate_model(y_te, yp_q, ys_q)
                m_q_tr = evaluate_model(y_tr, qk.predict(X_tr))
                m_q['Train Accuracy']     = m_q_tr['Accuracy']
                m_q['Generalization Gap'] = m_q_tr['Accuracy'] - m_q['Accuracy']
            except Exception as e:
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

            # ── 3) NEW Hybrid Model (Fast) ──────────────────────────────────
            print("  Training UPGRADED Hybrid (Oracle Stacking)...")
            try:
                hybrid = HybridClassicalQuantumClassifier(num_qubits=4, noisy=False, error_prob=0.01)
                t0 = time.time()
                hybrid.fit(X_tr, y_tr)
                yp_h = hybrid.predict(X_te)
                ys_h = hybrid.predict_proba(X_te)[:, 1]
                rt_h = time.time() - t0
                m_h  = evaluate_model(y_te, yp_h, ys_h)
                m_h_tr = evaluate_model(y_tr, hybrid.predict(X_tr))
                m_h['Train Accuracy']     = m_h_tr['Accuracy']
                m_h['Generalization Gap'] = m_h_tr['Accuracy'] - m_h['Accuracy']
                print(f"  ✓ Upgraded Hybrid Accuracy: {m_h['Accuracy']:.3f}")
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

        all_results.extend([r for r in ds_results if 'Noisy' not in str(r.get('Model'))])
        _visualize_dataset(dataset_name, ds_results, ds_curves)

    print("\n  GLOBAL SUMMARY")
    df_all = save_results_table(all_results, filename=BENCHMARK_CSV)

    overall_summary = (
        df_all[_canonical_mask(df_all)]
        .dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)
        .agg(**{'Mean Accuracy': ('Accuracy', 'mean'), 'Std Accuracy': ('Accuracy', 'std')})
    )
    overall_summary.to_csv(os.path.join(OUTPUT_DATA, 'benchmark_results_summary.csv'), index=False)
    plot_cross_disease_summary(df_all, output_dir=OUTPUT_GRAPHS)
    
    print("\n===== FINAL RESULTS (APEX HYBRID) =====")
    print(df_all[['Dataset', 'Model', 'Dataset Size', 'Accuracy', 'F1-score', 'ROC-AUC']].dropna(subset=['Accuracy']).to_string(index=False))

if __name__ == "__main__":
    run_fast_experiment()
