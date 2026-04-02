import time
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
        'dataset_sizes': [20, 50, 100],
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

                # 1) Classical Models
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

                # 2) VQC Noiseless
                print("Training VQC (Noiseless)...")
                y_train_vqc = encode_labels_for_vqc(y_train)
                
                try:
                    vqc_ideal = get_vqc(num_qubits=experiment_config['pca_components'], noisy=False)
                    if vqc_ideal is None:
                        raise ValueError("VQC initialization failed")
                    
                    start_time = time.time()
                    vqc_ideal.fit(X_train, y_train_vqc)
                    raw_test_pred = vqc_ideal.predict(X_test)
                    raw_train_pred = vqc_ideal.predict(X_train)
                    y_score_test, y_pred_test = _safe_vqc_scores_and_labels(raw_test_pred)
                    _, y_pred_train = _safe_vqc_scores_and_labels(raw_train_pred)

                    metrics_ideal = evaluate_model(y_test, y_pred_test, y_score_test)
                    train_metrics_ideal = evaluate_model(y_train, y_pred_train)
                    metrics_ideal['Train Accuracy'] = train_metrics_ideal['Accuracy']
                    metrics_ideal['Generalization Gap'] = train_metrics_ideal['Accuracy'] - metrics_ideal['Accuracy']
                    runtime_ideal = time.time() - start_time
                    print(f"VQC Noiseless success! Accuracy: {metrics_ideal['Accuracy']:.3f}")
                except Exception as e:
                    print(f"VQC Noiseless failed: {e}")
                    metrics_ideal = {
                        'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None,
                        'ROC-AUC': None, 'Sensitivity': None, 'Specificity': None,
                        'Train Accuracy': None, 'Generalization Gap': None
                    }
                    runtime_ideal = None
                    y_score_test, y_pred_test = None, None

                res_ideal = {
                    'Dataset': dataset_name,
                    'Run': run_id + 1,
                    'Dataset Size': size,
                    'Model': 'VQC (Noiseless)',
                    'Noise Level': 0.0,
                    'Runtime (s)': runtime_ideal,
                }
                res_ideal.update(metrics_ideal)
                all_results.append(res_ideal)

                if size == max(experiment_config['dataset_sizes']) and run_id == 0 and y_score_test is not None:
                    curve_records.append({
                        'Dataset': dataset_name,
                        'Model': 'VQC (Noiseless)',
                        'y_true': y_test,
                        'y_score': y_score_test,
                        'y_pred': y_pred_test,
                    })

                # 3) VQC Noisy (noise curve)
                for noise_level in experiment_config['noise_levels']:
                    print(f"  Training VQC (Noise={noise_level})...")
                    try:
                        vqc_noisy = get_vqc(
                            num_qubits=experiment_config['pca_components'],
                            noisy=(noise_level > 0),
                            error_prob=noise_level if noise_level > 0 else 0.0,
                        )
                        if vqc_noisy is None:
                            raise ValueError("VQC initialization failed")
                        
                        start_time = time.time()
                        vqc_noisy.fit(X_train, y_train_vqc)
                        raw_test_pred = vqc_noisy.predict(X_test)
                        raw_train_pred = vqc_noisy.predict(X_train)
                        y_score_noisy, y_pred_noisy = _safe_vqc_scores_and_labels(raw_test_pred)
                        _, y_pred_train_noisy = _safe_vqc_scores_and_labels(raw_train_pred)

                        metrics_noisy = evaluate_model(y_test, y_pred_noisy, y_score_noisy)
                        train_metrics_noisy = evaluate_model(y_train, y_pred_train_noisy)
                        metrics_noisy['Train Accuracy'] = train_metrics_noisy['Accuracy']
                        metrics_noisy['Generalization Gap'] = train_metrics_noisy['Accuracy'] - metrics_noisy['Accuracy']
                        runtime_noisy = time.time() - start_time
                    except Exception as e:
                        print(f"  VQC Noisy failed at noise={noise_level}: {e}")
                        metrics_noisy = {
                            'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None,
                            'ROC-AUC': None, 'Sensitivity': None, 'Specificity': None,
                            'Train Accuracy': None, 'Generalization Gap': None
                        }
                        runtime_noisy = None
                        y_score_noisy, y_pred_noisy = None, None

                    model_name = 'VQC (Noisy)' if noise_level > 0 else 'VQC (Noiseless Noise-Curve)'
                    res_noisy = {
                        'Dataset': dataset_name,
                        'Run': run_id + 1,
                        'Dataset Size': size,
                        'Model': model_name,
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
                            'Model': 'VQC (Noisy)',
                            'y_true': y_test,
                            'y_score': y_score_noisy,
                            'y_pred': y_pred_noisy,
                        })

                # 4) Hybrid Classical-Quantum Model
                print("Training Hybrid Model...")
                try:
                    hybrid = HybridClassicalQuantumClassifier(
                        num_qubits=experiment_config['pca_components'],
                        classical_pca_components=experiment_config['pca_components'],
                        noisy=True,
                        error_prob=0.01
                    )
                    start_time = time.time()
                    hybrid.fit(X_train, y_train_vqc)
                    raw_test_pred_hybrid = hybrid.predict(X_test)
                    raw_train_pred_hybrid = hybrid.predict(X_train)
                    y_score_hybrid, y_pred_hybrid = _safe_vqc_scores_and_labels(raw_test_pred_hybrid)
                    _, y_pred_train_hybrid = _safe_vqc_scores_and_labels(raw_train_pred_hybrid)

                    metrics_hybrid = evaluate_model(y_test, y_pred_hybrid, y_score_hybrid)
                    train_metrics_hybrid = evaluate_model(y_train, y_pred_train_hybrid)
                    metrics_hybrid['Train Accuracy'] = train_metrics_hybrid['Accuracy']
                    metrics_hybrid['Generalization Gap'] = train_metrics_hybrid['Accuracy'] - metrics_hybrid['Accuracy']
                    runtime_hybrid = time.time() - start_time
                    print(f"Hybrid success! Accuracy: {metrics_hybrid['Accuracy']:.3f}")
                except Exception as e:
                    print(f"Hybrid model failed: {e}")
                    metrics_hybrid = {
                        'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None,
                        'ROC-AUC': None, 'Sensitivity': None, 'Specificity': None,
                        'Train Accuracy': None, 'Generalization Gap': None
                    }
                    runtime_hybrid = None
                    y_score_hybrid, y_pred_hybrid = None, None

                res_hybrid = {
                    'Dataset': dataset_name,
                    'Run': run_id + 1,
                    'Dataset Size': size,
                    'Model': 'Hybrid (Classical+Quantum)',
                    'Noise Level': 0.01,
                    'Runtime (s)': runtime_hybrid,
                }
                res_hybrid.update(metrics_hybrid)
                all_results.append(res_hybrid)

                if size == max(experiment_config['dataset_sizes']) and run_id == 0 and y_score_hybrid is not None:
                    curve_records.append({
                        'Dataset': dataset_name,
                        'Model': 'Hybrid (Classical+Quantum)',
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
