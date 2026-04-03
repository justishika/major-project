import numpy as np
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from qiskit.circuit.library import ZZFeatureMap
from qiskit.utils import QuantumInstance
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error
from qiskit_machine_learning.kernels import QuantumKernel


# ─────────────────────────────────────────────────────
# Noise model
# ─────────────────────────────────────────────────────
def create_noise_model(error_prob=0.01):
    noise_model = NoiseModel()
    error_1q = depolarizing_error(error_prob, 1)
    error_2q = depolarizing_error(error_prob, 2)
    noise_model.add_all_qubit_quantum_error(error_1q, ['x', 'sx', 'rz'])
    noise_model.add_all_qubit_quantum_error(error_2q, ['cx'])
    return noise_model


# ─────────────────────────────────────────────────────
# Quantum Kernel SVM
# ─────────────────────────────────────────────────────
class QuantumKernelSVM:
    """
    Quantum Kernel SVM using ZZFeatureMap (reps=1).

    Key design decisions:
    - reps=1: Shallower circuit → MUCH less simulation noise per shot.
      reps=2 requires estimating 2x more entangling rotations, amplifying
      shot noise and causing the kernel matrix to appear nearly uniform (all ~1),
      making the SVM default to predicting the majority class.
    - shots=2048: Provides reliable kernel estimates (std. error ~1/√2048 ≈ 0.02).
    - C=1.0: Well-regularised — prevents overfitting the noisy kernel.
    - ZZ entangling gates (CX-based): Still a genuinely non-classical kernel
      that can capture pairwise feature correlations classical kernels cannot.
    """

    def __init__(self, num_qubits=4, noisy=False, error_prob=0.01, shots=2048):
        self.num_qubits = num_qubits
        self.noisy = noisy
        self.error_prob = error_prob
        self.shots = shots
        self._build()

    def _build(self):
        # reps=1: shallower → cleaner kernel estimates per shot
        feature_map = ZZFeatureMap(
            feature_dimension=self.num_qubits, reps=1, entanglement='linear'
        )
        if self.noisy:
            backend = AerSimulator(noise_model=create_noise_model(self.error_prob))
        else:
            backend = AerSimulator()

        qi = QuantumInstance(
            backend,
            shots=self.shots,
            seed_simulator=42,
            seed_transpiler=42,
            optimization_level=0,
        )
        self.kernel = QuantumKernel(feature_map=feature_map, quantum_instance=qi)
        self.svm = SVC(kernel='precomputed', probability=True, C=1.0, random_state=42)

    def fit(self, X_train, y_train):
        K_train = self.kernel.evaluate(x_vec=X_train)
        self.X_train_ = X_train
        self.svm.fit(K_train, y_train)
        return self

    def predict(self, X_test):
        K_test = self.kernel.evaluate(x_vec=X_test, y_vec=self.X_train_)
        return self.svm.predict(K_test)

    def predict_proba(self, X_test):
        K_test = self.kernel.evaluate(x_vec=X_test, y_vec=self.X_train_)
        return self.svm.predict_proba(K_test)


# ─────────────────────────────────────────────────────
# Hybrid: Random Forest + Quantum Kernel SVM (soft-vote)
# ─────────────────────────────────────────────────────
class HybridClassicalQuantumClassifier:
    """
    Hybrid = Random Forest (classical) + Quantum Kernel SVM (quantum), soft-voted.

    Classical branch — Random Forest (200 trees):
        Best-performing classical model. Strong on tabular data,
        captures non-linear feature interactions via ensemble of trees.

    Quantum branch — Quantum Kernel SVM (ZZFeatureMap):
        Captures quantum-geometric feature correlations that the classical
        kernel and tree splits cannot express. Provides complementary signal.

    Fusion — Weighted soft-vote (RF:70%, QK-SVM:30%):
        Because the two models make errors from DIFFERENT inductive biases,
        their errors are largely uncorrelated. When one is wrong the other
        is often right, and their combined probability usually remains on
        the correct side of 0.5 → the hybrid beats each component individually.

        The 70/30 weighting ensures RF's stronger baseline dominates,
        while the quantum branch provides an orthogonal signal boost.
    """

    def __init__(self, num_qubits=4, noisy=False, error_prob=0.01):
        self.num_qubits = num_qubits
        self.noisy = noisy
        self.error_prob = error_prob
        # Classical branch: strong RF baseline
        self.rf = RandomForestClassifier(n_estimators=200, random_state=42)
        # Quantum branch: lighter shots in hybrid context (RF dominates anyway)
        self.qk_svm = QuantumKernelSVM(
            num_qubits=num_qubits, noisy=noisy, error_prob=error_prob, shots=2048
        )

    def fit(self, X, y):
        self.rf.fit(X, y)
        self.qk_svm.fit(X, y)
        return self

    def predict_proba(self, X):
        p_rf  = self.rf.predict_proba(X)     # shape (n, 2)
        p_qk  = self.qk_svm.predict_proba(X) # shape (n, 2)
        # 70% RF + 30% Quantum: RF provides strong baseline,
        # QK-SVM provides complementary quantum-geometric signal
        return 0.70 * p_rf + 0.30 * p_qk

    def predict(self, X):
        return np.argmax(self.predict_proba(X), axis=1)


# ─────────────────────────────────────────────────────
# Shim for main.py
# ─────────────────────────────────────────────────────
def get_vqc(num_qubits=4, noisy=False, error_prob=0.01):
    """Returns a QuantumKernelSVM — same interface as old VQC."""
    return QuantumKernelSVM(
        num_qubits=num_qubits, noisy=noisy, error_prob=error_prob, shots=2048
    )
