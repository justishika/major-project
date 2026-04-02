# Quantum Machine Learning Benchmark for Parkinson's Disease Detection

## Overview

**Experimental Study of Noise-Aware Variational Quantum Classifiers for Small-Data Parkinson's Detection**

This project is a systematic research study—**not a demonstration of quantum superiority**—that investigates whether Variational Quantum Classifiers (VQCs) exhibit different generalization behavior compared to classical models in small-data healthcare scenarios under realistic noise conditions.

### Research Motivation
- **Problem:** Healthcare datasets are often extremely small due to privacy restrictions. Classical ML typically requires sufficient labeled data.
- **Hypothesis:** Quantum feature maps embed classical data into exponentially large Hilbert spaces, potentially allowing richer representations even with limited samples.
- **Challenge:** Most QML literature evaluates under ideal (noise-free) simulations. Real NISQ hardware has 1-5% error rates.
- **Goal:** Experimentally characterize how quantum models behave in small-data regimes when subjected to realistic noise—and whether they generalize differently than classical approaches.

The pipeline automatically fetches datasets (Parkinson's Disease, Breast Cancer) from UCI, applies PCA dimensionality reduction to match 4-qubit constraints, and compares:
- **Classical Baselines:** Logistic Regression, SVM, Random Forest, Small Neural Network
- **Quantum Models:** VQC (Noiseless), VQC (Noisy with varying error rates), Hybrid Classical-Quantum Model
- **Across:** 3 dataset sizes (20, 50, 100 samples) and 5 noise levels (0%, 0.5%, 1%, 2%, 5%)
- **Primary Metrics:** Accuracy, Variance (stability), Generalization Gap (overfitting), Sensitivity to noise

## Key Features

- **Multi-Model Comparison:** Classical (LR, SVM, RF, Small NN) vs. Quantum (VQC) vs. Hybrid (Classical-Quantum).
- **Small-Data Focus:** Stratified sampling at 20, 50, 100 samples—typical of healthcare settings.
- **Stability Analysis:** Repeated runs (5–10 times) to measure variance, generalization gap, and consistency.
- **Realistic Noise Simulation:** Tests VQC performance across 0%, 0.5%, 1%, 2%, 5% error rates using IBM Qiskit depolarizing error models.
- **Generalization Bounds Insight:** Evaluates whether quantum feature spaces provide more stable representations than classical approaches when data is scarce.
- **Hybrid Model:** Classical preprocessing + Quantum classification to test if dimensionality reduction mitigates quantum noise sensitivity.
- **Multi-Dataset Evaluation:** Parkinson's Disease and Breast Cancer datasets for generalizability.
- **Comprehensive Metrics:** Accuracy, Precision, Recall, F1, ROC-AUC, Sensitivity, Specificity, Confusion Matrices, Generalization Gap.
- **Six Core Visualizations:** Accuracy vs. Size, Stability (error bars), Noise Sensitivity, Precision-Recall, ROC Curves, Train vs. Test (Overfitting).

## Prerequisites
*   Python 3.8 to 3.11 (Recommended)
*   Windows (PowerShell) / Linux / macOS

## Installation & Setup

1. **Clone or Download the Project.** Make sure you are in the project's root folder:
   ```powershell
   cd new-folder-name
   ```

2. **Activate the Virtual Environment**
   This project uses a virtual environment `venv` to manage its specific package versions. 
   
   If you are on Windows using PowerShell, you need to execute this first to prevent security errors:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   *If prompted, type `Y` and press Enter.*

   Then, activate the environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   *(You should see `(venv)` appear at the start of your terminal line once successfully activated).*

3. **Install Dependencies**
   If you have not installed the required Python packages yet, install them via:
   ```powershell
   pip install -r requirements.txt
   ```

## How to Run

With your virtual environment activated, you can execute the entire pipeline with a single command:

```powershell
python main.py
```

The script will:
1. Download and preprocess the dataset.
2. Begin splitting the data and training the classical models.
3. Build and train the noisy Quantum VQC circuit.
4. Calculate standard ML metrics (Accuracy, Precision, Recall, F1, ROC-AUC).
5. Output the results locally.

**Warning:** The Quantum simulation is extremely computationally heavy. The script may take several minutes to finish depending on your computer's CPU speed. 

## Project Structure

*   `main.py` - The entry point. Handles the main loop across different dataset sample sizes.
*   `data_preprocessing.py` - Fetches the UCI dataset, normalizes it, handles the PCA downscaling, and prepares train/test splits.
*   `classical_models.py` - Contains the definitions and training functions for SVM, Logistic Regression, and Random Forest.
*   `quantum_models.py` - Defines the Qiskit Quantum Circuit, the VQC architecture, and the simulated noise models based on real IBM hardware parameters.
*   `visualization.py` - Generates performance plots from the resulting data.
*   `requirements.txt` - Lists all necessary Python dependencies (`qiskit`, `pandas`, `scikit-learn`, `matplotlib`, etc.)

## Outputs & Results
Once the script has finished executing, it will generate:

**Data Files:**
- `benchmark_results.csv` — Raw results for all models, seeds, datasets, sizes, and noise levels.
- `benchmark_results_summary.csv` — Aggregated mean ± std accuracy across runs.

**Visualizations (6 Core Graphs):**
1. `accuracy_vs_size_*.png` — Mean accuracy trend across dataset sizes.
2. `model_stability_*.png` — Bar chart with error bars (std deviation) showing consistency.
3. `noise_sensitivity_*.png` — Accuracy degradation as noise increases (VQC vs. classical baseline).
4. `precision_recall_curve_*.png` — Healthcare-critical: minimize false negatives.
5. `roc_curve_*.png` — Area Under Curve (AUC) comparison across models.
6. `overfitting_behavior_*.png` — Train vs. Test accuracy to detect generalization issues.
7. `confusion_matrix_*.png` — True positives, false negatives for each model (medical decision-making).

**Key Findings:**
- Whether quantum models show higher or lower variance than classical approaches.
- How noise levels (1-5%) affect quantum vs. classical generalization.
- Whether hybrid models (classical preprocessing + quantum) mitigate noise sensitivity.
- Which approach provides more stable, trustworthy predictions in healthcare settings.
