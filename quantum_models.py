from qiskit.circuit.library import ZZFeatureMap, RealAmplitudes
from qiskit_algorithms.optimizers import COBYLA
from qiskit_machine_learning.algorithms import VQC
from qiskit.primitives import Sampler
from qiskit_aer.noise import NoiseModel, depolarizing_error
from qiskit_aer.primitives import Sampler as AerSampler

def create_noise_model(error_prob=0.01):
    """
    Creates a simple depolarizing noise model.
    """
    noise_model = NoiseModel()
    error_1q = depolarizing_error(error_prob, 1)
    error_2q = depolarizing_error(error_prob, 2)
    
    # Apply to standard basis gates
    noise_model.add_all_qubit_quantum_error(error_1q, ['u1', 'u2', 'u3', 'rx', 'ry', 'rz'])
    noise_model.add_all_qubit_quantum_error(error_2q, ['cx', 'cz'])
    return noise_model

def get_vqc(num_qubits=4, noisy=False, error_prob=0.01):
    """
    Constructs the VQC model with options for noiseless and noisy simulation.
    """
    feature_map = ZZFeatureMap(feature_dimension=num_qubits, reps=2, entanglement='linear')
    ansatz = RealAmplitudes(num_qubits=num_qubits, reps=2)
    optimizer = COBYLA(maxiter=80)  # Keep maxiter tractable for quick evaluation
    
    if noisy:
        noise_model = create_noise_model(error_prob)
        sampler = AerSampler(backend_options={"noise_model": noise_model})
    else:
        sampler = Sampler()
        
    vqc = VQC(
        sampler=sampler,
        feature_map=feature_map,
        ansatz=ansatz,
        optimizer=optimizer,
    )
    return vqc
