# Project Overview — What's Going On and Why

## Title
**Experimental Study of Noise-Aware Variational Quantum Classifiers for Small-Data Healthcare Scenarios**

Parkinson's Disease Detection: Quantum vs. Classical Machine Learning

---

## The Core Problem You're Solving

Parkinson's Disease (PD) is a progressive neurological disorder. Early, accurate detection saves lives. The challenge:

- Medical datasets for PD are **tiny** — the UCI dataset used here has only 195 patient records.
- Privacy laws, limited patients, and cost of data collection keep healthcare data small.
- Classical ML (SVM, Neural Networks etc.) works fine with large data, but with ~50-200 samples it becomes unreliable and overfit.

**The question this project asks:** Can Quantum Machine Learning do something useful that classical models can't, specifically in this tiny-data, real-world-noise scenario?

---

## The Hypothesis

Quantum computers encode data into a **Hilbert space** (a mathematical space that grows exponentially with the number of qubits). The idea is:

> "Even with 50 patient records, quantum feature maps might represent the data structure more richly than classical approaches — potentially improving generalization."

This is the theoretical promise. This project **tests it empirically** against realistic noise conditions.

---

## What This Project Is NOT

> **This project is NOT trying to prove quantum beats classical.**

The research goal is explicitly to **characterize quantum behavior in realistic conditions**. This is a valid, publishable contribution because:

- Most QML papers test on noise-free simulators. Real quantum hardware has 1-5% error rates.
- Nobody has systematically studied quantum model stability (variance, generalization gap) in small-data healthcare settings.
- The honest finding ("quantum is currently fragile") is *just as scientifically important* as "quantum wins."

---

## Dataset Used

**UCI Parkinson's Disease Dataset**
- **195 samples** (patients)
- **22 biomedical voice measurement features** (MDVP frequency, jitter, shimmer, NHR, HNR, RPDE, DFA, PPE, etc. — voice tremor measurements)
- **Binary label:** `status` = 1 (has Parkinson's), 0 (healthy)
- **Class imbalance:** ~75% Parkinson's positive (147 out of 195)

The dataset is pulled automatically from the UCI ML Repository at: `https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data`

---

## What the Pipeline Does — Step by Step

### Step 1: Data Preprocessing (`data_preprocessing.py`)
1. Downloads the Parkinson's dataset from UCI
2. **StandardScaler**: Normalizes all 22 features to zero mean, unit variance (removes scale bias)
3. **PCA (Principal Component Analysis)**: Reduces 22 features → **4 components**
   - This is forced by hardware: the quantum circuit has 4 qubits, so it can only process 4 inputs
   - The 4 PCA components capture ~85-90% of the total data variance
4. **MinMaxScaler**: Rescales features to [-π, π] range so they can be fed into quantum rotation gates
5. **Stratified Subsampling**: Pulls subsets of 20, 50, 100, 150, 195 samples while maintaining the class ratio
6. **Train/Test Split**: 70% train, 30% test, stratified

### Step 2: Classical Models (`classical_models.py`)
Trains and evaluates 3 classical baselines on the same data:
- **SVM** (RBF kernel, C=10, gamma=scale)
- **Logistic Regression** (L2, max_iter=500)
- **Random Forest** (100 trees)

### Step 3: Quantum Kernel SVM — Noiseless (`quantum_models.py`)
Runs the quantum model without any hardware noise to get a clean baseline.

### Step 4: Quantum Kernel SVM — Noisy (5 noise levels)
Runs the same quantum model with simulated IBM hardware noise at error levels: **0%, 0.5%, 1%, 2%, 5%**

### Step 5: Hybrid Model
Runs a combined classifier: **Random Forest (70%) + Quantum Kernel SVM (30%)** soft-voted.

### Step 6: Everything Repeated 3 Times
Each configuration runs 3 times with different random seeds to measure statistical stability.

### Step 7: Visualization (`visualization.py`)
Generates all the graphs and saves CSVs.

---

## The 6 Models Being Compared

| Model | Type | Description |
|---|---|---|
| SVM | Classical | Support Vector Machine, RBF kernel |
| Logistic Regression | Classical | Linear classifier |
| Random Forest | Classical | 100 decision trees, ensemble |
| VQC (Noiseless) | Quantum | Quantum Kernel SVM, ideal simulator |
| VQC (Noisy) | Quantum | Same, but with IBM-like hardware errors |
| Hybrid (Classical+Quantum) | Hybrid | RF 70% + Quantum Kernel SVM 30%, soft-voted |

---

## The Key Configuration Numbers

| Parameter | Value | Why |
|---|---|---|
| Dataset sizes tested | 20, 50, 100, 150, 195 | Range of "small data" scenarios |
| Noise levels | 0%, 0.5%, 1%, 2%, 5% | Range of realistic NISQ hardware error rates |
| Repeated runs | 3 | Measure statistical variance |
| PCA components | 4 | Matches 4-qubit quantum circuit |
| Train/Test split | 70/30 | Standard, stratified |
| Quantum shots | 2048 | Statistical estimates per kernel entry (std error ~0.02) |
| Circuit repetitions (reps) | 1 | Shallow circuit = less noise accumulation per shot |

---

## Why This Matters for Healthcare Specifically

In medical diagnosis, two things are critical:
- **Sensitivity (Recall)**: Don't miss sick patients. A false negative = you tell a Parkinson's patient they're healthy. That's dangerous.
- **Specificity**: Don't alarm healthy patients unnecessarily.

The project tracks both, not just overall accuracy. This makes the results actionable from a clinical perspective.

---

## The Expected Finding (What the Code Is Designed to Show)

The design deliberately exposes three things:
1. **Quantum models have higher variance** — they're less consistent run-to-run, especially with small data
2. **Quantum models degrade faster with noise** — at 1-2% noise, their accuracy drops sharply; classical models are nearly immune
3. **The Hybrid model partially mitigates this** — combining RF's stability with the quantum signal provides a better outcome than pure quantum

These findings guide future QML research toward solving the fragility problem before quantum models can be trusted in clinical settings.
