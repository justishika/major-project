# Quantum Computing Concepts — Plain English Explainer

No fluff. Just what you actually need to understand what this project is doing and why.

---

## 1. What is a Qubit?
A **qubit** exists in a **superposition** — a combination of 0 and 1 at the same time, described by probabilities. In this project, 4 qubits are used. Each qubit carries one PCA-compressed feature value from the patient data.

## 2. What is a Quantum Gate?
Quantum gates are operations applied to qubits. Key gates used in this project via `ZZFeatureMap`:
- **H (Hadamard):** Creates equal superposition.
- **Rz (Z-rotation):** Encodes your feature value via rotation angle.
- **CX (CNOT):** Two-qubit gate creating **entanglement**.

## 3. What is Entanglement?
Entangling gates create interactions between features in the quantum state. Specifically, the ZZ gate encodes products of feature pairs (e.g., $x_1 \cdot x_2$). This represents feature cross-information that classical linear methods miss.

## 4. What is a Quantum Kernel SVM?
A **Quantum Kernel** measures similarity between two data points:
1. Encode point A into a quantum state.
2. Encode point B.
3. Compute the overlap (inner product squared) between the two states.

This inner product is evaluated by running the circuit many times (**shots**). A classical SVM then uses this kernel matrix to find the best decision boundary.
Unlike a Variational Quantum Classifier (VQC), the QK-SVM has **no trainable quantum parameters**. This avoids the **barren plateau problem** (where gradients vanish), making it vastly more stable for small datasets.

## 5. What is NISQ?
**Noisy Intermediate-Scale Quantum (NISQ)** — the current era of quantum computing. Every gate operation has a small error rate (~0.1-1%).
Our simulation explicitly models **depolarizing noise** based on real IBM hardware parameters. At 1% error per gate, a shallow 4-qubit circuit might have a 15% chance of failing completely. This is why quantum accuracy degrades rapidly with noise.

## 6. What is the Quantum Advantage Claim?
The theoretical argument is that quantum kernels compute feature interactions (via entanglement) in an exponentially large Hilbert space that classical computers can't easily replicate.
Our honest caveat: On 4 qubits, classical simulation is trivial. But the *pattern* of how these quantum models behave (variance, noise sensitivity, and performance when ensembled) tells us something fundamental about the future of QML in healthcare.
