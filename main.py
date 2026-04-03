import time
import numpy as np
import pandas as pd
from data_preprocessing import load_and_preprocess_data, get_stratified_subsample, prepare_train_test_split
from classical_models import run_classical_models, evaluate_model
from quantum_models import get_vqc, HybridClassicalQuantumClassifier, TinyQuantumAugmentedClassifier
from visualization import (
    save_results_table,
    plot_accuracy_vs_size,
    plot_model_stability,
    plot_noise_sensitivity,
    plot_precision_recall_tradeoff,
    plot_roc_curve,
    plot_overfitting_behavior,
    plot_confusion_matrices,
)

SEED = 42
np.random.seed(SEED)

def encode_labels_for_vqc(y):
    """
    One-hot encodes binary labels. 
    Qiskit VQC often uses cross-entropy loss and expects one-hot formatted labels.
    """
    num_classes = 2
    y_one_hot = np.zeros((len(y), num_classes))
    y_one_hot[np.arange(len(y)), y.astype(int)] = 1
    return y_one_hot


def _safe_vqc_scores_and_labels(raw_pred):
    if raw_pred.ndim > 1 and raw_pred.shape[1] >= 2:
        y_score = raw_pred[:, 1]
        y_pred = np.argmax(raw_pred, axis=1)
        return y_score, y_pred
    y_pred = raw_pred.astype(int).ravel()
    return y_pred.astype(float), y_pred

def run_experiment():
    experiment_config = {
        'datasets': ['parkinsons'],
        # Fast mode profile: keeps comparisons meaningful while reducing runtime.
        'dataset_sizes': [20, 50],
        'qubit_options': [2, 3],
        'ansatz_reps': [1],
        'noise_levels': [0.0, 0.01],
        'num_runs': 3,
        'test_size': 0.3,
        'pca_components': 4,
        'optimizer_maxiter': 80,
        'report_focus_sizes': [20, 50],
        'report_focus_noises': [0.01],
        'primary_metric': 'Recall',
        'tiny_quantum_weight': 0.2,
    }

    all_results = []
    curve_records = []

    for dataset_name in experiment_config['datasets']:
        X, y, pca_info = load_and_preprocess_data(
            dataset_name=dataset_name,
            n_components=experiment_config['pca_components'],
            use_pca=True
        )
        print(f"PCA total explained variance for {dataset_name}: {pca_info['total_explained_variance']}")

        for run_id in range(experiment_config['num_runs']):
            run_seed = SEED + run_id
            for size in experiment_config['dataset_sizes']:
                print(f"\n--- Dataset={dataset_name}, Run={run_id + 1}, N={size} ---")
                X_sub, y_sub = get_stratified_subsample(X, y, sample_size=size, random_state=run_seed)
                X_train, X_test, y_train, y_test = prepare_train_test_split(
                    X_sub,
                    y_sub,
                    test_size=experiment_config['test_size'],
                    random_state=run_seed
                )

                # Mostly-classical model with a tiny quantum refinement layer.
                print("Training Classical+TinyQuantumLayer...")
                try:
                    tiny_q_model = TinyQuantumAugmentedClassifier(
                        quantum_weight=experiment_config['tiny_quantum_weight'],
                        maxiter=max(60, experiment_config['optimizer_maxiter'] // 2),
                        noisy=True,
                        error_prob=0.01,
                    )
                    start_time = time.time()
                    tiny_q_model.fit(X_train, y_train)
                    y_pred_tiny = tiny_q_model.predict(X_test)
                    y_prob_tiny = tiny_q_model.predict_proba(X_test)[:, 1]
                    y_pred_tiny_train = tiny_q_model.predict(X_train)

                    metrics_tiny = evaluate_model(y_test, y_pred_tiny, y_prob_tiny)
                    train_metrics_tiny = evaluate_model(y_train, y_pred_tiny_train)
                    metrics_tiny['Train Accuracy'] = train_metrics_tiny['Accuracy']
                    metrics_tiny['Generalization Gap'] = train_metrics_tiny['Accuracy'] - metrics_tiny['Accuracy']
                    runtime_tiny = time.time() - start_time
                except Exception as e:
                    print(f"Classical+TinyQuantumLayer failed: {e}")
                    metrics_tiny = {
                        'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None,
                        'ROC-AUC': None, 'Sensitivity': None, 'Specificity': None,
                        'Train Accuracy': None, 'Generalization Gap': None
                    }
                    runtime_tiny = None
                    y_pred_tiny, y_prob_tiny = None, None

                tiny_label = f"Classical+TinyQuantumLayer (w={experiment_config['tiny_quantum_weight']})"
                res_tiny = {
                    'Dataset': dataset_name,
                    'Run': run_id + 1,
                    'Dataset Size': size,
                    'Model': tiny_label,
                    'Noise Level': 0.01,
                    'Runtime (s)': runtime_tiny,
                }
                res_tiny.update(metrics_tiny)
                all_results.append(res_tiny)

                if size == max(experiment_config['dataset_sizes']) and run_id == 0 and y_prob_tiny is not None:
                    curve_records.append({
                        'Dataset': dataset_name,
                        'Model': tiny_label,
                        'y_true': y_test,
                        'y_score': y_prob_tiny,
                        'y_pred': y_pred_tiny,
                    })

                # Small grid: qubits/features and ansatz depth. Same split + same feature count for fair comparison.
                for num_qubits in experiment_config['qubit_options']:
                    X_train_q = X_train[:, :num_qubits]
                    X_test_q = X_test[:, :num_qubits]

                    print(f"Training Classical Models (PCA-{num_qubits})...")
                    classical_results = run_classical_models(X_train_q, y_train, X_test_q, y_test)
                    for model_name, payload in classical_results.items():
                        labeled_model = f"{model_name} (PCA-{num_qubits})"
                        res = {
                            'Dataset': dataset_name,
                            'Run': run_id + 1,
                            'Dataset Size': size,
                            'Model': labeled_model,
                            'Noise Level': 0.0,
                            'Runtime (s)': None,
                        }
                        res.update(payload['metrics'])
                        all_results.append(res)

                        if size == max(experiment_config['dataset_sizes']) and run_id == 0 and payload['y_score'] is not None:
                            curve_records.append({
                                'Dataset': dataset_name,
                                'Model': labeled_model,
                                'y_true': payload['y_true'],
                                'y_score': payload['y_score'],
                                'y_pred': payload['y_pred'],
                            })

                    y_train_vqc = encode_labels_for_vqc(y_train)

                    for reps in experiment_config['ansatz_reps']:
                        # VQC ideal
                        print(f"Training VQC ideal (q={num_qubits}, reps={reps})...")
                        try:
                            vqc_ideal = get_vqc(
                                num_qubits=num_qubits,
                                reps=reps,
                                maxiter=experiment_config['optimizer_maxiter'],
                                noisy=False,
                            )
                            if vqc_ideal is None:
                                raise ValueError("VQC initialization failed")

                            start_time = time.time()
                            vqc_ideal.fit(X_train_q, y_train_vqc)
                            raw_test_pred = vqc_ideal.predict(X_test_q)
                            raw_train_pred = vqc_ideal.predict(X_train_q)
                            y_score_test, y_pred_test = _safe_vqc_scores_and_labels(raw_test_pred)
                            _, y_pred_train = _safe_vqc_scores_and_labels(raw_train_pred)

                            metrics_ideal = evaluate_model(y_test, y_pred_test, y_score_test)
                            train_metrics_ideal = evaluate_model(y_train, y_pred_train)
                            metrics_ideal['Train Accuracy'] = train_metrics_ideal['Accuracy']
                            metrics_ideal['Generalization Gap'] = train_metrics_ideal['Accuracy'] - metrics_ideal['Accuracy']
                            runtime_ideal = time.time() - start_time
                        except Exception as e:
                            print(f"VQC ideal failed (q={num_qubits}, reps={reps}): {e}")
                            metrics_ideal = {
                                'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None,
                                'ROC-AUC': None, 'Sensitivity': None, 'Specificity': None,
                                'Train Accuracy': None, 'Generalization Gap': None
                            }
                            runtime_ideal = None
                            y_score_test, y_pred_test = None, None

                        ideal_label = f"VQC ideal (q={num_qubits}, reps={reps})"
                        res_ideal = {
                            'Dataset': dataset_name,
                            'Run': run_id + 1,
                            'Dataset Size': size,
                            'Model': ideal_label,
                            'Noise Level': 0.0,
                            'Runtime (s)': runtime_ideal,
                        }
                        res_ideal.update(metrics_ideal)
                        all_results.append(res_ideal)

                        if size == max(experiment_config['dataset_sizes']) and run_id == 0 and y_score_test is not None:
                            curve_records.append({
                                'Dataset': dataset_name,
                                'Model': ideal_label,
                                'y_true': y_test,
                                'y_score': y_score_test,
                                'y_pred': y_pred_test,
                            })

                        # VQC noisy sweep
                        for noise_level in experiment_config['noise_levels']:
                            print(f"  Training VQC noisy (q={num_qubits}, reps={reps}, noise={noise_level})...")
                            try:
                                vqc_noisy = get_vqc(
                                    num_qubits=num_qubits,
                                    reps=reps,
                                    maxiter=experiment_config['optimizer_maxiter'],
                                    noisy=(noise_level > 0),
                                    error_prob=noise_level if noise_level > 0 else 0.0,
                                )
                                if vqc_noisy is None:
                                    raise ValueError("VQC initialization failed")

                                start_time = time.time()
                                vqc_noisy.fit(X_train_q, y_train_vqc)
                                raw_test_pred = vqc_noisy.predict(X_test_q)
                                raw_train_pred = vqc_noisy.predict(X_train_q)
                                y_score_noisy, y_pred_noisy = _safe_vqc_scores_and_labels(raw_test_pred)
                                _, y_pred_train_noisy = _safe_vqc_scores_and_labels(raw_train_pred)

                                metrics_noisy = evaluate_model(y_test, y_pred_noisy, y_score_noisy)
                                train_metrics_noisy = evaluate_model(y_train, y_pred_train_noisy)
                                metrics_noisy['Train Accuracy'] = train_metrics_noisy['Accuracy']
                                metrics_noisy['Generalization Gap'] = train_metrics_noisy['Accuracy'] - metrics_noisy['Accuracy']
                                runtime_noisy = time.time() - start_time
                            except Exception as e:
                                print(f"  VQC noisy failed (q={num_qubits}, reps={reps}, noise={noise_level}): {e}")
                                metrics_noisy = {
                                    'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None,
                                    'ROC-AUC': None, 'Sensitivity': None, 'Specificity': None,
                                    'Train Accuracy': None, 'Generalization Gap': None
                                }
                                runtime_noisy = None
                                y_score_noisy, y_pred_noisy = None, None

                            noisy_label = f"VQC noisy (q={num_qubits}, reps={reps})"
                            res_noisy = {
                                'Dataset': dataset_name,
                                'Run': run_id + 1,
                                'Dataset Size': size,
                                'Model': noisy_label,
                                'Noise Level': noise_level,
                                'Runtime (s)': runtime_noisy,
                            }
                            res_noisy.update(metrics_noisy)
                            all_results.append(res_noisy)

                            if (
                                size == max(experiment_config['dataset_sizes'])
                                and run_id == 0
                                and noise_level == 0.01
                                and y_score_noisy is not None
                            ):
                                curve_records.append({
                                    'Dataset': dataset_name,
                                    'Model': noisy_label,
                                    'y_true': y_test,
                                    'y_score': y_score_noisy,
                                    'y_pred': y_pred_noisy,
                                })

                        # Hybrid (fixed small-noise point)
                        print(f"Training Hybrid (q={num_qubits}, reps={reps})...")
                        try:
                            hybrid = HybridClassicalQuantumClassifier(
                                num_qubits=num_qubits,
                                reps=reps,
                                maxiter=experiment_config['optimizer_maxiter'],
                                classical_pca_components=num_qubits,
                                noisy=True,
                                error_prob=0.01,
                            )
                            start_time = time.time()
                            hybrid.fit(X_train_q, y_train_vqc)
                            raw_test_pred_hybrid = hybrid.predict(X_test_q)
                            raw_train_pred_hybrid = hybrid.predict(X_train_q)
                            y_score_hybrid, y_pred_hybrid = _safe_vqc_scores_and_labels(raw_test_pred_hybrid)
                            _, y_pred_train_hybrid = _safe_vqc_scores_and_labels(raw_train_pred_hybrid)

                            metrics_hybrid = evaluate_model(y_test, y_pred_hybrid, y_score_hybrid)
                            train_metrics_hybrid = evaluate_model(y_train, y_pred_train_hybrid)
                            metrics_hybrid['Train Accuracy'] = train_metrics_hybrid['Accuracy']
                            metrics_hybrid['Generalization Gap'] = train_metrics_hybrid['Accuracy'] - metrics_hybrid['Accuracy']
                            runtime_hybrid = time.time() - start_time
                        except Exception as e:
                            print(f"Hybrid failed (q={num_qubits}, reps={reps}): {e}")
                            metrics_hybrid = {
                                'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None,
                                'ROC-AUC': None, 'Sensitivity': None, 'Specificity': None,
                                'Train Accuracy': None, 'Generalization Gap': None
                            }
                            runtime_hybrid = None
                            y_score_hybrid, y_pred_hybrid = None, None

                        hybrid_label = f"Hybrid (q={num_qubits}, reps={reps})"
                        res_hybrid = {
                            'Dataset': dataset_name,
                            'Run': run_id + 1,
                            'Dataset Size': size,
                            'Model': hybrid_label,
                            'Noise Level': 0.01,
                            'Runtime (s)': runtime_hybrid,
                        }
                        res_hybrid.update(metrics_hybrid)
                        all_results.append(res_hybrid)

                        if size == max(experiment_config['dataset_sizes']) and run_id == 0 and y_score_hybrid is not None:
                            curve_records.append({
                                'Dataset': dataset_name,
                                'Model': hybrid_label,
                                'y_true': y_test,
                                'y_score': y_score_hybrid,
                                'y_pred': y_pred_hybrid,
                            })
        
    print("\n--- All experiments finished ---")
    df_results = save_results_table(all_results)
    summary = (
        df_results
        .dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)
        .agg(
            **{
                'Mean Accuracy': ('Accuracy', 'mean'),
                'Std Accuracy': ('Accuracy', 'std'),
            }
        )
    )
    summary.to_csv('benchmark_results_summary.csv', index=False)

    focus = df_results[
        (df_results['Dataset Size'].isin(experiment_config['report_focus_sizes'])) &
        (df_results['Noise Level'].isin(experiment_config['report_focus_noises']))
    ].copy()
    if not focus.empty:
        clinical_summary = (
            focus.dropna(subset=['Recall', 'F1-score'])
            .groupby(['Model'], as_index=False)
            .agg(
                **{
                    'Mean Accuracy': ('Accuracy', 'mean'),
                    'Mean Recall': ('Recall', 'mean'),
                    'Mean F1': ('F1-score', 'mean'),
                    'Mean False Negative Rate': ('False Negative Rate', 'mean'),
                    'Std Recall': ('Recall', 'std'),
                    'Std F1': ('F1-score', 'std'),
                    'Std False Negative Rate': ('False Negative Rate', 'std'),
                }
            )
            .sort_values(by=['Mean Recall', 'Mean F1'], ascending=False)
        )
        clinical_summary.to_csv('clinical_focus_summary.csv', index=False)
        print("\n===== CLINICAL FOCUS SUMMARY (small-data + mild-noise) =====")
        print(clinical_summary.head(10))

        classical_focus = clinical_summary[~clinical_summary['Model'].str.contains('VQC|Hybrid', regex=True, na=False)]
        hybrid_focus = clinical_summary[clinical_summary['Model'].str.contains('Hybrid', regex=True, na=False)]
        if not classical_focus.empty and not hybrid_focus.empty:
            best_classical = classical_focus.iloc[0]
            best_hybrid = hybrid_focus.iloc[0]
            print("\n===== HYBRID VS BEST CLASSICAL (focus regime) =====")
            print(
                f"Best classical: {best_classical['Model']} | Recall={best_classical['Mean Recall']:.3f} | F1={best_classical['Mean F1']:.3f} | FNR={best_classical['Mean False Negative Rate']:.3f}"
            )
            print(
                f"Best hybrid:     {best_hybrid['Model']} | Recall={best_hybrid['Mean Recall']:.3f} | F1={best_hybrid['Mean F1']:.3f} | FNR={best_hybrid['Mean False Negative Rate']:.3f}"
            )

    plot_accuracy_vs_size(df_results)
    plot_model_stability(df_results)
    plot_noise_sensitivity(df_results, baseline_model='SVM')
    plot_precision_recall_tradeoff(curve_records)
    plot_roc_curve(curve_records)
    plot_overfitting_behavior(df_results)
    plot_confusion_matrices(curve_records)

    print("\n===== FINAL RESULTS =====")
    print(df_results)
    print(summary)

if __name__ == "__main__":
    run_experiment()
