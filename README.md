# Quantum Machine Learning Benchmark for Parkinson's Disease Detection

## Overview

This project is a research-oriented benchmarking pipeline designed to compare the performance of **Classical Machine Learning Models** against a **Variational Quantum Classifier (VQC)** for the detection of Parkinson's disease.

The pipeline automatically fetches the Parkinson's Disease dataset from the UCI Machine Learning Repository, preprocesses the data (including dimensionality reduction via PCA to map features to a 4-qubit quantum simulation), and evaluates the models across different dataset sizes to identify performance trends in small-data regimes. The quantum simulation also incorporates realistic quantum noise models.

## Key Features
*   **Dynamic Data Fetching:** Directly pulls the latest dataset from UCI.
*   **Dimensionality Reduction:** Uses PCA to condense over 20 voice-measurement features down to 4 principle components, perfectly matching our 4-qubit quantum circuit limitations.
*   **Stratified Sampling:** Evaluates model performance across incremental dataset sizes (e.g., 50, 100, 150 samples) to observe how Quantum vs. Classical models fare with limited data.
*   **Classical Models baseline:** Evaluates Standard Support Vector Machine (SVM), Logistic Regression, and Random Forest.
*   **Quantum Simulation:** Implements a Variational Quantum Classifier (VQC) with simulated IBM Qiskit Aer noise models to closely map real-world quantum hardware behavior.
*   **Automated Visualization:** Automatically generates comprehensive performance plots and CSV benchmarks.

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
Once the script has finished executing, it will generate three files in your project directory:
*   `benchmark_results.csv` - A raw spreadsheet of all models, their training size, and their accuracy/error metrics.
*   `accuracy_vs_size.png` - A plotted graph comparing the Accuracy of Quantum vs. Classical models as data size increases.
*   `f1_score_vs_size.png` - A plotted graph comparing the F1 Score of Quantum vs. Classical models as data size increases.
