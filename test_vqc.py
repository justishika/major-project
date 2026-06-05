"""Diagnose: what does the quantum kernel matrix actually look like?"""
import numpy as np
from data_preprocessing import load_and_preprocess_data, get_stratified_subsample, prepare_train_test_split
from qiskit.circuit.library import ZZFeatureMap
from qiskit.primitives import BackendSamplerV2
from qiskit_algorithms.state_fidelities import ComputeUncompute
from qiskit_aer import AerSimulator
from qiskit_machine_learning.kernels import FidelityQuantumKernel

X, y, _ = load_and_preprocess_data('parkinsons', n_components=4, use_pca=True)
X_sub, y_sub = get_stratified_subsample(X, y, sample_size=50, random_state=42)
X_train, X_test, y_train, y_test = prepare_train_test_split(X_sub, y_sub, test_size=0.3, random_state=42)

print(f"X_train range per feature:")
for i in range(X_train.shape[1]):
    print(f"  feat {i}: [{X_train[:,i].min():.3f}, {X_train[:,i].max():.3f}]")

backend = AerSimulator(seed_simulator=42)
sampler = BackendSamplerV2(backend=backend)
fidelity = ComputeUncompute(
    sampler=sampler, 
    shots=2048, 
    transpiler_options={'optimization_level': 0, 'seed_transpiler': 42}
)

for reps in [1, 2]:
    fm = ZZFeatureMap(feature_dimension=4, reps=reps, entanglement='linear').decompose()
    kernel = FidelityQuantumKernel(feature_map=fm, fidelity=fidelity)
    
    # Compute small kernel (first 8 training points only)
    K = kernel.evaluate(x_vec=X_train[:8])
    # Set diagonal to NaN to look only at off-diagonal
    K_off = K.copy()
    np.fill_diagonal(K_off, np.nan)
    print(f"\nreps={reps} kernel matrix (8x8 sample):")
    print(f"  Off-diagonal min: {np.nanmin(K_off):.4f}")
    print(f"  Off-diagonal max: {np.nanmax(K_off):.4f}")
    print(f"  Off-diagonal mean: {np.nanmean(K_off):.4f}")
    print(f"  Off-diagonal std: {np.nanstd(K_off):.4f}")
    print(f"  Diagonal values: {np.diag(K)}")  # should be ~1.0
