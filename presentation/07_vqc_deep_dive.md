# VQC Deep Dive — How the Quantum Classifier Works in This Project

This document explains exactly how the Quantum Kernel SVM (called VQC in the codebase for legacy reasons) works — both the noiseless ideal version and the noisy NISQ-simulated version. Every number and design choice is tied to actual code in `quantum_models.py` and `main.py`.

---

## Terminology Clarification (Important)

The function `get_vqc()` in `quantum_models.py` returns a `QuantumKernelSVM`, **not** a classical VQC. The name is a historical artifact from an earlier design.

| Term | What it means |
|---|---|
| **VQC (Variational Quantum Classifier)** | Has trainable quantum parameters (θ); trains via gradient descent. *This project does NOT use this.* |
| **Quantum Kernel SVM (what we use)** | Quantum circuit is fixed — it only encodes data. A classical SVM runs on top of the resulting kernel matrix. No quantum gradient descent. |

We switched from VQC to QK-SVM because classic VQCs suffer from **barren plateaus** on small datasets: quantum gradients vanish exponentially as depth increases, making training unstable. The QK-SVM avoids this entirely since no quantum parameters are ever trained.

---

## Step 0 — What the Input Looks Like

Before any quantum processing, the raw 22-feature patient audio data goes through a strict preprocessing pipeline (`data_preprocessing.py`):

1. **StandardScaler** — each of the 22 voice features is normalized to mean=0, std=1  
2. **PCA (n_components=4)** — dimensionality reduction from 22 → 4 features.  
   The 4 principal components typically capture ~85–90% of total variance.  
   The number 4 is not arbitrary: it must exactly match the number of qubits in the circuit.  
3. **MinMaxScaler (range: [−π, π])** — rescales PCA outputs into the valid angular range for quantum rotation gates (Rz gates consume angle values in radians; values outside this range cause aliasing).

A data point going into the quantum circuit is therefore a 4-element vector like `[−1.74, 0.92, −0.41, 2.10]`, with each value in radians.

---

## Step 1 — The Feature Map: ZZFeatureMap

**Code location:** `quantum_models.py`, lines 70–71

```python
feature_map = ZZFeatureMap(
    feature_dimension=self.num_qubits,  # = 4
    reps=1,
    entanglement='linear'
)
```

The `ZZFeatureMap` is a parameterized quantum circuit that encodes a classical data vector into a quantum state. It is the core of how "quantum computation" happens in this project.

### What it does, gate by gate

For a 4-qubit circuit with `reps=1`, the circuit structure is:

```
Layer 1 — Hadamard + Single-Qubit Encoding:
  q0: ─H──Rz(x₀)─
  q1: ─H──Rz(x₁)─
  q2: ─H──Rz(x₂)─
  q3: ─H──Rz(x₃)─

Layer 2 — Two-Qubit Entangling (ZZ interactions):
  q0 ──●── (with q1): applies phase 2·x₀·x₁
  q1 ──●── (with q2): applies phase 2·x₁·x₂
  q2 ──●── (with q3): applies phase 2·x₂·x₃
```

Each row process in detail:

| Gate | Input | Effect |
|---|---|---|
| **H** (Hadamard) | |0⟩ | Puts qubit into superposition: (|0⟩+|1⟩)/√2 |
| **Rz(xᵢ)** | Qubit in superposition | Rotates the qubit in the Bloch sphere by angle xᵢ around the Z-axis. This is how a data value **encodes** into the quantum state. |
| **ZZ gate** (pair i, j) | Two qubits | Applies e^(−i·xᵢ·xⱼ·Z⊗Z), encoding the **product** of two feature values as a phase. This is feature cross-information — pairwise correlations that a linear method cannot capture. |

The final state after encoding data point **x** is written as `|φ(x)⟩` — a 16-dimensional complex vector (2⁴ = 16 amplitudes for 4 qubits).

### Why `reps=1` (not 2 or 3)?

Originally the project used `reps=2`. This caused **kernel degeneracy**: the kernel matrix K[i,j] collapsed to all-ones (every pair looked identical to the quantum circuit). The SVM then had no discriminative signal and defaulted to predicting only the majority class (Parkinson's), achieving the class prior accuracy (~75%) on every run.

`reps=1` keeps the circuit shallow enough that individual data points are still distinguishable in Hilbert space.

### Why `entanglement='linear'`?

Linear entanglement means each qubit only entangles with its immediate neighbour: `(q0,q1), (q1,q2), (q2,q3)`. This is the most gate-efficient topology. 'Full' entanglement would add O(n²) two-qubit gates, which drastically increases noise accumulation and kernel degeneracy risk for a 4-qubit circuit.

---

## Step 2 — The Quantum Kernel

**Code location:** `quantum_models.py`, line 90

```python
self.kernel = QuantumKernel(feature_map=feature_map, quantum_instance=qi)
```

The kernel between two data points A and B is:

```
K(A, B) = |⟨φ(A)|φ(B)⟩|²
```

This is the squared inner product of the two quantum states in the 16-dimensional Hilbert space.

### How it is computed in practice

1. Build a "swap-test" circuit: run the feature map for A, then run the inverse feature map for B.
2. Measure all 4 qubits.
3. The probability of measuring all-zeros `|0000⟩` is exactly `|⟨φ(A)|φ(B)⟩|²`.
4. Repeat this `shots=2048` times and use the fraction of all-zero outcomes as the kernel estimate.

### Why 2048 shots?

Statistical error on a Bernoulli proportion with N samples is ~1/√N.  
With 2048 shots: σ ≈ 1/√2048 ≈ **0.022** (2.2% error per kernel entry).  
Fewer shots would make the kernel too noisy; more shots would make it prohibitively slow.  
The full N×N kernel matrix for N=140 training samples requires ~140² = 19,600 circuit evaluations, each with 2048 shots.

### The kernel matrix at train time vs. test time

- **K_train[i,j]** = K(x_train_i, x_train_j): square matrix, shape (N_train, N_train). Used to train the SVM.
- **K_test[i,j]** = K(x_test_i, x_train_j): rectangular matrix, shape (N_test, N_train). Used to classify test points. This is why `X_train_` must be stored after `fit()`.

---

## Step 3 — The SVM on Top

**Code location:** `quantum_models.py`, line 93

```python
self.svm = SVC(kernel='precomputed', probability=True, C=1.0, random_state=42)
```

Once the kernel matrices exist, a standard scikit-learn `SVC` takes over. The only difference from a classical SVM is `kernel='precomputed'` — it receives the already-computed quantum kernel matrix instead of computing its own.

- **C=1.0**: Standard SVM regularisation. Low enough to prevent overfitting when the kernel is noisy.  
- **probability=True**: Trains an additional Platt scaling layer to output class probabilities. Required for ROC-AUC computation and for soft-voting in the Hybrid model.

The SVM finds the maximum-margin hyperplane in the 16-dimensional quantum feature space defined by the kernel. In a noiseless simulation, this is a deterministic, convex optimisation.

---

## Noiseless Variant (`noisy=False`)

**Code location:** `quantum_models.py`, lines 77–78

```python
backend = AerSimulator()  # ideal, noiseless simulation
```

When `noisy=False`:
- The `AerSimulator` runs in **statevector mode** (deterministic) or shot-based ideal simulation.
- The kernel values are computed with **zero gate error** — each gate operates exactly as specified.
- The only source of variance is shot noise (the 2048-shot sampling), which gives ±2.2% per kernel entry.
- This represents the **theoretical upper bound** of what this 4-qubit circuit with ZZFeatureMap can achieve: what would happen if IBM's quantum hardware had perfect fidelity.

**In the experiment pipeline (`main.py`, lines 112–129):**  
The noiseless QK-SVM is run first for each (dataset size, run) combination. Its results are labelled `'VQC (Noiseless)'` in the CSV. This gives you the ideal-case quantum baseline before considering hardware imperfections.

---

## Noisy Variant (`noisy=True`)

**Code location:** `quantum_models.py`, lines 20–37

```python
def create_noise_model(error_prob=0.01):
    noise_model = NoiseModel()
    error_1q = depolarizing_error(error_prob, 1)
    error_2q = depolarizing_error(error_prob, 2)
    noise_model.add_all_qubit_quantum_error(error_1q, ['x', 'sx', 'rz'])
    noise_model.add_all_qubit_quantum_error(error_2q, ['cx'])
    return noise_model
```

### The Depolarizing Noise Model

The **depolarizing channel** is the standard mathematical model for gate imperfections on NISQ hardware. For a single-qubit gate with error probability `p`:

```
With probability (1-p): apply the gate correctly
With probability p/3:   apply X (bit flip) after the gate
With probability p/3:   apply Y (bit+phase flip) after the gate
With probability p/3:   apply Z (phase flip) after the gate
```

For a two-qubit gate (CNOT), the 2-qubit depolarizing channel is a tensor product version replacing the single-qubit Paulis with the 15 non-identity 2-qubit Pauli operators.

### Gates targeted

| Gate type | Affected gates | Why |
|---|---|---|
| 1-qubit | `x`, `sx`, `rz` | These are the native IBM gate set — Rz is how data angles are applied |
| 2-qubit | `cx` (CNOT) | The entangling gate — most error-prone gate on real hardware (2-3× more error than 1-qubit) |

### Noise levels in the experiment

The experiment sweeps 5 noise levels: `[0.0, 0.005, 0.01, 0.02, 0.05]` (0% to 5% gate error).

```python
'noise_levels': [0.0, 0.005, 0.01, 0.02, 0.05]
```

**Compound error accumulation** — a 4-qubit ZZFeatureMap (reps=1) has approximately 15 gate operations total (4 H + 4 Rz + 3 CX + 4 ZZ phases). The probability of at least one gate error:

| Noise level | P(at least one error) |
|---|---|
| 0.5% | 1 − (0.995)¹⁵ ≈ 7.2% |
| 1.0% | 1 − (0.990)¹⁵ ≈ 14.0% |
| 2.0% | 1 − (0.980)¹⁵ ≈ 26.1% |
| 5.0% | 1 − (0.950)¹⁵ ≈ 53.7% |

At 5% gate error, more than half of all circuit executions contain at least one error. The kernel values become nearly random, and the SVM collapses to majority-class prediction.

### What noise does to the kernel

Gate errors **corrupt the quantum state** that the Rz and ZZ gates encode. A phase error on qubit i changes `xᵢ` → `xᵢ + π` effectively, which maps to a completely different point in Hilbert space. This corrupts the kernel entry K(A,B) — instead of measuring the true inner product, you measure the inner product between a noisy version of A and a noisy version of B.

As error rates rise:
1. Kernel entries lose resolution — distinct data points appear more similar.
2. The kernel matrix shifts toward the identity matrix (each point only looks like itself).
3. Eventually the kernel degenerates to a constant matrix — all pairs look equally similar.
4. The SVM has no discriminative signal and predicts the majority class.

---

## The Full Training + Prediction Flow (Noiseless vs. Noisy)

```
Raw 22-feature Data
         ↓
StandardScaler → PCA (4 components) → MinMaxScaler [-π, π]
         ↓
   4-element vector per sample (xᵢ in radians)
         ↓
ZZFeatureMap circuit: encode each sample as |φ(xᵢ)⟩ in 16-dim Hilbert space
         ↓
QuantumKernel: run K(xᵢ, xⱼ) = |⟨φ(xᵢ)|φ(xⱼ)⟩|² for all pairs
  [NOISELESS: AerSimulator, no noise model, pure shot noise ±2.2%]
  [NOISY:     AerSimulator + depolarizing_error(p), 0.5–5% per gate]
         ↓
Kernel Matrix K_train (N×N) and K_test (M×N)
         ↓
SVC(kernel='precomputed', C=1.0): find max-margin hyperplane
         ↓
Prediction / predict_proba on test set
```

---

## Key Design Parameters (Summary Table)

| Parameter | Value | Why |
|---|---|---|
| `num_qubits` | 4 | Must match `pca_components` |
| `feature_map` | ZZFeatureMap | Encodes pairwise feature products via ZZ interactions |
| `reps` | 1 | Shallower circuit avoids kernel degeneracy; reps=2 collapsed kernel |
| `entanglement` | `'linear'` | Minimum gate overhead; captures pairwise correlations |
| `shots` | 2048 | ±2.2% kernel estimation error per entry |
| `C` (SVM) | 1.0 | Well-regularized for noisy kernels |
| `optimization_level` | 0 | No circuit rewriting — tests the circuit as intentionally designed |
| `seed_simulator` | 42 | Reproducible across runs |
| `seed_transpiler` | 42 | Reproducible transpilation |
| 1-qubit error gates | `x, sx, rz` | IBM native gate set |
| 2-qubit error gates | `cx` | CNOT is the entangling gate |
| Noise levels tested | 0%, 0.5%, 1%, 2%, 5% | Spans current best to worst NISQ hardware |
| Dataset sizes | 20, 50, 100, 150, 195 | Simulates small-data regimes |
| Repeated runs | 3 | Mean ± std enables model stability comparison |
| Train/test split | 70%/30% | Stratified to preserve ~75:25 Parkinson's/healthy ratio |
