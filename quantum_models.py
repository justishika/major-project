from qiskit_machine_learning.algorithms import VQC
from qiskit.circuit.library import ZZFeatureMap, RealAmplitudes
from qiskit.algorithms.optimizers import COBYLA
from qiskit.utils import QuantumInstance
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
import numpy as np


def create_noise_model(error_prob=0.01):
    """
    Creates a simple depolarizing noise model.
    """
    noise_model = NoiseModel()
    error_1q = depolarizing_error(error_prob, 1)
    error_2q = depolarizing_error(error_prob, 2)
    
    # Apply to common Aer basis gates
    noise_model.add_all_qubit_quantum_error(error_1q, ['x', 'sx', 'rz'])
    noise_model.add_all_qubit_quantum_error(error_2q, ['cx'])
    return noise_model


def get_vqc(num_qubits=4, reps=1, maxiter=120, noisy=False, error_prob=0.01):
    """
    Constructs the VQC model with options for noiseless and noisy simulation.
    Built for Qiskit 0.43.2 (QuantumInstance API).
    """
    try:
        feature_map = ZZFeatureMap(feature_dimension=num_qubits, reps=1, entanglement='linear')
        ansatz = RealAmplitudes(num_qubits=num_qubits, reps=reps)
        optimizer = COBYLA(maxiter=maxiter)

        if noisy:
            noise_model = create_noise_model(error_prob)
            backend = AerSimulator(noise_model=noise_model)
        else:
            backend = AerSimulator()

        quantum_instance = QuantumInstance(
            backend=backend,
            shots=1024,
            seed_simulator=42,
            seed_transpiler=42,
        )

        vqc = VQC(
            feature_map=feature_map,
            ansatz=ansatz,
            optimizer=optimizer,
            quantum_instance=quantum_instance,
        )
        return vqc
    except Exception as e:
        print(f"Warning: Could not create VQC: {e}")
        return None


class HybridClassicalQuantumClassifier:
    """
    Hybrid Variational Quantum Classifier:
    - Classical preprocessing: PCA dimensionality reduction
    - Quantum layer: VQC on the reduced feature space
    """
    
    def __init__(self, num_qubits=4, reps=1, maxiter=120, classical_pca_components=None, noisy=False, error_prob=0.01):
        self.num_qubits = num_qubits
        self.reps = reps
        self.maxiter = maxiter
        self.classical_pca_components = classical_pca_components or num_qubits
        self.noisy = noisy
        self.error_prob = error_prob
        self.pca = PCA(n_components=self.classical_pca_components)
        self.vqc = get_vqc(
            num_qubits=self.num_qubits,
            reps=self.reps,
            maxiter=self.maxiter,
            noisy=noisy,
            error_prob=error_prob,
        )
        if self.vqc is None:
            raise ValueError("Could not initialize VQC")
        
    def fit(self, X, y):
        """Train hybrid model: PCA then VQC"""
        X_classical = self.pca.fit_transform(X)
        self.vqc.fit(X_classical, y)
        return self
        
    def predict(self, X):
        """Predict with hybrid model"""
        X_classical = self.pca.transform(X)
        return self.vqc.predict(X_classical)


class TinyQuantumAugmentedClassifier:
    """
    Mostly-classical model with a tiny quantum refinement layer.

    Pipeline:
    1) Train a classical backbone (logistic regression)
    2) Build 2D quantum features from classical probability + uncertainty
    3) Train a small 2-qubit VQC and blend probabilities
    """

    def __init__(self, quantum_weight=0.2, maxiter=80, noisy=True, error_prob=0.01):
        self.quantum_weight = float(np.clip(quantum_weight, 0.0, 1.0))
        self.base_model = LogisticRegression(max_iter=1000, random_state=42)
        self.vqc = get_vqc(
            num_qubits=2,
            reps=1,
            maxiter=maxiter,
            noisy=noisy,
            error_prob=error_prob,
        )
        if self.vqc is None:
            raise ValueError("Could not initialize tiny quantum refinement layer")

    @staticmethod
    def _encode_binary_labels(y):
        y = y.astype(int)
        out = np.zeros((len(y), 2))
        out[np.arange(len(y)), y] = 1
        return out

    @staticmethod
    def _safe_quantum_probability(raw_pred):
        if raw_pred.ndim > 1 and raw_pred.shape[1] >= 2:
            return raw_pred[:, 1]
        return raw_pred.astype(float).ravel()

    @staticmethod
    def _quantum_features_from_classical_prob(p):
        # Uncertainty helps the tiny quantum layer focus on hard samples.
        eps = 1e-9
        uncertainty = -(p * np.log(p + eps) + (1 - p) * np.log(1 - p + eps)) / np.log(2)
        return np.column_stack([p, uncertainty])

    def fit(self, X, y):
        self.base_model.fit(X, y)
        p_train = self.base_model.predict_proba(X)[:, 1]
        X_q = self._quantum_features_from_classical_prob(p_train)
        y_one_hot = self._encode_binary_labels(y)
        self.vqc.fit(X_q, y_one_hot)
        return self

    def predict_proba(self, X):
        p_classical = self.base_model.predict_proba(X)[:, 1]
        X_q = self._quantum_features_from_classical_prob(p_classical)
        p_quantum = self._safe_quantum_probability(self.vqc.predict(X_q))
        p_final = (1.0 - self.quantum_weight) * p_classical + self.quantum_weight * p_quantum
        p_final = np.clip(p_final, 0.0, 1.0)
        return np.column_stack([1.0 - p_final, p_final])

    def predict(self, X):
        p_final = self.predict_proba(X)[:, 1]
        return (p_final >= 0.5).astype(int)
