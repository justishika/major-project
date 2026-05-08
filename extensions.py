import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

from data_preprocessing import load_and_preprocess_data, load_with_kbest, get_stratified_subsample, prepare_train_test_split
from quantum_models import get_vqc
from main import encode_labels_for_vqc

def run_feature_selection_comparison(dataset_name='parkinsons'):
    prefix = f"{dataset_name}_"
    print("\n=========================================================")
    print(f"--- Phase 7: Feature Selection (PCA vs SelectKBest) ({dataset_name}) ---")
    print("=========================================================")
    
    size = 100
    
    # 1. Evaluate PCA (4 components)
    X_pca, y = load_and_preprocess_data(dataset_name)
    X_sub, y_sub = get_stratified_subsample(X_pca, y, sample_size=size, random_state=42)
    X_train_pca, X_test_pca, y_train, y_test = prepare_train_test_split(X_sub, y_sub, test_size=0.3, random_state=100)
    y_train_vqc = encode_labels_for_vqc(y_train)
    
    print("Training VQC on PCA Features...")
    vqc_pca = get_vqc(num_qubits=4, noisy=True, error_prob=0.01)
    vqc_pca.fit(X_train_pca, y_train_vqc)
    p_pca = vqc_pca.predict(X_test_pca)
    if p_pca.ndim > 1: p_pca = np.argmax(p_pca, axis=1)
    acc_pca = np.mean(p_pca == y_test)
    print(f"PCA Accuracy: {acc_pca:.3f}")
    
    # 2. Evaluate SelectKBest (4 components)
    X_kbest, y = load_with_kbest(dataset_name, k=4)
    X_sub_k, y_sub_k = get_stratified_subsample(X_kbest, y, sample_size=size, random_state=42)
    X_train_k, X_test_k, _, _ = prepare_train_test_split(X_sub_k, y_sub_k, test_size=0.3, random_state=100)
    
    print("Training VQC on SelectKBest Features...")
    vqc_kbest = get_vqc(num_qubits=4, noisy=True, error_prob=0.01)
    vqc_kbest.fit(X_train_k, y_train_vqc)
    p_kbest = vqc_kbest.predict(X_test_k)
    if p_kbest.ndim > 1: p_kbest = np.argmax(p_kbest, axis=1)
    acc_kbest = np.mean(p_kbest == y_test)
    print(f"SelectKBest Accuracy: {acc_kbest:.3f}")
    
    df = pd.DataFrame([
        {'Method': 'PCA', 'Accuracy': acc_pca},
        {'Method': 'SelectKBest', 'Accuracy': acc_kbest}
    ])
    
    sns.set_theme(style="whitegrid")
    plt.figure(figsize=(6, 5))
    sns.barplot(data=df, x='Method', y='Accuracy', palette='Blues_d')
    plt.title(f'Feature Selection Impact on VQC (Noise 1%) - {dataset_name}')
    plt.ylim(0, 1.0)
    plt.savefig(os.path.join(".", f"{prefix}pca_vs_kbest.png"))
    plt.close()

def run_qubit_scaling(dataset_name='parkinsons'):
    prefix = f"{dataset_name}_"
    print("\n=========================================================")
    print(f"--- Phase 8: Qubit Dimensionality Scaling ({dataset_name}) ---")
    print("=========================================================")
    size = 100
    
    # Evaluate 4 Qubits (Noiseless for pure Hilbert correlation)
    X_4, y = load_and_preprocess_data(dataset_name)
    X_sub_4, y_sub_4 = get_stratified_subsample(X_4, y, sample_size=size, random_state=42)
    X_train_4, X_test_4, y_train, y_test = prepare_train_test_split(X_sub_4, y_sub_4, test_size=0.3, random_state=100)
    y_train_vqc = encode_labels_for_vqc(y_train)
    
    print("Training VQC on 4 Qubits...")
    vqc_4 = get_vqc(num_qubits=4, noisy=False)
    vqc_4.fit(X_train_4, y_train_vqc)
    p_4 = vqc_4.predict(X_test_4)
    if p_4.ndim > 1: p_4 = np.argmax(p_4, axis=1)
    acc_4 = np.mean(p_4 == y_test)
    print(f"4-Qubit Accuracy: {acc_4:.3f}")
    
    # Evaluate 6 Qubits
    from sklearn.decomposition import PCA
    from sklearn.preprocessing import StandardScaler
    if dataset_name == 'breast_cancer':
        from sklearn.datasets import load_breast_cancer
        X_raw = load_breast_cancer().data
    else:
        URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data'
        X_raw = pd.read_csv(URL).drop(columns=['name', 'status']).values
        
    X_scaled = StandardScaler().fit_transform(X_raw)
    X_6 = PCA(n_components=6).fit_transform(X_scaled)
    X_sub_6, _ = get_stratified_subsample(X_6, y, sample_size=size, random_state=42)
    X_train_6, X_test_6, _, _ = prepare_train_test_split(X_sub_6, y_sub_4, test_size=0.3, random_state=100)
    
    print("Training VQC on 6 Qubits (Expanding Hilbert Space)...")
    vqc_6 = get_vqc(num_qubits=6, noisy=False)
    vqc_6.fit(X_train_6, y_train_vqc)
    p_6 = vqc_6.predict(X_test_6)
    if p_6.ndim > 1: p_6 = np.argmax(p_6, axis=1)
    acc_6 = np.mean(p_6 == y_test)
    print(f"6-Qubit Accuracy: {acc_6:.3f}")
    
    df = pd.DataFrame([
        {'Hilbert Space Strategy': '4 Qubits', 'Accuracy': acc_4},
        {'Hilbert Space Strategy': '6 Qubits', 'Accuracy': acc_6}
    ])
    
    sns.set_theme(style="whitegrid")
    plt.figure(figsize=(6, 5))
    sns.barplot(data=df, x='Hilbert Space Strategy', y='Accuracy', palette='Greens_d')
    plt.title(f'Hilbert Dimensionality Scaling - {dataset_name}')
    plt.ylim(0, 1.0)
    plt.savefig(os.path.join(".", f"{prefix}qubit_scaling.png"))
    plt.close()

if __name__ == "__main__":
    for ds in ['parkinsons', 'breast_cancer']:
        run_feature_selection_comparison(dataset_name=ds)
        run_qubit_scaling(dataset_name=ds)
