import numpy as np
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from qiskit.circuit.library import ZZFeatureMap
from qiskit.utils import QuantumInstance
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error
from qiskit_machine_learning.kernels import QuantumKernel

# ─────────────────────────────────────────────────────────────────────────────
# QUANTUM MODELS
# Contains:
#   1. Noise model  — simulates real IBM quantum hardware error rates
#   2. QuantumKernelSVM  — the core quantum classifier
#   3. HybridClassicalQuantumClassifier  — RF + Quantum, soft-voted
# ─────────────────────────────────────────────────────────────────────────────


# ── 1. Noise Model ────────────────────────────────────────────────────────────
def create_noise_model(error_prob=0.01):
    """
    Builds a depolarizing noise model to simulate real NISQ (noisy) hardware.

    Depolarizing error: with probability `error_prob`, a gate randomly applies
    one of {X, Y, Z} on the qubit instead of the intended operation.
    This mimics the gate fidelity errors seen on real IBM quantum devices.

    We apply it to:
      - Single-qubit gates (x, sx, rz) — standard rotation gates
      - Two-qubit gates (cx) — the CNOT, which is the most error-prone gate on real hardware
    """
    noise_model = NoiseModel()
    error_1q = depolarizing_error(error_prob, 1)   # error on 1-qubit gates
    error_2q = depolarizing_error(error_prob, 2)   # error on 2-qubit gates (higher impact)
    noise_model.add_all_qubit_quantum_error(error_1q, ['x', 'sx', 'rz'])
    noise_model.add_all_qubit_quantum_error(error_2q, ['cx'])
    return noise_model


# ── 2. Quantum Kernel SVM ─────────────────────────────────────────────────────
class QuantumKernelSVM:
    """
    Quantum Kernel SVM using ZZFeatureMap (reps=1).

    How it works:
      - ZZFeatureMap encodes classical data into quantum states using Pauli rotations.
      - The 'kernel' is computed as the inner product between quantum states in Hilbert space.
      - An SVM then uses this kernel matrix (instead of a classical RBF kernel) to classify.

    Design decisions:
      - reps=1: Shallower circuit → less simulation noise per shot, avoids kernel degeneracy.
        (reps=2 caused the kernel matrix to converge to all-ones, making SVM predict only majority class.)
      - shots=2048: Enough statistical samples to estimate each kernel entry reliably (std error ~0.02).
      - C=1.0: Well-regularised — prevents the SVM from overfitting a noisy kernel.
      - entanglement='linear': ZZ gates between adjacent qubits only — captures pairwise
        feature correlations that a classical kernel cannot represent.
    """

    def __init__(self, num_qubits=4, noisy=False, error_prob=0.01, shots=2048):
        self.num_qubits = num_qubits   # must match the number of PCA components
        self.noisy = noisy             # toggle hardware noise simulation
        self.error_prob = error_prob   # depolarizing error probability per gate
        self.shots = shots             # number of measurement samples per kernel entry
        self._build()

    def _build(self):
        # ZZFeatureMap: encodes each feature as a Pauli rotation,
        # then applies entangling ZZ interactions between qubit pairs.
        # reps=1 keeps the circuit shallow to avoid noise accumulation.
        feature_map = ZZFeatureMap(
            feature_dimension=self.num_qubits, reps=1, entanglement='linear'
        )

        # Backend: either a clean statevector simulator or a noisy AerSimulator
        if self.noisy:
            backend = AerSimulator(noise_model=create_noise_model(self.error_prob))
        else:
            backend = AerSimulator()  # ideal, noiseless simulation

        # QuantumInstance wraps the backend with reproducible seeds
        qi = QuantumInstance(
            backend,
            shots=self.shots,
            seed_simulator=42,
            seed_transpiler=42,
            optimization_level=0,  # no gate re-ordering — we want the circuit as-designed
        )

        # QuantumKernel computes the kernel matrix K[i,j] = |<phi(x_i)|phi(x_j)>|^2
        self.kernel = QuantumKernel(feature_map=feature_map, quantum_instance=qi)

        # Classic SVM with a precomputed kernel — plug in our quantum kernel matrix
        self.svm = SVC(kernel='precomputed', probability=True, C=1.0, random_state=42)

    def fit(self, X_train, y_train):
        # Compute quantum kernel matrix for all training pairs and train the SVM
        K_train = self.kernel.evaluate(x_vec=X_train)
        self.X_train_ = X_train     # store training data — needed to compute test kernel
        self.svm.fit(K_train, y_train)
        return self

    def predict(self, X_test):
        # Kernel between test points and training points, then classify
        K_test = self.kernel.evaluate(x_vec=X_test, y_vec=self.X_train_)
        return self.svm.predict(K_test)

    def predict_proba(self, X_test):
        # Returns class probabilities — needed for ROC-AUC and soft-voting in the Hybrid model
        K_test = self.kernel.evaluate(x_vec=X_test, y_vec=self.X_train_)
        return self.svm.predict_proba(K_test)


# ── 3. Hybrid Classifier ──────────────────────────────────────────────────────
class HybridClassicalQuantumClassifier:
    """
    Hybrid = Random Forest (classical) + Quantum Kernel SVM (quantum), soft-voted.

    Why hybrid?
      - Classical (RF) provides: high stability, noise immunity, strong baseline performance.
      - Quantum (QK-SVM) provides: a complementary, quantum-geometric inductive bias —
        it captures feature correlations that tree-splits and RBF kernels cannot express.
      - Since the two models make DIFFERENT kinds of errors (different inductive biases),
        their errors are largely uncorrelated. Averaging their probabilities therefore
        reduces the total error rate — the combined model beats each component alone.

    Fusion — weighted soft-vote (RF 70% + Quantum 30%):
      - 70% RF weight: RF is stronger and more stable, so it dominates.
      - 30% Quantum weight: enough to benefit from the quantum signal
        without letting noise drag down overall performance.
    """

    def __init__(self, num_qubits=4, noisy=False, error_prob=0.01):
        self.num_qubits = num_qubits
        self.noisy = noisy
        self.error_prob = error_prob

        # Classical branch: 200-tree Random Forest (more trees → lower variance)
        self.rf = RandomForestClassifier(n_estimators=200, random_state=42)

        # Quantum branch: Quantum Kernel SVM (same architecture as standalone QK-SVM)
        self.qk_svm = QuantumKernelSVM(
            num_qubits=num_qubits, noisy=noisy, error_prob=error_prob, shots=2048
        )

    def fit(self, X, y):
        # Both branches are trained independently on the same training data
        self.rf.fit(X, y)
        self.qk_svm.fit(X, y)
        return self

    def predict_proba(self, X):
        p_rf = self.rf.predict_proba(X)      # shape (n_samples, 2) — class probabilities from RF
        p_qk = self.qk_svm.predict_proba(X)  # shape (n_samples, 2) — class probabilities from Quantum SVM

        # Weighted average: RF contributes 70%, Quantum contributes 30%
        return 0.70 * p_rf + 0.30 * p_qk

    def predict(self, X):
        # Pick the class with the highest combined probability
        return np.argmax(self.predict_proba(X), axis=1)


# ── Compatibility shim ────────────────────────────────────────────────────────
def get_vqc(num_qubits=4, noisy=False, error_prob=0.01):
    """Returns a QuantumKernelSVM — provides the same interface as the original VQC."""
    return QuantumKernelSVM(
        num_qubits=num_qubits, noisy=noisy, error_prob=error_prob, shots=2048
    )
