# Module Breakdown — What Every File Does

---

## `data_preprocessing.py` — The Data Pipe

**Job:** Fetch raw data, clean it, compress it, and hand it to models in a usable format.

### Functions:

#### `_load_parkinsons_data()`
- Fetches the CSV directly from UCI ML Repository via URL
- Drops the `name` column (patient name, irrelevant) and uses `status` as the label (0=healthy, 1=Parkinson's)
- Returns raw feature matrix X (195 × 22) and label vector y (195,)

#### `load_and_preprocess_data(dataset_name, n_components=4, use_pca=True)`
This is the main preprocessing function. It does 3 things in sequence:

1. **StandardScaler**: Makes every feature have mean=0 and std=1.
   - *Why:* Features like MDVP frequency (250 Hz) and jitter (0.002) are on completely different scales. Without this, high-range features dominate the model.

2. **PCA → 4 components**:
   - Reduces the 22 raw voice features into 4 "principal components" — the 4 directions of maximum variance in the data
   - These 4 components typically capture ~85-90% of the total information
   - *Why 4:* The quantum circuit has exactly 4 qubits. Each qubit gets one input value encoded via a rotation gate. More qubits = exponentially more expensive to simulate.

3. **MinMaxScaler → [-π, π]**:
   - Maps all 4 PCA features to the range [-pi, pi]
   - *Why:* Quantum rotation gates (Rz, Rx) use angles. A value outside [-π, π] wraps around and produces identical quantum states as values inside the range. Scaling properly prevents this collision.

#### `get_stratified_subsample(X, y, sample_size, random_state=42)`
- Takes a subset of exactly `sample_size` samples
- Uses `StratifiedShuffleSplit` to maintain the 75%/25% class ratio even in small samples
- *Why stratify:* With only 20 samples, random selection could accidentally give you all Parkinson's cases and no healthy ones, making evaluation meaningless.

#### `prepare_train_test_split(X, y, test_size=0.3, random_state=42)`
- Standard 70/30 train-test split, stratified
- Uses a fixed random_state for reproducibility

---

## `classical_models.py` — The Classical Baselines

**Job:** Train and evaluate SVM, Logistic Regression, and Random Forest on the same preprocessed data.

### The 3 Models and Their Settings:

#### SVM (Support Vector Machine)
```
SVC(kernel='rbf', C=10, gamma='scale', probability=True, random_state=42)
```
- `kernel='rbf'`: Radial Basis Function — maps data into an infinite-dimensional space to find a non-linear decision boundary
- `C=10`: High regularization — allows the model to fit the training data quite tightly
- `gamma='scale'`: Automatically scales the kernel width based on feature variance
- `probability=True`: Needed to get probability scores for ROC-AUC computation

#### Logistic Regression
```
LogisticRegression(max_iter=500, C=1.0, random_state=42)
```
- A linear classifier — finds a straight-line decision boundary in the PCA-reduced 4D feature space
- `C=1.0`: Moderate regularization
- Acts as the "simple baseline" — if even a linear model can do well, the problem isn't hard

#### Random Forest
```
RandomForestClassifier(n_estimators=100, max_depth=None, random_state=42)
```
- 100 decision trees trained on random subsets of data and features
- Each tree votes; majority wins
- `max_depth=None`: Trees grow until leaves are pure — can overfit on small data

### `evaluate_model(y_true, y_pred, y_prob=None)`
Computes the following from predictions:
- **Accuracy**: (TP + TN) / total
- **Precision**: TP / (TP + FP) — of all predicted Parkinson's, how many actually have it
- **Recall / Sensitivity**: TP / (TP + FN) — of all actual Parkinson's, how many did we catch
- **F1-score**: Harmonic mean of Precision and Recall
- **Specificity**: TN / (TN + FP) — of all healthy people, how many did we correctly clear
- **ROC-AUC**: Area under the ROC curve from probability scores
- **Train Accuracy**: Trained on training data — if this >> Test Accuracy, the model is overfitting
- **Generalization Gap**: Train Accuracy - Test Accuracy (positive = overfitting)

---

## `quantum_models.py` — The Quantum Engine

**Job:** Build and run the quantum classifier using Qiskit. This is the core of the project.

### `create_noise_model(error_prob=0.01)`
Creates a simulated noise model mimicking real IBM quantum hardware:
- **1-qubit depolarizing error** applied to gates: X, SX (√X), Rz
- **2-qubit depolarizing error** applied to gates: CX (CNOT)
- Depolarizing error means: with probability `error_prob`, apply a random Pauli error (X, Y, or Z flip) to the qubit

At `error_prob = 0.01` (1%), every single gate has a 1% chance of silently flipping your qubit. Over a 4-qubit circuit with many gates, errors compound.

### `QuantumKernelSVM` — The Core Quantum Model
This is what's actually running. It is **NOT a Variational Quantum Classifier** (despite the function name `get_vqc` — that's a naming legacy). It is a **Quantum Kernel SVM**. Here's the difference and why it matters:

**What it actually is:**
- The `ZZFeatureMap` quantum circuit encodes each data point X into a quantum state |ψ(X)⟩
- The **quantum kernel** K(X_i, X_j) = |⟨ψ(X_i)|ψ(X_j)⟩|² measures the "quantum similarity" between any two data points
- A classical SVM then uses this kernel matrix to find the best decision boundary

**The ZZFeatureMap:**
- A Qiskit circuit that encodes `n` features into `n` qubits using Hadamard gates (superposition) and ZZ-entangling operations (two-qubit interactions that encode pairwise feature products)
- `reps=1`: The circuit runs ONE layer of these operations
  - *Why reps=1, not 2:* More repetitions → more gates → more noise compounding → the kernel matrix becomes nearly uniform (all values ≈ 1), and the SVM defaults to predicting the majority class every time. reps=1 is shallower and gives reliable kernel estimates.
- `entanglement='linear'`: Qubits entangle in a chain: 0-1, 1-2, 2-3 (not all-to-all)

**Configuration:**
```python
QuantumKernelSVM(num_qubits=4, noisy=False/True, error_prob=0.01, shots=2048)
```
- `shots=2048`: Each kernel entry K(X_i, X_j) is estimated by running the circuit 2048 times and averaging. Standard error ≈ 1/√2048 ≈ 0.022.
- `SVC(kernel='precomputed', C=1.0)`: Takes the pre-computed quantum kernel matrix directly.

### `HybridClassicalQuantumClassifier` — The Best Model
Combines two classifiers via soft-voting:

```
Hybrid prediction = 0.70 × RF_probability + 0.30 × QuantumKernel_probability
```

- **Random Forest (200 trees)**: Provides a strong, stable classical base prediction
- **Quantum Kernel SVM**: Provides complementary signal from quantum feature space
- **70/30 split**: RF dominates because it's more reliable; QK-SVM adds the quantum "lens" as a supplement
- **Why this works**: RF and QK-SVM make errors from completely different reasoning. When RF is wrong, QK-SVM is often right, and their combined probability stays on the correct side of 0.5 more often than either alone.

---

## `visualization.py` — The Graphs

**Job:** Generate all output plots from the results DataFrame. See the Graphs Guide for full details on each graph.

### Functions:
| Function | Graph Produced |
|---|---|
| `plot_accuracy_vs_size()` | Line plot: accuracy vs. dataset size per model |
| `plot_model_stability()` | Bar chart with std-dev error bars |
| `plot_noise_sensitivity()` | VQC accuracy vs. noise level (with classical baseline) |
| `plot_precision_recall_tradeoff()` | PR curve for all models at full dataset size |
| `plot_roc_curve()` | ROC curve with AUC values |
| `plot_overfitting_behavior()` | Train vs. Test accuracy per model per size |
| `plot_confusion_matrices()` | Heatmap grid: TP, FP, FN, TN for each model |
| `plot_all_individual_metrics()` | Separate line plots for Precision, Recall, F1, Sensitivity, Specificity, ROC-AUC, Runtime, Generalization Gap |

---

## `main.py` — The Orchestrator

**Job:** Run the entire experiment loop and call all the above modules.

### Experiment Loop Structure:
```
For each dataset (just Parkinson's):
  Load + preprocess (PCA, scale)
  For run_id in [0, 1, 2]:  ← 3 repeated runs
    For size in [20, 50, 100, 150, 195]:  ← 5 dataset sizes
      Subsample to that size
      Train/test split
      Run classical models
      Run VQC Noiseless
      For noise_level in [0.0, 0.005, 0.01, 0.02, 0.05]:  ← 5 noise levels
        Run VQC Noisy
      Run Hybrid model
      Record all metrics
After loop: save CSVs, generate all graphs
```

**Total configurations:** 3 runs × 5 sizes × (3 classical + 1 noiseless + 5 noisy + 1 hybrid) = **3 × 5 × 10 = 150 model evaluations**

---

## `requirements.txt` — Dependencies

Key packages:
- `qiskit`: Quantum circuit building and simulation framework (IBM)
- `qiskit-aer`: High-performance quantum simulator with noise model support
- `qiskit-machine-learning`: Quantum kernel and QNN implementations
- `scikit-learn`: Classical ML models, PCA, StandardScaler, metrics
- `pandas`, `numpy`: Data handling
- `matplotlib`, `seaborn`: Visualization
