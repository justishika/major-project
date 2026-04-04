# Hybrid Model Deep Dive — How the Hybrid Classifier Works in This Project

This document explains the `HybridClassicalQuantumClassifier` in `quantum_models.py` in full technical detail — what it is, why it is designed the way it is, how the two components interact, and what the numbers mean.

---

## What the Hybrid Model Is

**Code location:** `quantum_models.py`, lines 114–160

```python
class HybridClassicalQuantumClassifier:
    """
    Hybrid = Random Forest (classical) + Quantum Kernel SVM (quantum), soft-voted.
    """
    def __init__(self, num_qubits=4, noisy=False, error_prob=0.01):
        self.rf     = RandomForestClassifier(n_estimators=200, random_state=42)
        self.qk_svm = QuantumKernelSVM(num_qubits=num_qubits, noisy=noisy,
                                        error_prob=error_prob, shots=2048)
```

The Hybrid model is an **ensemble of two independently trained classifiers** that each produce probability estimates on the same input. Their outputs are combined using a **weighted soft vote**.

It is not a stacked model (the outputs of one do not feed into the other). It is not a boosted model (they do not train sequentially; neither sees the residuals of the other). It is a **parallel ensemble** with a fixed, hand-tuned fusion rule.

---

## Component 1 — Random Forest (Classical Branch)

```python
self.rf = RandomForestClassifier(n_estimators=200, random_state=42)
```

### What it does

A Random Forest is an ensemble of decision trees, each of which learns a set of binary feature-threshold splits. The forest trains **200 trees** (deliberately more than the 100-tree classical baseline in `classical_models.py` to give the Hybrid model's classical branch maximum stability).

Each tree is trained on:
- A **bootstrap sample** of the training data (random sampling with replacement)
- A **random subset of features** at each split (√4 ≈ 2 features considered per split for a 4-feature input)

The forest's final probability estimate for class 1 (Parkinson's) is the fraction of trees that vote for class 1:

```
p_RF(x) = (number of trees voting class 1) / 200
```

### Why Random Forest for the classical branch?

- **Low variance**: Averaging 200 trees cancels tree-level noise. This is what makes RF the most stable model in the benchmarks.
- **Complementary inductive bias**: Random Forest makes axis-aligned rectangular splits in the 4-dimensional PCA space. It has no concept of feature interactions or kernels — it can only express "if feature j < threshold then...". This is fundamentally different from what the quantum kernel captures (pairwise angle products across all features simultaneously).
- **Handles small data well**: RF with 200 trees is robust even at N=20. The quantum component degrades faster at small N because the kernel matrix has fewer training points to learn from.
- **Noise immunity**: RF is completely unaffected by quantum gate noise. It is a pure classical model trained on the same PCA-scaled input vectors.

---

## Component 2 — Quantum Kernel SVM (Quantum Branch)

```python
self.qk_svm = QuantumKernelSVM(
    num_qubits=num_qubits, noisy=noisy, error_prob=error_prob, shots=2048
)
```

This is the exact same `QuantumKernelSVM` described in detail in `07_vqc_deep_dive.md`. In the Hybrid model, it is always run with:

- `noisy=True` (in the experiment pipeline, `main.py` line 199)
- `error_prob=0.01` (1% depolarizing gate error — representative NISQ hardware level)
- `shots=2048`

The QK-SVM produces probability estimates via Platt scaling (`probability=True` in the SVC constructor):

```
p_QK(x) = SVC.predict_proba(K_test) → shape (N_test, 2)
```

The probability for Parkinson's class is column index 1: `p_QK(x)[:, 1]`.

### Why the quantum branch runs noisy in the Hybrid?

**Code location:** `main.py`, lines 197–201

```python
hybrid = HybridClassicalQuantumClassifier(
    num_qubits=experiment_config['pca_components'],
    noisy=True,
    error_prob=0.01   # fixed at 1% — representative NISQ error level
)
```

The Hybrid is always evaluated at 1% noise because:
1. It represents a **realistic deployment scenario** — what would happen if this ran on actual IBM hardware with ~1% gate error rates.
2. The whole point of the Hybrid design is to test whether the classical component can **compensate** for and stabilise noise-degraded quantum output.
3. A noiseless Hybrid would be trivially better and less scientifically interesting.

---

## Training: Two Independent Branches

```python
def fit(self, X, y):
    self.rf.fit(X, y)        # trains on PCA-scaled 4-feature vectors
    self.qk_svm.fit(X, y)    # computes quantum kernel matrix → trains SVM
    return self
```

Both branches receive the **same** pre-processed 4-feature PCA vectors as input. They are trained independently — there is no shared layer, no communication between them during training, and no iterative refinement.

Training cost breakdown:
- **RF**: milliseconds (200 trees on ≤140 samples is trivial)
- **QK-SVM**: dominant cost (computing the N_train × N_train quantum kernel matrix requires N_train² circuit evaluations × 2048 shots each)

At N=195 total (137 training), the QK-SVM branch requires ~137² ≈ 18,769 circuit evaluations.

---

## Fusion: Weighted Soft Voting

**Code location:** `quantum_models.py`, lines 151–160

```python
def predict_proba(self, X):
    p_rf = self.rf.predict_proba(X)      # shape (N_test, 2)
    p_qk = self.qk_svm.predict_proba(X) # shape (N_test, 2)
    return 0.70 * p_rf + 0.30 * p_qk

def predict(self, X):
    return np.argmax(self.predict_proba(X), axis=1)
```

The final probability estimate for each class is a **weighted average** of the two branches:

```
p_Hybrid(x) = 0.70 × p_RF(x) + 0.30 × p_QK(x)
```

The predicted class is `argmax(p_Hybrid)` — whichever class has the higher combined probability.

### Why 70% RF / 30% Quantum?

This is a deliberate, justified design choice:

| Rationale | Explanation |
|---|---|
| **RF is the stronger model** | RF consistently achieves higher base accuracy than QK-SVM across all dataset sizes in the benchmarks. It dominates the fusion because it should. |
| **RF is more stable** | RF's standard deviation across runs is lower. Giving it 70% weight prevents the quantum's higher variance from destabilising the combined output. |
| **30% quantum is enough for signal** | The quantum kernel captures feature correlations (x₁·x₂, x₂·x₃ etc.) that RF's rectangular splits miss. Even a 30% contribution of this signal can correct the RF's specific failure cases. |
| **30% limits noise damage** | At 1% gate error, the QK-SVM's probabilities are degraded by noise. Capping its weight at 30% prevents that noise from dragging down the much cleaner RF signal. |

An alternative formulation: the Hybrid is designed to be **at least as good as RF on RF's bad days**, and **slightly better than RF on average** by incorporating the quantum kernel's different inductive bias.

---

## Why the Two Models' Errors Are Partially Uncorrelated

This is the statistical justification for the Hybrid's design:

**Random Forest errors** occur when:
- A decision boundary cannot be expressed as rectangular axis-aligned splits in the PCA feature space
- The 4 PCA components are insufficient for a case near a split threshold

**Quantum Kernel SVM errors** occur when:
- Gate noise corrupts the kernel estimation for a specific training pair
- The quantum Hilbert space geometry does not separate the classes well for that specific data point
- The kernel matrix is slightly degenerate due to noise

Because these failure modes are mechanistically different, there will be samples where RF is wrong and QK-SVM is right, and vice versa. Averaging their probabilities tends to reduce the total error rate compared to either alone — provided the models are not making all the same mistakes.

> **Caveat**: The uncorrelated error argument is strongest when the two models are most architecturally different. RF (tree splits) and kernel SVM (margin in Hilbert space) are structurally very different, which supports this rationale.

---

## The Hybrid in the Experiment Pipeline

**Code location:** `main.py`, lines 192–232

The Hybrid is the 4th and final step in each (dataset size, run) loop iteration:

```
Loop iteration for each (run_id, size):
  Step 1: Classical models (SVM, LR, RF)
  Step 2: QK-SVM Noiseless
  Step 3: QK-SVM Noisy (5 noise levels sweeping 0%→5%)
  Step 4: Hybrid (RF + QK-SVM at fixed 1% noise)  ← this
```

The Hybrid's results are stored with:
- `Model = 'Hybrid (Classical+Quantum)'`
- `Noise Level = 0.01` (the quantum branch's noise level — the RF branch is noiseless)

The Hybrid is evaluated on exactly the same train/test splits as all other models in that loop iteration, ensuring a completely fair comparison.

---

## What the Hybrid Outputs

1. **`predict_proba(X)`** → shape `(N_test, 2)` — weighted-mixed class probabilities. Column 0 = healthy, Column 1 = Parkinson's.
2. **`predict(X)`** → shape `(N_test,)` — hard class labels derived from argmax of `predict_proba`.

These outputs go through the same `evaluate_model()` function as all other classifiers, producing:  
`Accuracy, Precision, Recall, F1-score, Sensitivity, Specificity, ROC-AUC, Train Accuracy, Generalization Gap`

For ROC-AUC and the ROC curve plots, the Hybrid uses `predict_proba(X_test)[:, 1]` — the weighted probability of Parkinson's — which benefits from the smooth probability calibration of both Platt-scaled SVC and RF's probability fraction.

---

## Parameter Summary for the Hybrid Model

| Parameter | Value | Explanation |
|---|---|---|
| **Classical branch** | RandomForestClassifier | n_estimators=200, random_state=42 |
| **Quantum branch** | QuantumKernelSVM | Same as standalone QK-SVM |
| **RF weight** | 0.70 (70%) | RF is stronger and more stable |
| **Quantum weight** | 0.30 (30%) | Enough signal, not enough to drown in noise |
| **Quantum noise level** | 1% (error_prob=0.01) | Realistic NISQ hardware level |
| **Fusion strategy** | Weighted soft vote | Averages calibrated probability outputs |
| **Training strategy** | Independent parallel | No shared parameters, no sequential dependency |
| **num_qubits** | 4 | Matches PCA components |
| **shots** | 2048 | Same as standalone QK-SVM |
| **Fixed noise** | Yes (always 1%) | Hybrid is not tested across the noise sweep |

---

## Theoretical Claim vs. Empirical Reality

**The claim:** By combining RF's noise-robust tree splits with the quantum kernel's Hilbert-space geometric signal, the Hybrid should outperform either component model alone.

**The empirical finding:** The Hybrid's performance relative to pure RF depends on dataset size:
- At small N (20–50): The quantum kernel provides sparse information. RF alone generalises better. The 30% quantum weight adds noise.
- At larger N (150–195): The quantum kernel has a denser training kernel matrix and more stable estimates. The Hybrid is most competitive here.

**The honest interpretation for a panel:** The Hybrid demonstrates a **principled ensemble design** based on model diversity theory. Whether it delivers a statistically significant improvement on this 195-sample dataset is an empirical question whose answer reflects the inherent difficulty of demonstrating quantum advantage in a 4-qubit simulation on a small classical dataset — not a flaw in the methodology.
