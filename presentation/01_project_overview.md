# Project Overview — What's Going On and Why

## Title
**Experimental Study of Hybrid Classical-Quantum Machine Learning for Small-Data Healthcare Scenarios**

Unified Disease Benchmarking: Quantum vs. Classical Machine Learning

---

## The Core Problem You're Solving

Early and accurate disease detection is critical for patient survival. However, machine learning in healthcare faces a persistent challenge:
- Medical datasets are often **tiny** — diseases like Hepatitis C or rare conditions may only have 15 to 200 patient records available due to privacy laws and collection costs.
- Classical ML (SVM, Neural Networks) overfits and loses reliability when trained on such small datasets.

**The question this project asks:** Can Quantum Machine Learning (QML) — specifically Quantum Kernel methods combined with Classical Meta-Learning — provide more robust generalization in small-data scenarios?

---

## The Hypothesis

Quantum computers encode data into a **Hilbert space** (a mathematical space that grows exponentially with the number of qubits). The hypothesis is:
> "Quantum feature maps might represent data structures more richly than classical approaches. When combined with classical ensemble methods, this can create a Hybrid model that leverages both classical stability and quantum feature interactions, outperforming pure classical baselines."

---

## Datasets Used

This pipeline evaluates models across **12 distinct clinical disease datasets** to ensure robust benchmarking rather than cherry-picked success on a single dataset:
1. Parkinson's Disease
2. Breast Cancer
3. Hepatitis C
4. Heart Disease
5. Mammographic Mass
6. Thyroid Disease
7. Indian Liver Patient
8. Chronic Kidney Disease
9. Wilson's Disease (Synthetic)
10. ALS (Synthetic)
11. Acute Nephritis
12. Heart Failure

---

## What the Pipeline Does — Step by Step

### Step 1: Data Preprocessing
- Downloads dataset from UCI/OpenML.
- **StandardScaler**: Normalizes features.
- **PCA**: Reduces feature dimensions to **4 components** (matching the 4-qubit quantum circuit limit).
- **MinMaxScaler**: Scales PCA components to [-π, π] for quantum rotation gates.
- **Stratified Subsampling**: Scales datasets to various small sizes (e.g., 20, 50, 100, 200) to test "small data" scenarios.

### Step 2: Classical Models Baseline
Trains and evaluates classical baselines:
- **SVM**
- **Logistic Regression**
- **Random Forest**

### Step 3: Quantum Kernel SVM (Noiseless and Noisy)
Runs a pure Quantum Kernel SVM baseline on both a perfect simulated quantum environment and a noisy simulated environment (using real IBM hardware error rates like 0.01 and 0.05).

### Step 4: Hybrid Classical-Quantum Stacking Ensemble
Combines four base learners:
1. Random Forest
2. ExtraTrees
3. Gradient Boosting
4. Quantum Kernel SVM (Full entanglement, C=10)
A GradientBoosting meta-learner combines these into a single highly accurate and robust prediction using engineered meta-features (confidence, entropy, disagreement).

### Step 5: Dashboard and Visualizations
Generates a suite of visualizations (Accuracy vs Size, Model Stability, Noise Sensitivity, ROC, etc.) and displays them in a modern, Claude-inspired React dashboard.

---

## The Expected Finding
1. **Quantum models alone have higher variance** and degrade faster with noise.
2. **The Hybrid model mitigates this** — it consistently outperforms individual classical or quantum baselines by leveraging their decorrelated errors and the rich interaction space in the ensemble.
