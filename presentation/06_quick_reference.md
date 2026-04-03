# Quick Reference Sheet — Numbers, Definitions, One-Liners

Use this during Q&A as a mental cheat sheet. Know these cold.

---

## The Project in One Sentence
> "We benchmarked Quantum Kernel SVMs against classical classifiers (SVM, LR, Random Forest) on Parkinson's disease detection across 5 dataset sizes and 5 noise levels, to characterize quantum behavior in small-data healthcare settings — not to prove quantum superiority."

---

## Key Numbers to Know

| Number | What it is |
|---|---|
| **195** | Total patient records in the Parkinson's dataset |
| **22** | Raw biomedical voice features per patient |
| **4** | PCA components (and qubits) used |
| **~75%** | Class imbalance — patients with Parkinson's in the dataset |
| **5** | Dataset sizes tested: 20, 50, 100, 150, 195 |
| **5** | Noise levels tested: 0%, 0.5%, 1%, 2%, 5% |
| **3** | Repeated runs per configuration |
| **150** | Total model evaluations in the full experiment |
| **2048** | Quantum shots per kernel entry |
| **70/30** | Hybrid model weighting (RF/QK-SVM) |
| **0.022** | Standard error per quantum kernel estimate at 2048 shots (1/√2048) |
| **16** | Size of the Hilbert space (2⁴ qubits) |

---

## Models Summary

| Model | Type | Key Setting |
|---|---|---|
| SVM | Classical | RBF kernel, C=10 |
| Logistic Regression | Classical | Linear, C=1.0 |
| Random Forest | Classical | 100 trees |
| VQC (Noiseless) | Quantum | ZZFeatureMap, reps=1, no noise |
| VQC (Noisy) | Quantum | ZZFeatureMap, reps=1, depolarizing noise |
| Hybrid | Classical+Quantum | RF×0.7 + QK-SVM×0.3, soft vote |

---

## Technical Terms Quick Reference

| Term | Plain English |
|---|---|
| **Qubit** | Quantum bit — can be 0, 1, or both simultaneously until measured |
| **Superposition** | Qubit is in a combination of 0 and 1 before measurement |
| **Entanglement** | Two qubits whose states are correlated — measuring one tells you about the other |
| **ZZFeatureMap** | Quantum circuit that encodes data using Hadamard + ZZ-rotation gates |
| **Quantum Kernel** | Measures similarity between two data points via quantum state overlap: K(A,B) = \|⟨ψ(A)\|ψ(B)⟩\|² |
| **Depolarizing noise** | With probability p, a random Pauli error (X/Y/Z flip) is applied to a qubit after each gate |
| **Shots** | Number of times the circuit is run to estimate a probability. More shots = lower statistical error |
| **NISQ** | Noisy Intermediate-Scale Quantum — current era of quantum computers (10-1000 qubits, 0.1-2% gate errors) |
| **Barren Plateau** | Vanishing gradients in quantum circuit training — makes VQC optimization fail on large systems |
| **Generalization Gap** | Train Accuracy - Test Accuracy. Higher = model memorized training data = bad |
| **Sensitivity** | True Positive Rate = TP/(TP+FN) — how many sick patients were correctly identified |
| **Specificity** | True Negative Rate = TN/(TN+FP) — how many healthy patients were correctly cleared |
| **ROC-AUC** | 0.5 = random, 1.0 = perfect. Measures ranking ability across all decision thresholds |
| **PCA** | Principal Component Analysis — reduces 22 features into 4 without losing most of the information |
| **Hilbert Space** | The mathematical space where quantum states live. Grows as 2ⁿ with n qubits. |
| **SVM (classical)** | Support Vector Machine — finds optimal decision boundary in feature space |
| **Hybrid Soft Vote** | Average the probability outputs of multiple models with weights |

---

## Three Core Findings

1. **Quantum models have higher variance** — they're less consistent run-to-run than classical models at the same dataset size. This makes them less trustworthy in healthcare.

2. **Quantum accuracy degrades faster with noise** — classical models are CPU-based and immune to quantum hardware errors. VQC accuracy drops noticeably at 1% noise, where current NISQ hardware operates.

3. **The Hybrid model is the most capable** — by combining RF's stability with QK-SVM's complementary signal, it achieves better accuracy than either component alone across most dataset sizes and noise levels.

---

## Why We Used reps=1 (Not reps=2)

This is a likely specific question. Here's the exact answer:

`reps=2` means the ZZFeatureMap runs two layers of Hadamard + rotation + ZZ entanglement. This doubles the gate count. With 2048 shots per kernel entry, each individual gate's error compounds more. The result is that the kernel matrix becomes nearly uniform — every pair of data points has K(A,B) ≈ 1.0. This causes the SVM to predict the majority class for every sample (trivially achieving ~75% accuracy on this imbalanced dataset but learning nothing). `reps=1` produces a usable, non-degenerate kernel matrix that the SVM can actually learn from.

---

## Why 4 Qubits from 22 Features

22 features → PCA → 4 principal components.

PCA finds the 4 directions in 22-dimensional space that explain the most variance. The 4-component PCA explained variance is approximately 85-90% of total variance (the pipeline prints this when it runs). This means we retain most of the diagnostic information.

4 was chosen because:
- It matches 4 qubits (the quantum circuit dimension)
- 4-qubit circuits are computationally feasible to simulate
- Going to 8 qubits would require ~8-component PCA (retaining even more variance) but exponentially increases simulation time (2⁸ = 256 dimensional Hilbert space vs 2⁴ = 16)

---

## Why Parkinson's and Not a Larger Dataset

1. **It's small by design** — the study is specifically about small-data healthcare regimes. Using ImageNet would defeat the purpose.
2. **Standard benchmark** — UCI Parkinson's is used in 200+ published ML papers, providing comparison context.
3. **Class imbalance** — the 75/25 split makes it harder (can't just predict majority class), which makes performance differences between models more meaningful.
4. **Voice biomarkers** — the 22 features are real clinical measurements (MDVP jitter, shimmer, HNR, RPDE, DFA, PPE) used by neurologists in actual PD screening.

---

## The Honest Admission (That Actually Strengthens Your Position)

If pressed: *"Our quantum model doesn't win, our sample size is small, we're simulating not using real hardware, and we used only one primary dataset."*

The response: *"All of these are known limitations that we document openly. Scientific credibility comes from honest characterization of limitations, not from hiding them. The contribution is the framework and the quantified findings, not a claim of solved real-world deployment."*

This turns apparent weaknesses into demonstrated intellectual honesty — which is what separates research from marketing.
