# Quick Reference Sheet

Use this during Q&A as a mental cheat sheet.

---

## The Project in One Sentence
> "We benchmarked a Hybrid Classical-Quantum Stacking Ensemble against standalone classical and quantum classifiers across 12 clinical disease datasets and various noise levels to prove that quantum models can improve diagnostic accuracy when integrated into classical meta-learning architectures."

---

## Key Numbers to Know
| Number | What it is |
|---|---|
| **12** | Distinct clinical disease datasets benchmarked |
| **4** | PCA components (and qubits) used |
| **5** | Dataset sizes tested per disease |
| **3** | Noise levels tested: 0.0, 0.01, 0.05 |
| **1024** | Quantum shots per kernel entry |
| **16** | Size of the Hilbert space (2⁴ qubits) |

---

## Models Summary
| Model | Type | Key Setting |
|---|---|---|
| SVM | Classical | RBF kernel, C=1.0 |
| Logistic Regression | Classical | Linear, C=0.8 |
| Random Forest | Classical | 100 trees |
| QK-SVM (Noiseless/Noisy) | Quantum | ZZFeatureMap, reps=1, linear entanglement |
| Hybrid | Classical+Quantum | Stacking ensemble of RF, ET, GB, and enhanced QK-SVM (full entanglement, C=10) with GB meta-learner |

---

## Three Core Findings
1. **Quantum alone has high variance** — making it untrustworthy as a standalone clinical tool in the NISQ era.
2. **Quantum accuracy degrades rapidly with hardware noise** — dipping significantly even at 1% error rates.
3. **The Hybrid Stacking Ensemble is state-of-the-art** — by leveraging error decorrelation between classical trees and quantum kernels, it achieves higher accuracy and stability than any individual baseline across all 12 datasets.

---

## Why 4 Qubits?
PCA reduces the features to 4 principal components. 4-qubit circuits are computationally feasible to simulate thousands of times. More qubits would exponentially increase simulation time.

## Why 12 Datasets?
To prevent cherry-picking. Testing on Parkinson's, Breast Cancer, Heart Disease, and others proves that the Hybrid model's success is a general property of the architecture, not a fluke of one specific dataset.
