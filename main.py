import time
import numpy as np
from data_preprocessing import load_and_preprocess_data, get_stratified_subsample, prepare_train_test_split
from classical_models import run_classical_models, evaluate_model
from quantum_models import get_vqc
from visualization import save_results_table, plot_metrics_vs_size

def encode_labels_for_vqc(y):
    """
    One-hot encodes binary labels. 
    Qiskit VQC often uses cross-entropy loss and expects one-hot formatted labels.
    """
    num_classes = 2
    y_one_hot = np.zeros((len(y), num_classes))
    y_one_hot[np.arange(len(y)), y.astype(int)] = 1
    return y_one_hot

def run_experiment():
    X, y = load_and_preprocess_data()
    
    dataset_sizes = [20, 50, 100]
    all_results = []
    
    for size in dataset_sizes:
        print(f"\n--- Running experiments for dataset size N={size} ---")
        X_sub, y_sub = get_stratified_subsample(X, y, sample_size=size)
        
        # Test size is 30% of subsample
        X_train, X_test, y_train, y_test = prepare_train_test_split(X_sub, y_sub, test_size=0.3)
        
        # 1. Classical Models
        print("Training Classical Models...")
        classical_results = run_classical_models(X_train, y_train, X_test, y_test)
        for model_name, metrics in classical_results.items():
            res = {'Dataset Size': size, 'Model': model_name}
            res.update(metrics)
            all_results.append(res)
            
        # 2. Quantum Models (Noiseless)
        print("Training VQC (Noiseless)...")
        y_train_vqc = encode_labels_for_vqc(y_train)
        
        vqc_ideal = get_vqc(num_qubits=4, noisy=False)
        start_time = time.time()
        
        try:
            vqc_ideal.fit(X_train, y_train_vqc)
            vqc_pred = vqc_ideal.predict(X_test)
            if vqc_pred.ndim > 1:
                vqc_pred = np.argmax(vqc_pred, axis=1)
            metrics_ideal = evaluate_model(y_test, vqc_pred)
            print(f"VQC Noiseless took {time.time() - start_time:.2f}s")
        except Exception as e:
            print(f"VQC Ideal prediction failed: {e}")
            metrics_ideal = {'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None, 'ROC-AUC': None}
        
        res_ideal = {'Dataset Size': size, 'Model': 'VQC (Noiseless)'}
        res_ideal.update(metrics_ideal)
        all_results.append(res_ideal)
        
        # 3. Quantum Models (Noisy)
        print("Training VQC (Noisy)...")
        vqc_noisy = get_vqc(num_qubits=4, noisy=True, error_prob=0.01)
        start_time = time.time()
        
        try:
            vqc_noisy.fit(X_train, y_train_vqc)
            vqc_pred_noisy = vqc_noisy.predict(X_test)
            if vqc_pred_noisy.ndim > 1:
                vqc_pred_noisy = np.argmax(vqc_pred_noisy, axis=1)
            metrics_noisy = evaluate_model(y_test, vqc_pred_noisy)
            print(f"VQC Noisy took {time.time() - start_time:.2f}s")
        except Exception as e:
            print(f"VQC Noisy prediction failed: {e}")
            metrics_noisy = {'Accuracy': None, 'Precision': None, 'Recall': None, 'F1-score': None, 'ROC-AUC': None}
            
        res_noisy = {'Dataset Size': size, 'Model': 'VQC (Noisy)'}
        res_noisy.update(metrics_noisy)
        all_results.append(res_noisy)
        
    print("\n--- All experiments finished ---")
    df_results = save_results_table(all_results)
    plot_metrics_vs_size(df_results)
    print(df_results)
    
if __name__ == "__main__":
    run_experiment()
