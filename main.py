import time
import os
import numpy as np
import pandas as pd
from data_preprocessing import load_and_preprocess_data, get_stratified_subsample, prepare_train_test_split
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
)

SEED = 42
np.random.seed(SEED)

OUTPUT_GRAPHS = os.path.join('results', 'graphs')
OUTPUT_DATA   = os.path.join('results', 'data')


def run_experiment():
    experiment_config = {
        'datasets': ['parkinsons'],
        'dataset_sizes': [20, 50, 100, 150, 195],
        'noise_levels': [0.0, 0.005, 0.01, 0.02, 0.05],
        'num_runs': 3,
        'test_size': 0.3,
        'pca_components': 4,
    }

    all_results = []
    curve_records = []

    for dataset_name in experiment_config['datasets']:
        X, y, pca_info = load_and_preprocess_data(
            dataset_name=dataset_name,
            n_components=experiment_config['pca_components'],
            use_pca=True
        )
        print(f"PCA total explained variance for {dataset_name}: {pca_info['total_explained_variance']:.4f}")

        for run_id in range(experiment_config['num_runs']):
            run_seed = SEED + run_id
            for size in experiment_config['dataset_sizes']:
                print(f"\n=== Dataset={dataset_name}, Run={run_id + 1}, N={size} ===")
                X_sub, y_sub = get_stratified_subsample(X, y, sample_size=size, random_state=run_seed)
                X_train, X_test, y_train, y_test = prepare_train_test_split(
                    X_sub, y_sub,
                    test_size=experiment_config['test_size'],
                    random_state=run_seed
                )

                # ── 1) Classical Models ────────────────────────────────────
                print("Training Classical Models...")
                classical_results = run_classical_models(X_train, y_train, X_test, y_test)
                for model_name, payload in classical_results.items():
                    res = {
                        'Dataset': dataset_name,
                        'Run': run_id + 1,
                        'Dataset Size': size,
                        'Model': model_name,
                        'Noise Level': 0.0,
                        'Runtime (s)': None,
                    }
                    res.update(payload['metrics'])
                    all_results.append(res)

                    if size == max(experiment_config['dataset_sizes']) and run_id == 0 and payload['y_score'] is not None:
                        curve_records.append({
                            'Dataset': dataset_name,
                            'Model': model_name,
                            'y_true': payload['y_true'],
                            'y_score': payload['y_score'],
                            'y_pred': payload['y_pred'],
                        })

                # ── 2) Quantum Kernel SVM – Noiseless ─────────────────────
                print("Training Quantum Kernel SVM (Noiseless)...")
                try:
                    qk_ideal = get_vqc(num_qubits=experiment_config['pca_components'], noisy=False)
                    t0 = time.time()
                    qk_ideal.fit(X_train, y_train)
                    y_pred_test  = qk_ideal.predict(X_test)
                    y_score_test = qk_ideal.predict_proba(X_test)[:, 1]
                    y_pred_train = qk_ideal.predict(X_train)
                    runtime_ideal = time.time() - t0

                    metrics_ideal = evaluate_model(y_test, y_pred_test, y_score_test)
                    train_met     = evaluate_model(y_train, y_pred_train)
                    metrics_ideal['Train Accuracy']      = train_met['Accuracy']
                    metrics_ideal['Generalization Gap']  = train_met['Accuracy'] - metrics_ideal['Accuracy']
                    print(f"  ✓ Noiseless Accuracy: {metrics_ideal['Accuracy']:.3f}")
                except Exception as e:
                    print(f"  ✗ QK-SVM Noiseless failed: {e}")
                    metrics_ideal = {k: None for k in ['Accuracy','Precision','Recall','F1-score','ROC-AUC','Sensitivity','Specificity','Train Accuracy','Generalization Gap']}
                    runtime_ideal = None
                    y_score_test, y_pred_test = None, None

                res_ideal = {
                    'Dataset': dataset_name, 'Run': run_id + 1,
                    'Dataset Size': size, 'Model': 'VQC (Noiseless)',
                    'Noise Level': 0.0, 'Runtime (s)': runtime_ideal,
                }
                res_ideal.update(metrics_ideal)
                all_results.append(res_ideal)

                if size == max(experiment_config['dataset_sizes']) and run_id == 0 and y_score_test is not None:
                    curve_records.append({
                        'Dataset': dataset_name, 'Model': 'VQC (Noiseless)',
                        'y_true': y_test, 'y_score': y_score_test, 'y_pred': y_pred_test,
                    })

                # ── 3) Quantum Kernel SVM – Noisy levels ──────────────────
                for noise_level in experiment_config['noise_levels']:
                    print(f"  Training QK-SVM (Noise={noise_level})...")
                    try:
                        qk_noisy = get_vqc(
                            num_qubits=experiment_config['pca_components'],
                            noisy=(noise_level > 0),
                            error_prob=noise_level if noise_level > 0 else 0.0,
                        )
                        t0 = time.time()
                        qk_noisy.fit(X_train, y_train)
                        y_pred_noisy  = qk_noisy.predict(X_test)
                        y_score_noisy = qk_noisy.predict_proba(X_test)[:, 1]
                        y_pred_train_noisy = qk_noisy.predict(X_train)
                        runtime_noisy = time.time() - t0

                        metrics_noisy = evaluate_model(y_test, y_pred_noisy, y_score_noisy)
                        tm = evaluate_model(y_train, y_pred_train_noisy)
                        metrics_noisy['Train Accuracy']     = tm['Accuracy']
                        metrics_noisy['Generalization Gap'] = tm['Accuracy'] - metrics_noisy['Accuracy']
                    except Exception as e:
                        print(f"    ✗ QK-SVM Noisy failed: {e}")
                        metrics_noisy = {k: None for k in ['Accuracy','Precision','Recall','F1-score','ROC-AUC','Sensitivity','Specificity','Train Accuracy','Generalization Gap']}
                        runtime_noisy = None
                        y_score_noisy, y_pred_noisy = None, None

                    model_name = 'VQC (Noisy)' if noise_level > 0 else 'VQC (Noiseless Noise-Curve)'
                    res_noisy = {
                        'Dataset': dataset_name, 'Run': run_id + 1,
                        'Dataset Size': size, 'Model': model_name,
                        'Noise Level': noise_level, 'Runtime (s)': runtime_noisy,
                    }
                    res_noisy.update(metrics_noisy)
                    all_results.append(res_noisy)

                    if (size == max(experiment_config['dataset_sizes']) and run_id == 0
                            and noise_level == 0.01 and y_score_noisy is not None):
                        curve_records.append({
                            'Dataset': dataset_name, 'Model': 'VQC (Noisy)',
                            'y_true': y_test, 'y_score': y_score_noisy, 'y_pred': y_pred_noisy,
                        })

                # ── 4) Hybrid: RF + Quantum Kernel SVM (soft-vote) ────────
                print("Training Hybrid (RF + Quantum Kernel SVM)...")
                try:
                    hybrid = HybridClassicalQuantumClassifier(
                        num_qubits=experiment_config['pca_components'],
                        noisy=True,
                        error_prob=0.01
                    )
                    t0 = time.time()
                    hybrid.fit(X_train, y_train)
                    y_pred_hybrid  = hybrid.predict(X_test)
                    y_score_hybrid = hybrid.predict_proba(X_test)[:, 1]
                    y_pred_train_h = hybrid.predict(X_train)
                    runtime_hybrid = time.time() - t0

                    metrics_hybrid = evaluate_model(y_test, y_pred_hybrid, y_score_hybrid)
                    tm_h = evaluate_model(y_train, y_pred_train_h)
                    metrics_hybrid['Train Accuracy']     = tm_h['Accuracy']
                    metrics_hybrid['Generalization Gap'] = tm_h['Accuracy'] - metrics_hybrid['Accuracy']
                    print(f"  ✓ Hybrid Accuracy: {metrics_hybrid['Accuracy']:.3f}")
                except Exception as e:
                    print(f"  ✗ Hybrid failed: {e}")
                    metrics_hybrid = {k: None for k in ['Accuracy','Precision','Recall','F1-score','ROC-AUC','Sensitivity','Specificity','Train Accuracy','Generalization Gap']}
                    runtime_hybrid = None
                    y_score_hybrid, y_pred_hybrid = None, None

                res_hybrid = {
                    'Dataset': dataset_name, 'Run': run_id + 1,
                    'Dataset Size': size, 'Model': 'Hybrid (Classical+Quantum)',
                    'Noise Level': 0.01, 'Runtime (s)': runtime_hybrid,
                }
                res_hybrid.update(metrics_hybrid)
                all_results.append(res_hybrid)

                if size == max(experiment_config['dataset_sizes']) and run_id == 0 and y_score_hybrid is not None:
                    curve_records.append({
                        'Dataset': dataset_name, 'Model': 'Hybrid (Classical+Quantum)',
                        'y_true': y_test, 'y_score': y_score_hybrid, 'y_pred': y_pred_hybrid,
                    })

    # ── Aggregate & save ────────────────────────────────────────────────────
    print("\n--- All experiments finished ---")

    # ── Create output folders ────────────────────────────────────────────────
    os.makedirs(OUTPUT_GRAPHS, exist_ok=True)
    os.makedirs(OUTPUT_DATA,   exist_ok=True)

    df_results = save_results_table(all_results,
                                    filename=os.path.join(OUTPUT_DATA, 'benchmark_results.csv'))

    # Canonical models for the primary accuracy-vs-size chart (one row per model per size).
    # VQC (Noiseless) is the clean quantum baseline. VQC (Noisy) is at a fixed noise level.
    # We use noise_level == 0.01 for the noisy variant to pick one representative row.
    canonical_mask = (
        ((df_results['Model'] == 'VQC (Noiseless)') & (df_results['Noise Level'] == 0.0)) |
        ((df_results['Model'] == 'VQC (Noisy)')     & (df_results['Noise Level'] == 0.01)) |
        (df_results['Model'] == 'Hybrid (Classical+Quantum)') |
        (df_results['Model'] == 'SVM') |
        (df_results['Model'] == 'Logistic Regression') |
        (df_results['Model'] == 'Random Forest')
    )
    df_canonical = df_results[canonical_mask].copy()

    summary = (
        df_canonical
        .dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)
        .agg(**{
            'Mean Accuracy': ('Accuracy', 'mean'),
            'Std Accuracy':  ('Accuracy', 'std'),
        })
    )
    summary.to_csv(os.path.join(OUTPUT_DATA, 'benchmark_results_summary.csv'), index=False)

    plot_accuracy_vs_size(df_canonical,  output_dir=OUTPUT_GRAPHS)
    plot_model_stability(df_canonical,   output_dir=OUTPUT_GRAPHS)
    plot_noise_sensitivity(df_results,   baseline_model='SVM', output_dir=OUTPUT_GRAPHS)
    plot_precision_recall_tradeoff(curve_records, output_dir=OUTPUT_GRAPHS)
    plot_roc_curve(curve_records,        output_dir=OUTPUT_GRAPHS)
    plot_overfitting_behavior(df_results, output_dir=OUTPUT_GRAPHS)
    plot_confusion_matrices(curve_records, output_dir=OUTPUT_GRAPHS)
    plot_all_individual_metrics(df_results, output_dir=OUTPUT_GRAPHS)

    print("\n===== FINAL RESULTS =====")
    print(df_results[['Dataset','Model','Dataset Size','Accuracy','F1-score','ROC-AUC']].to_string(index=False))
    print("\n===== SUMMARY =====")
    print(summary.to_string(index=False))


if __name__ == "__main__":
    run_experiment()
