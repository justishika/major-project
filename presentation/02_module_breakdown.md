# Module Breakdown — What Every File Does

---

## `data_preprocessing.py` — The Data Pipe

**Job:** Fetch raw data, clean it, compress it, and prepare it for models.

- Uses `DATASET_CONFIG` to orchestrate 12 disease datasets, dynamically downloading from UCI, OpenML, or generating synthetic data.
- **Standardization**: Uses StandardScaler to normalize the data.
- **PCA**: Reduces features to 4 principal components to match the 4-qubit limitation.
- **Scaling to Angles**: Maps components to [-π, π] for quantum rotation gates.

## `classical_models.py` — The Classical Baselines

**Job:** Train and evaluate classical baselines.

- **SVM**: Support Vector Machine with an RBF kernel.
- **Logistic Regression**: Linear classifier.
- **Random Forest**: Ensemble of 100 decision trees.
- Returns accuracy, precision, recall, f1, and ROC-AUC metrics.

## `quantum_models.py` — The Quantum Engine

**Job:** Build and run the quantum classifier using Qiskit.

- **QuantumKernelSVM:** Uses `ZZFeatureMap` (reps=1, linear entanglement) to create a quantum kernel, evaluated using a simulated quantum backend, then passed to a classical SVM. Capable of simulating NISQ depolarizing noise.
- **HybridClassicalQuantumClassifier:** A sophisticated 3-layer stacking ensemble. It uses Random Forest, ExtraTrees, GradientBoosting, and an enhanced QK-SVM (full entanglement, C=10) as base learners. It generates meta-features (probabilities, confidence, entropy, pairwise disagreement) and aggregates them using a GradientBoosting meta-learner for robust, state-of-the-art predictions.

## `main.py` — The Orchestrator

**Job:** Run the entire experiment loop.

- Iterates over the 12 datasets configured in `DATASET_CONFIG`.
- Runs experiments across multiple dataset sizes and noise levels (0.0, 0.01, 0.05).
- Orchestrates model evaluation and saves metrics, datasets, and cross-disease global summaries.

## `visualization.py` — The Graph Generator

**Job:** Generates all output plots per disease and cross-disease global summaries. Uses `matplotlib` and `seaborn`.

## `dashboard/` — The Frontend UI

**Job:** A React application offering a professional, minimalist light mode interface inspired by Claude.
- Loads the generated JSON/CSV results and displays interactive visualizations.
- Provides an expanding graph interface and clean, distraction-free styling.
