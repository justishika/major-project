import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.datasets import load_breast_cancer

URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data'

def _load_parkinsons_data():
    df = pd.read_csv(URL)
    X = df.drop(columns=['name', 'status']).values
    y = df['status'].values
    return X, y


def _load_breast_cancer_data():
    data = load_breast_cancer()
    X = data.data
    y = data.target
    return X, y


def _dataset_loader(dataset_name):
    dataset_name = dataset_name.lower()
    if dataset_name == 'parkinsons':
        return _load_parkinsons_data()
    if dataset_name == 'breast_cancer':
        return _load_breast_cancer_data()
    raise ValueError(f"Unsupported dataset_name: {dataset_name}")


def load_and_preprocess_data(dataset_name='parkinsons', n_components=4, use_pca=True):
    """
    Downloads the dataset, separates features and labels, 
    normalizes features, and applies PCA.
    """
    print(f"Loading dataset: {dataset_name}")
    X, y = _dataset_loader(dataset_name)
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    pca_info = {
        'used': use_pca,
        'n_components': n_components,
        'explained_variance_ratio': None,
        'total_explained_variance': None,
    }

    if use_pca:
        pca = PCA(n_components=n_components)
        X_proc = pca.fit_transform(X_scaled)
        pca_info['explained_variance_ratio'] = pca.explained_variance_ratio_.tolist()
        pca_info['total_explained_variance'] = float(np.sum(pca.explained_variance_ratio_))
    else:
        X_proc = X_scaled

    return X_proc, y, pca_info

def get_stratified_subsample(X, y, sample_size, random_state=42):
    """
    Returns a stratified subsample of the dataset of a specific size.
    """
    if sample_size >= len(y):
        return X, y
        
    sss = StratifiedShuffleSplit(n_splits=1, train_size=sample_size, random_state=random_state)
    for train_index, _ in sss.split(X, y):
        X_sub = X[train_index]
        y_sub = y[train_index]
    return X_sub, y_sub

def prepare_train_test_split(X, y, test_size=0.3, random_state=42):
    """
    Splits data into train and test sets.
    """
    return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)
