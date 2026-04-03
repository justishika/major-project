from qiskit_machine_learning.algorithms import VQC
from qiskit.circuit.library import ZFeatureMap, RealAmplitudes
from qiskit.algorithms.optimizers import COBYLA
from qiskit.utils import QuantumInstance
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error
from sklearn.decomposition import PCA, KernelPCA


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


def get_vqc(num_qubits=4, noisy=False, error_prob=0.01):
    """
    Constructs the VQC model with options for noiseless and noisy simulation.
    Built for Qiskit 0.43.2 (QuantumInstance API).
    """
    try:
        feature_map = ZFeatureMap(feature_dimension=num_qubits, reps=2)
        ansatz = RealAmplitudes(num_qubits=num_qubits, reps=2, entanglement='linear')
        optimizer = COBYLA(maxiter=1000)

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
    
    def __init__(self, num_qubits=4, classical_pca_components=None, noisy=False, error_prob=0.01):
        self.num_qubits = num_qubits
        self.classical_pca_components = classical_pca_components or num_qubits
        self.noisy = noisy
        self.error_prob = error_prob
        self.pca = KernelPCA(n_components=self.classical_pca_components, kernel='rbf')
        self.vqc = get_vqc(num_qubits=self.num_qubits, noisy=noisy, error_prob=error_prob)
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
