# Testing Guide

This directory contains unit tests, integration tests, and diagnostic scripts for the Quantum ML Benchmark project.

## Quick Start

### **Important:** Change to Project Directory First

All test commands should be run from the `major-project` directory:

```bash
cd major-project
```

### Run All Tests

```bash
# Using unittest (built-in)
python -m unittest discover -s tests -p "test_*.py" -v

# Using pytest (if installed)
pytest tests/ -v
```

### Run Specific Test Suites

```bash
# Only preprocessing tests
python -m unittest tests.test_preprocessing -v

# Only model tests
python -m unittest tests.test_models -v

# Only integration tests
python -m unittest tests.test_integration -v
```

### **Alternative: Run from Parent Directory**

If you're in the parent directory (`proj-final-major`), use:

```bash
# Run tests from parent directory (PowerShell)
python -m unittest discover -s major-project/tests -p "test_*.py" -v

# Or run individual test file
python major-project/tests/test_preprocessing.py
python major-project/tests/test_models.py
python major-project/tests/test_integration.py
```

### Run Individual Test Classes

```bash
# Data preprocessing tests only
python -m unittest tests.test_preprocessing.TestDataPreprocessing -v

# All datasets loading
python -m unittest tests.test_preprocessing.TestAllDatasets -v

# Classical model tests
python -m unittest tests.test_models.TestClassicalModels -v
```

## Test Files Overview

| File | Purpose | Tests |
|------|---------|-------|
| `test_preprocessing.py` | Data loading, scaling, stratification | 20+ | 
| `test_models.py` | Classical model training, metrics | 10+ |
| `test_integration.py` | End-to-end pipeline, multi-dataset | 12+ |

## Expected Results

```
Ran 42 tests in ~15-30 seconds

OK ✓ (all tests pass)
```

**Note:** Quantum model tests may be skipped if Qiskit/GPU resources are unavailable—this is expected behavior.

## Diagnostic Scripts (Manual)

These files test specific components without formal assertions:

```bash
# Inspect quantum kernel matrix structure
python test_vqc.py

# Verify all datasets load correctly
python test_new_loaders.py
```

## Continuous Integration

To integrate into CI/CD (GitHub Actions, GitLab CI, etc.):

```yaml
- name: Run Tests
  run: |
    pip install pytest numpy scikit-learn pandas qiskit qiskit-aer
    python -m pytest tests/ -v --tb=short
```

## Troubleshooting

### Tests Hang or Timeout
- Quantum model tests can take 1-5 minutes; increase timeout or skip with `--timeout=600`
- Use small sample sizes in setUp() for faster iteration

### ImportError: No module named 'qiskit'
- Install dependencies: `pip install -r requirements.txt`

### AssertionError: Feature range invalid
- Check that `load_and_preprocess_data()` is applying MinMaxScaler to [-π, π]

## Coverage Report

To measure test coverage (requires `coverage` package):

```bash
pip install coverage
coverage run -m unittest discover -s tests -p "test_*.py"
coverage report -m
```

Expected target: **>80% code coverage** for core pipeline modules.
