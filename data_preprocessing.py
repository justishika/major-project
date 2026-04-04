import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.datasets import load_breast_cancer

# ─────────────────────────────────────────────────────────────────────────────
# DATA PREPROCESSING PIPELINE
# Responsible for: loading, cleaning, scaling, and splitting the dataset
# before it is passed to any ML model.
# ─────────────────────────────────────────────────────────────────────────────

# Public link to the UCI Parkinson's Disease dataset (195 patient records)
URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data'


def _load_parkinsons_data():
    # Download CSV from UCI, drop the patient name column (not a feature),
    # and separate the 22 voice-measurement features from the binary label.
    df = pd.read_csv(URL)
    X = df.drop(columns=['name', 'status']).values  # features: 22 voice measurements
    y = df['status'].values                          # label: 1 = Parkinson's, 0 = healthy
    return X, y


def _load_breast_cancer_data():
    # Alternative dataset (sklearn built-in) for testing/comparison.
    data = load_breast_cancer()
    X = data.data
    y = data.target
    return X, y


def _dataset_loader(dataset_name):
    # Route to the correct loader based on the dataset name string.
    dataset_name = dataset_name.lower()
    if dataset_name == 'parkinsons':
        return _load_parkinsons_data()
    if dataset_name == 'breast_cancer':
        return _load_breast_cancer_data()
    raise ValueError(f"Unsupported dataset_name: {dataset_name}")


def load_and_preprocess_data(dataset_name='parkinsons', n_components=4, use_pca=True):
    """
    Full preprocessing pipeline:
      1. Load raw data
      2. StandardScaler  → zero mean, unit variance (removes scale bias between features)
      3. PCA             → compress 22 features down to 4 (matches the 4-qubit circuit)
      4. MinMaxScaler    → rescale into [-π, π] so values can be fed into quantum rotation gates
    """
    print(f"Loading dataset: {dataset_name}")
    X, y = _dataset_loader(dataset_name)

    # Step 1: Normalize — each feature has mean=0 and std=1 after this.
    # Without this, features with large ranges (e.g. Hz values) would dominate.
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Track PCA configuration so we can log it in results.
    pca_info = {
        'used': use_pca,
        'n_components': n_components,
        'explained_variance_ratio': None,
        'total_explained_variance': None,
    }

    if use_pca:
        # Step 2: Dimensionality reduction — 22 features → 4 principal components.
        # The quantum circuit only has 4 qubits, so it can only accept 4 inputs.
        # The 4 components typically capture ~85-90% of total variance.
        pca = PCA(n_components=n_components)
        X_proc = pca.fit_transform(X_scaled)
        pca_info['explained_variance_ratio'] = pca.explained_variance_ratio_.tolist()
        pca_info['total_explained_variance'] = float(np.sum(pca.explained_variance_ratio_))
    else:
        X_proc = X_scaled  # skip PCA if not needed

    # Step 3: Rescale into [-π, π] — quantum rotation gates (Rx, Ry, Rz) expect
    # angles as input. Values outside this range can cause wrap-around aliasing.
    from sklearn.preprocessing import MinMaxScaler
    scaler_pi = MinMaxScaler(feature_range=(-np.pi, np.pi))
    X_proc = scaler_pi.fit_transform(X_proc)

    return X_proc, y, pca_info


def get_stratified_subsample(X, y, sample_size, random_state=42):
    """
    Returns a random subset of the data with the original class ratio preserved.
    Used to simulate the 'small data' regimes: 20, 50, 100, 150 samples.
    Stratified = we keep the same ~75% Parkinson's / 25% healthy split in every subset.
    """
    if sample_size >= len(y):
        return X, y  # if requesting all data, just return everything

    sss = StratifiedShuffleSplit(n_splits=1, train_size=sample_size, random_state=random_state)
    for train_index, _ in sss.split(X, y):
        X_sub = X[train_index]
        y_sub = y[train_index]
    return X_sub, y_sub


def prepare_train_test_split(X, y, test_size=0.3, random_state=42):
    """
    Splits data into 70% training / 30% test sets.
    Stratified so both splits maintain the same class balance.
    """
    return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)
