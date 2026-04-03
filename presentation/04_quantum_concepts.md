# Quantum Computing Concepts — Plain English Explainer

No fluff. Just what you actually need to understand what this project is doing and why.

---

## 1. What is a Qubit?

A classical bit is either 0 or 1. A **qubit** is different: while it's not being measured, it can exist in a **superposition** — a combination of 0 and 1 at the same time, described by probabilities.

```
|ψ⟩ = α|0⟩ + β|1⟩
```

Where α and β are complex numbers satisfying |α|² + |β|² = 1.
- |α|² = probability of measuring 0
- |β|² = probability of measuring 1

The moment you measure a qubit, it collapses to 0 or 1. The interesting computation happens *before* the measurement, while it's still in superposition.

**In this project:** 4 qubits are used. Each qubit carries one PCA-compressed feature value from the patient data.

---

## 2. What is a Quantum Gate?

Quantum gates are the operations applied to qubits — like the AND/OR/NOT gates in classical computing, but reversible and operating on superpositions.

Key gates used in this project (via ZZFeatureMap):

| Gate | What it does |
|---|---|
| **H (Hadamard)** | Puts a qubit into equal superposition: \|0⟩ → (|0⟩ + |1⟩)/√2 |
| **Rz (Z-rotation)** | Rotates the qubit's state by an angle φ around the Z-axis. *This is how data is encoded — φ = your feature value.* |
| **CX (CNOT)** | Two-qubit gate: flips the second qubit only if the first qubit is 1. Creates **entanglement**. |

---

## 3. What is Entanglement?

When two qubits are entangled, their states are correlated — measuring one instantly tells you something about the other, no matter the distance.

In our circuit, the ZZFeatureMap entangles qubits in a linear chain: qubit 0 ↔ qubit 1 ↔ qubit 2 ↔ qubit 3.

**Why this matters for classification:** Entangling gates create interactions between features in the quantum state. Specifically, the ZZ gate encodes products of feature pairs: if features are x₁ and x₂, the entanglement introduces a term like x₁·x₂ in the quantum state. This is feature cross-information that classical linear methods miss.

---

## 4. What is a Hilbert Space?

The mathematical space in which quantum states live. For **n qubits**, this space has **2ⁿ dimensions**.

- 4 qubits → 2⁴ = 16 dimensional Hilbert space
- 10 qubits → 2¹⁰ = 1024 dimensions
- 50 qubits → 2⁵⁰ ≈ 1 quadrillion dimensions

**The key idea:** When you encode a data point into quantum states and measure similarity, you're computing similarity in this exponentially large space. Classical kernels (like RBF SVM) also operate in high-dimensional spaces, but they reduce to a specific formula. The quantum kernel computes similarity using a quantum circuit, accessing feature interactions that *may* not be efficiently computable classically.

---

## 5. What is a Quantum Circuit?

A recipe of gates applied to qubits in sequence. Looks like this conceptually:

```
Qubit 0: ─H──Rz(x₁)──●──────────────
                       │
Qubit 1: ─H──Rz(x₂)──X──●───────────
                          │
Qubit 2: ─H──Rz(x₃)──────X──●───────
                              │
Qubit 3: ─H──Rz(x₄)──────────X──────
               ↑                  ↑
         Encode features    Entangle features
```

**In the ZZFeatureMap used here:**
- First: Apply Hadamard to all qubits (create superposition)
- Then: Apply rotations using the data values (encode x₁, x₂, x₃, x₄)
- Then: Apply ZZ (entangling) operations using pairs of features (encode x₁·x₂, x₂·x₃, etc.)
- `reps=1` means this pattern runs once. `reps=2` would repeat all of this twice.

---

## 6. What is a Quantum Kernel?

A **kernel** is a function that measures similarity between two data points. Classical SVM uses kernels like RBF (Gaussian similarity).

A **quantum kernel** measures similarity by:
1. Encoding data point A into quantum state |ψ(A)⟩ using the circuit
2. Encoding data point B into quantum state |ψ(B)⟩
3. Computing: **K(A, B) = |⟨ψ(A)|ψ(B)⟩|²**  — the overlap (inner product squared) between the two quantum states

This overlap is estimated by running the circuit many times (**shots**) and counting measurement outcomes. With 2048 shots, the statistical error is ~1/√2048 ≈ 2%.

**Why is this potentially useful?** The inner product in the 2ⁿ-dimensional Hilbert space captures complex feature interactions. If the problem's decision boundary is better described by those quantum interactions than by any classical kernel, the quantum kernel will have an advantage.

**The limitation:** Computing the full kernel matrix for N training samples requires N² circuit evaluations. With N=140 training samples, that's ~19,600 circuit runs, each with 2048 shots. This is why the quantum part is so slow.

---

## 7. What is NISQ?

**Noisy Intermediate-Scale Quantum (NISQ)** — the current era of quantum computing (2023-2030 approximately).

- **Intermediate-Scale**: Computers with 10-1000 qubits (IBM has up to ~400 qubit devices)
- **Noisy**: Every gate operation has a non-zero error rate. Current best: ~0.1-1% per gate.

**Types of noise modeled in this project (depolarizing error):**
With probability `p`, instead of the intended gate, a random Pauli error is applied:
- **X error**: Bit flip (0→1, 1→0)
- **Y error**: Combined bit and phase flip
- **Z error**: Phase flip (changes the sign but not the classical bit)

The noise model applies:
- `error_prob` to 1-qubit gates (X, SX, Rz)
- `error_prob` to 2-qubit gates (CX) — 2-qubit gates are noisier in practice

**Why 1% is a big deal:**
A shallow 4-qubit ZZFeatureMap circuit (reps=1) has approximately:
- 4 Hadamard gates + 8 rotation gates + 3 CNOT gates ≈ 15 gate operations
- At 1% error per gate: P(at least one error) = 1 - (0.99)¹⁵ ≈ 14%
- At 2%: ≈ 26% chance of at least one error per circuit run

This is why you see significant accuracy degradation at 1-2% noise.

---

## 8. What is a VQC vs. Quantum Kernel SVM?

There's important terminology to get right:

**VQC (Variational Quantum Classifier) — what this project was originally designed to be:**
- Has **trainable parameters** (rotation angles θ) in the circuit
- Training = classical optimizer adjusts θ to minimize a loss function
- The circuit itself is the model

**Quantum Kernel SVM — what this project actually uses:**
- The quantum circuit is ONLY used to compute a kernel (similarity matrix)
- A classical SVM then uses that kernel to find the decision boundary
- **No trainable quantum parameters** — no gradient descent on the quantum side
- This is more stable for small datasets because it avoids the barren plateau problem (where quantum gradients vanish)

**The code uses `get_vqc()` as the function name** but it actually returns a `QuantumKernelSVM`. This is a naming legacy from earlier versions of the project. If asked, be honest: "We initially designed a VQC but switched to a Quantum Kernel SVM because it's more suitable for small datasets — VQCs suffer from training instability (barren plateaus) with limited data."

---

## 9. What is the Barren Plateau Problem?

When training a VQC with gradient descent, the gradients of the loss function with respect to circuit parameters vanish exponentially as the number of qubits grows. This is the **barren plateau problem**.

On a barren plateau, the loss landscape is nearly flat everywhere — the optimizer can't find which direction to move the parameters. Training stalls.

**Why Quantum Kernel SVM avoids this:** It doesn't train any quantum parameters. The circuit is fixed (only data values change). Classical SVM training happens entirely in Python with standard convex optimization — no barren plateaus.

---

## 10. What is the Quantum Advantage Claim?

The theoretical argument for why quantum kernels might help:

1. **Exponential feature space**: The quantum Hilbert space grows exponentially. Classical computers can't efficiently compute certain inner products in this space.
2. **Native entanglement**: ZZ gates encode pairwise feature correlations (x₁·x₂) that classical linear feature maps don't include without explicit feature engineering.
3. **Inductive bias**: The ZZFeatureMap's particular way of encoding data may match the intrinsic structure of biomedical voice features in ways that classical RBF kernels don't.

**The honest caveat for the panel:**
- This advantage is *theoretical*. On small classical simulators with 4 qubits, we can explicitly compute what the quantum computer does efficiently.
- True quantum advantage would require running on a real quantum device OR using enough qubits that classical simulation becomes intractable (roughly >50 qubits).
- What we're showing is that even in simulation, the *pattern* of how quantum models behave (variance, noise sensitivity) is fundamentally different — and understanding that pattern is the scientific contribution.
