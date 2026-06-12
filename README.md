# Hybrid Classical-Quantum Benchmark for Multi-Disease Classification

## Overview

**Noise-Aware Quantum Kernel SVM with Hybrid Stacking Ensemble across 12 Clinical Disease Datasets**

This project is a systematic research study that benchmarks a **Hybrid Classical-Quantum machine learning pipeline** against classical baselines across 12 clinically diverse disease datasets. The pipeline evaluates whether quantum kernel methods and hybrid stacking ensembles can outperform classical approaches — particularly in small-data healthcare scenarios under realistic noise conditions.

### Research Motivation
- **Problem:** Healthcare datasets are often small due to privacy restrictions and rare disease prevalence. Classical ML typically requires sufficient labeled data.
- **Hypothesis:** Quantum kernel feature maps (ZZFeatureMap) embed classical data into exponentially large Hilbert spaces, potentially allowing richer geometric representations even with limited samples.
- **Challenge:** Real NISQ hardware has 1–5% depolarizing error rates. This study characterizes how quantum models degrade under noise compared to classical approaches.
- **Goal:** Experimentally demonstrate that a learned stacking Hybrid (RF + ExtraTrees + GradientBoosting + QK-SVM) consistently outperforms any single classical or quantum model, validated across 12 diverse disease datasets.

---

## Models Benchmarked

| Model | Type | Description |
|-------|------|-------------|
| **Logistic Regression** | Classical | Linear probabilistic classifier |
| **SVM** | Classical | Support Vector Machine with RBF kernel |
| **Random Forest** | Classical | 400-tree bagging ensemble |
| **QK-SVM (Noiseless)** | Quantum | Quantum Kernel SVM using ZZFeatureMap (reps=1, C=1, linear entanglement) |
| **QK-SVM (Noisy)** | Quantum | Same as above with depolarizing noise injection (p=0.01) |
| **Hybrid (Classical+Quantum)** | Hybrid | 4-base-learner stacking: RF + ExtraTrees + GradientBoosting + QK-SVM (C=10, full entanglement), with a GradientBoosting meta-learner on 22 enriched meta-features |

---

## Diseases Integrated (12 Total)

| # | Key | Display Name | Source | Task |
|---|-----|-------------|--------|------|
| 1 | `parkinsons` | Parkinson's Disease | UCI (remote CSV) | Parkinson's vs healthy |
| 2 | `breast_cancer` | Breast Cancer | sklearn built-in | Malignant vs benign |
| 3 | `hepatitis_c` | Hepatitis C (HCV Serology) | OpenML `hepatitis` | DIE vs LIVE prognosis |
| 4 | `heart_disease` | Heart Disease (Cleveland) | OpenML `heart-statlog` | Present vs absent |
| 5 | `mammographic_mass` | Mammographic Mass Assessment | OpenML `mammographic-mass` | Benign vs malignant |
| 6 | `thyroid_disease` | Thyroid Disease (Sick Euthyroid) | OpenML `sick` | Sick vs normal |
| 7 | `indian_liver` | Indian Liver Patient (ILPD) | OpenML `ilpd` | Patient vs non-patient |
| 8 | `chronic_kidney` | Chronic Kidney Disease | OpenML `chronic-kidney-disease` | CKD vs not-CKD |
| 9 | `wilsons_disease` | Wilson's Disease (Synthetic) | Synthetic (clinical priors) | Patient vs control |
| 10 | `als` | ALS (Synthetic) | Synthetic (El Escorial criteria) | ALS vs mimic |
| 11 | `acute_nephritis` | Acute Nephritis | UCI Acute Inflammations | Positive vs negative |
| 12 | `heart_failure` | Heart Failure Clinical Records | UCI Heart Failure | Death event prediction |

---

## Prerequisites

- Python 3.8 to 3.11 (Recommended: 3.10)
- Windows (PowerShell) / Linux / macOS

---

## Installation & Setup

### 1. Navigate to the project folder
```powershell
cd "path\to\major project"
```

### 2. Activate the Virtual Environment

On Windows (PowerShell) — run this once to allow script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
*If prompted, type `Y` and press Enter.*

Then activate:
```powershell
.\venv\Scripts\Activate.ps1
```
*(You should see `(venv)` at the start of your terminal line.)*

On Linux / macOS:
```bash
source venv/bin/activate
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

---

## How to Run

### Run all 12 diseases (full pipeline)
```powershell
python main.py
```
This runs every disease sequentially, saves all per-disease graphs, summary CSVs, and generates the cross-disease comparison chart.

---

### Run a single disease independently
Use the `--disease` (or `-d`) flag with any disease key:

```powershell
# Examples
python main.py --disease parkinsons
python main.py --disease breast_cancer
python main.py --disease hepatitis_c
python main.py --disease heart_disease
python main.py --disease mammographic_mass
python main.py --disease thyroid_disease
python main.py --disease indian_liver
python main.py --disease chronic_kidney
python main.py --disease wilsons_disease
python main.py --disease als
python main.py --disease acute_nephritis
python main.py --disease heart_failure

# Short form
python main.py -d parkinsons
python main.py -d als
```

Single-disease mode:
- Saves all graphs to `results/graphs/<disease_name>/`
- Saves per-disease summary to `results/data/summary_<disease_name>.csv`
- Updates `results/data/benchmark_results.csv` non-destructively (replaces only that disease's rows)

---

### View available options
```powershell
python main.py --help
```

---

> ⚠️ **Runtime Warning:** The QK-SVM quantum kernel simulation is computationally intensive — it evaluates an `n×n` kernel matrix using 1024 circuit shots per entry. For the full 12-disease run, expect **45–75 minutes** depending on CPU speed. Running a single small disease (e.g., `hepatitis_c`, `parkinsons`) takes **5–15 minutes**.

---

## Project Structure

```
major project/
├── main.py                  # Entry point — runs the full benchmark or a single disease
├── data_preprocessing.py    # Dataset loaders (12 diseases), PCA, scaling, train/test split
├── classical_models.py      # Logistic Regression, SVM, Random Forest training & evaluation
├── quantum_models.py        # QK-SVM (noiseless/noisy) and HybridClassicalQuantumClassifier
├── visualization.py         # All graph generation functions (10+ chart types)
├── regenerate_graphs.py     # Re-plot graphs from an existing benchmark_results.csv
├── regenerate_curves.py     # Re-plot ROC/PR curves from saved data
├── requirements.txt         # Python dependencies
└── results/
    ├── data/
    │   ├── benchmark_results.csv           # Raw results — all models, diseases, sizes, noise levels
    │   ├── benchmark_results_summary.csv   # Aggregated mean ± std accuracy
    │   └── summary_<disease>.csv           # Per-disease accuracy summary
    └── graphs/
        ├── cross_disease_summary.png       # Cross-disease comparison bar chart
        └── <disease_name>/                 # Per-disease graph subfolder (one per disease)
            ├── accuracy_vs_size_*.png
            ├── model_stability_*.png
            ├── noise_sensitivity_*.png
            ├── precision_recall_curve_*.png
            ├── roc_curve_*.png
            ├── overfitting_behavior_*.png
            ├── confusion_matrix_*_<Model>.png
            ├── metric_heatmap_*.png
            └── <metric>_vs_size_*.png      # F1, Precision, Recall, ROC-AUC, etc.
```

---

## Outputs & Results

After running, the following are generated per disease:

**Data Files** (in `results/data/`):
- `benchmark_results.csv` — Raw results for all models, dataset sizes, noise levels
- `benchmark_results_summary.csv` — Mean ± std accuracy across all diseases
- `summary_<disease>.csv` — Per-disease accuracy summary

**Visualizations** (in `results/graphs/<disease>/`):
1. `accuracy_vs_size_*.png` — Accuracy trend as dataset size grows
2. `model_stability_*.png` — Bar chart with error bars (std deviation) showing consistency
3. `noise_sensitivity_*.png` — QK-SVM accuracy degradation across noise levels vs SVM baseline
4. `precision_recall_curve_*.png` — Precision-Recall tradeoff (critical for medical diagnosis)
5. `roc_curve_*.png` — ROC-AUC comparison across all models
6. `overfitting_behavior_*.png` — Train vs. Test accuracy (generalization gap)
7. `confusion_matrix_*_<Model>.png` — Confusion matrix per model
8. `metric_heatmap_*.png` — Heatmap of all metrics at maximum dataset size
9. Individual metric plots — F1, Precision, Recall, ROC-AUC, Sensitivity, Specificity vs. size

**Cross-Disease** (in `results/graphs/`):
- `cross_disease_summary.png` — Grouped bar chart comparing all models across all 12 diseases

---

## Key Research Findings

- The **Hybrid stacking ensemble** (RF + ExtraTrees + GB + QK-SVM meta-learned) consistently outperforms every individual classical or quantum model.
- **QK-SVM (Noiseless)** shows competitive accuracy at small dataset sizes but degrades under noise (p ≥ 0.02).
- **Error decorrelation** between tree-based (bagging), sequential (boosting), and kernel-based (quantum) base learners is the primary mechanism enabling hybrid superiority.
- **Quantum kernel degeneracy** (near-identical kernel matrix entries) is the main bottleneck at small sample sizes and high noise.
