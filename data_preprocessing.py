import pandas as pd
import numpy as np
import ssl
import urllib.request
import os
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context
from sklearn.model_selection import train_test_split, StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.datasets import load_breast_cancer, fetch_openml

# ── Remote dataset URLs ────────────────────────────────────────────────────────
PARKINSONS_URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data'
<<<<<<< HEAD
ACUTE_NEPHRITIS_URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases/acute/diagnosis.data'
HEART_FAILURE_URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases/00519/heart_failure_clinical_records_dataset.csv'
=======
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
WILSONS_CLEAN_CSV = os.path.join(PROJECT_DIR, 'wilsons_clean.csv')
PCA_READY_DATASETS = {'wilsons_disease'}
>>>>>>> 345c05f (feat: add Wilson's Disease and ALS synthetic datasets with loaders and config)

# ── Per-dataset configuration exported for main.py ────────────────────────────
DATASET_CONFIG = {
    'parkinsons': {
        'display_name': "Parkinson's Disease",
        'sizes': [20, 50, 100, 150, 195],
    },
    'breast_cancer': {
        'display_name': 'Breast Cancer',
        'sizes': [50, 100, 200, 350, 500],
    },
    'hepatitis_c': {
        'display_name': 'Hepatitis C (HCV Serology)',
        # Classic UCI hepatitis — 155 patients, serology markers → DIE/LIVE prognosis
        'sizes': [15, 30, 60, 90, 120],
    },
    'heart_disease': {
        'display_name': 'Heart Disease (Cleveland)',
        'sizes': [20, 50, 100, 150, 220],
    },
    'mammographic_mass': {
        'display_name': 'Mammographic Mass Assessment',
        # BI-RADS radiological features → benign/malignant mass classification
        'sizes': [50, 100, 200, 350, 700],
    },
    'thyroid_disease': {
        'display_name': 'Thyroid Disease (Sick Euthyroid)',
        # Lab markers (T3, T4, TSH, etc.) → sick euthyroid vs normal
        'sizes': [50, 100, 250, 500, 800],
    },
<<<<<<< HEAD
    'acute_nephritis': {
        'display_name': 'Acute Nephritis',
        'sizes': [20, 50, 75, 100, 120],
    },
    'heart_failure': {
        'display_name': 'Heart Failure Clinical Records',
        'sizes': [50, 100, 150, 200, 299],
=======
    'wilsons_disease': {
        'display_name': "Wilson's Disease (Synthetic)",
        'sizes': [50, 100, 150, 200, 250],
    },
    'als': {
        'display_name': 'Amyotrophic Lateral Sclerosis (Synthetic)',
        'sizes': [50, 100, 150, 200, 250],
>>>>>>> 345c05f (feat: add Wilson's Disease and ALS synthetic datasets with loaders and config)
    },
}

# ── Individual loaders ─────────────────────────────────────────────────────────

def _load_parkinsons_data():
    df = pd.read_csv(PARKINSONS_URL)
    X = df.drop(columns=['name', 'status']).values
    y = df['status'].values
    return X, y


def _load_breast_cancer_data():
    data = load_breast_cancer()
    return data.data, data.target


def _load_hepatitis_c_data():
    """
    Classic UCI Hepatitis dataset: 155 patients, 19 serology/lab features.
    Binary target: DIE (0) vs LIVE (1).
    Categorical features are label-encoded; missing values imputed by median.
    Clinical context: predicts survival of hepatitis (HCV/HBV) patients.
    """
    data = fetch_openml('hepatitis', version=1, as_frame=True, parser='auto')
    df = data.data.copy()
    # Label-encode any categorical columns
    for col in df.select_dtypes(include=['object', 'category']).columns:
        df[col] = pd.Categorical(df[col]).codes.astype(float)
        df[col] = df[col].replace(-1, np.nan)
    X = df.values.astype(float)
    imputer = SimpleImputer(strategy='median')
    X = imputer.fit_transform(X)
    raw = data.target.astype(str).str.strip().str.upper()
    # DIE → 0, LIVE → 1
    y = (raw == 'LIVE').astype(int).values
    return X, y


def _load_heart_disease_data():
    """Cleveland Heart Disease via OpenML heart-statlog — binary presence/absence."""
    data = fetch_openml('heart-statlog', version=1, as_frame=True, parser='auto')
    X = data.data.values.astype(float)
    raw = data.target.astype(str).str.strip().str.lower()
    if raw.isin(['present', 'absent']).any():
        y = (raw == 'present').astype(int).values
    else:
        y = pd.to_numeric(raw, errors='coerce').fillna(0).astype(int).values
        y = (y > 0).astype(int)
    return X, y


def _load_mammographic_mass_data():
    """
    UCI Mammographic Mass dataset: 961 instances, 5 BIRADS radiological features.
    Binary target: benign (0) vs malignant (1).
    Features: BI-RADS assessment, Age, Mass Shape, Mass Margin, Mass Density.
    Clinical context: aids radiologists in classifying mammographic findings.
    Missing values (originally '?') imputed by median after fetch.
    """
    data = fetch_openml('mammographic-mass', version=1, as_frame=True, parser='auto')
    df = data.data.copy()
    # Encode any categorical columns and mark unknowns as NaN
    for col in df.select_dtypes(include=['object', 'category']).columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    X = df.values.astype(float)
    imputer = SimpleImputer(strategy='median')
    X = imputer.fit_transform(X)
    raw = data.target.astype(str).str.strip()
    # Target is '0' (benign) or '1' (malignant)
    y = pd.to_numeric(raw, errors='coerce').fillna(0).astype(int).values
    return X, y


def _load_thyroid_disease_data():
    """
    OpenML 'sick' dataset: 3772 thyroid lab-test records.
    Binary target: sick euthyroid (1) vs negative/normal (0).
    Features: 29 — TSH, T3, TT4, T4U, FTI levels + patient demographics.
    Clinical context: identifies sick euthyroid syndrome from blood panel.
    Categorical features (sex, referral source, etc.) are label-encoded.
    """
    data = fetch_openml('sick', version=2, as_frame=True, parser='auto')
    df = data.data.copy()
    for col in df.select_dtypes(include=['object', 'category']).columns:
        df[col] = pd.Categorical(df[col]).codes.astype(float)
        df[col] = df[col].replace(-1, np.nan)
    X = df.values.astype(float)
    imputer = SimpleImputer(strategy='median')
    X = imputer.fit_transform(X)
    raw = data.target.astype(str).str.strip().str.lower()
    # 'sick' → 1, 'negative' → 0
    y = (raw == 'sick').astype(int).values
    return X, y


<<<<<<< HEAD
def _load_acute_nephritis_data():
    """
    UCI Acute Inflammations dataset (predicts Acute Nephritis).
    120 instances, 6 features.
    Custom format: UTF-16, tab-separated, commas for decimals.
    """
    import urllib.request
    req = urllib.request.urlopen(ACUTE_NEPHRITIS_URL)
    data = req.read().decode('utf-16')
    lines = data.strip().split('\n')
    
    X_list = []
    y_list = []
    for line in lines:
        if not line.strip(): continue
        parts = line.strip().split('\t')
        temp = float(parts[0].replace(',', '.'))
        features = [temp] + [(1.0 if p == 'yes' else 0.0) for p in parts[1:6]]
        target = 1 if parts[7] == 'yes' else 0
        X_list.append(features)
        y_list.append(target)
        
    X = np.array(X_list).astype(float)
    y = np.array(y_list).astype(int)
    return X, y


def _load_heart_failure_data():
    """
    UCI Heart Failure Clinical Records dataset.
    299 instances, 13 features.
    Target: DEATH_EVENT (0 or 1).
    """
    df = pd.read_csv(HEART_FAILURE_URL)
    X = df.drop(columns=['DEATH_EVENT']).values.astype(float)
    y = df['DEATH_EVENT'].values.astype(int)
    return X, y

=======
def _load_wilsons_disease_data():
    """
    Synthetic Wilson's Disease dataset (500 samples, 250 per class).

    Clinical features based on published diagnostic criteria:
      - Age at onset (Wilson's peaks 5-35 yrs)
      - Serum ceruloplasmin (low in WD: <20 mg/dL vs normal 20-40)
      - 24h urine copper (elevated in WD: >100 ug/day vs normal <40)
      - Hepatic copper (elevated in WD: >250 ug/g dry weight)
      - Kayser-Fleischer rings (present in ~95% neurological WD)
      - Serum AST (elevated in hepatic WD)
      - Serum ALT (elevated in hepatic WD)
      - Serum bilirubin (elevated in hepatic WD)
    Labels: 0 = healthy control, 1 = Wilson's Disease patient
    """
    rng = np.random.default_rng(42)
    n_per_class = 250
    # --- Healthy controls ---
    X_ctrl = np.column_stack([
        rng.normal(40, 15, n_per_class),           # Age
        rng.normal(30, 5,  n_per_class),           # Ceruloplasmin (normal)
        rng.normal(25, 8,  n_per_class),           # 24h Urine Copper (normal)
        rng.normal(30, 10, n_per_class),           # Hepatic Copper (normal)
        rng.binomial(1, 0.02, n_per_class),        # KF rings (rare in healthy)
        rng.normal(25, 6,  n_per_class),           # AST
        rng.normal(25, 6,  n_per_class),           # ALT
        rng.normal(0.9, 0.2, n_per_class),         # Bilirubin
    ])
    y_ctrl = np.zeros(n_per_class, dtype=int)
    # --- Wilson's patients ---
    X_wd = np.column_stack([
        rng.normal(22, 8,  n_per_class),           # Age (younger onset)
        rng.normal(10, 4,  n_per_class),           # Ceruloplasmin (low)
        rng.normal(160, 40, n_per_class),          # 24h Urine Copper (high)
        rng.normal(300, 60, n_per_class),          # Hepatic Copper (very high)
        rng.binomial(1, 0.85, n_per_class),        # KF rings (present in ~85%)
        rng.normal(65, 20, n_per_class),           # AST (elevated)
        rng.normal(72, 22, n_per_class),           # ALT (elevated)
        rng.normal(2.5, 0.6, n_per_class),         # Bilirubin (elevated)
    ])
    y_wd = np.ones(n_per_class, dtype=int)
    X = np.vstack([X_ctrl, X_wd])
    y = np.concatenate([y_ctrl, y_wd])
    # Shuffle
    idx = rng.permutation(len(y))
    return X[idx], y[idx]

def _load_als_data():
    """
    Synthetic ALS dataset (500 samples, 250 per class).

    Clinical features based on published ALS diagnostic criteria (El Escorial):
      - Age at symptom onset (ALS typically 55-75 yrs)
      - ALSFRS-R monthly decline rate (fast progression: >1.5 pts/month)
      - Forced Vital Capacity FVC% (reduced in ALS: <80%)
      - Creatine Kinase CK levels (elevated in active denervation)
      - Bulbar onset (present in ~30% of ALS cases)
      - EMG denervation signs (required for ALS diagnosis)
      - Upper Motor Neuron (UMN) signs
      - Lower Motor Neuron (LMN) signs
    Labels: 0 = healthy/mimic control, 1 = ALS patient
    """
    rng = np.random.default_rng(99)
    n_per_class = 250
    # --- Healthy controls / ALS mimics ---
    X_ctrl = np.column_stack([
        rng.normal(52, 14, n_per_class),           # Age
        rng.normal(0.08, 0.04, n_per_class),       # ALSFRS-R decline (slow/none)
        rng.normal(96, 5, n_per_class),            # FVC% (normal)
        rng.normal(145, 35, n_per_class),          # CK (normal)
        rng.binomial(1, 0.05, n_per_class),        # Bulbar onset (rare in controls)
        rng.binomial(1, 0.08, n_per_class),        # EMG denervation (rare)
        rng.binomial(1, 0.07, n_per_class),        # UMN signs (rare)
        rng.binomial(1, 0.07, n_per_class),        # LMN signs (rare)
    ])
    y_ctrl = np.zeros(n_per_class, dtype=int)
    # --- ALS patients ---
    X_als = np.column_stack([
        rng.normal(62, 10, n_per_class),           # Age (older onset)
        rng.normal(1.6, 0.5, n_per_class),         # ALSFRS-R decline (fast)
        rng.normal(72, 16, n_per_class),           # FVC% (reduced)
        rng.normal(260, 85, n_per_class),          # CK (elevated)
        rng.binomial(1, 0.30, n_per_class),        # Bulbar onset (30%)
        rng.binomial(1, 0.92, n_per_class),        # EMG denervation (92%)
        rng.binomial(1, 0.87, n_per_class),        # UMN signs (87%)
        rng.binomial(1, 0.88, n_per_class),        # LMN signs (88%)
    ])
    y_als = np.ones(n_per_class, dtype=int)
    X = np.vstack([X_ctrl, X_als])
    y = np.concatenate([y_ctrl, y_als])
    idx = rng.permutation(len(y))
    return X[idx], y[idx]
>>>>>>> 345c05f (feat: add Wilson's Disease and ALS synthetic datasets with loaders and config)

# ── Dispatcher ─────────────────────────────────────────────────────────────────

_LOADERS = {
    'parkinsons':        _load_parkinsons_data,
    'breast_cancer':     _load_breast_cancer_data,
    'hepatitis_c':       _load_hepatitis_c_data,
    'heart_disease':     _load_heart_disease_data,
    'mammographic_mass': _load_mammographic_mass_data,
    'thyroid_disease':   _load_thyroid_disease_data,
<<<<<<< HEAD
    'acute_nephritis':   _load_acute_nephritis_data,
    'heart_failure':     _load_heart_failure_data,
=======
    'wilsons_disease':   _load_wilsons_disease_data,
    'als':               _load_als_data,
>>>>>>> 345c05f (feat: add Wilson's Disease and ALS synthetic datasets with loaders and config)
}


def load_and_preprocess_data(dataset_name='parkinsons', n_components=4, use_pca=True):
    """
    Load, standardise, PCA-reduce, and [-π, π]-scale a disease dataset.
    Returns: X_proc (ndarray), y (ndarray), pca_info (dict)
    """
    key = dataset_name.lower()
    if key not in _LOADERS:
        raise ValueError(f"Unknown dataset '{dataset_name}'. Available: {list(_LOADERS)}")

    print(f"Loading dataset: {dataset_name}")
    X, y = _LOADERS[key]()

    # 1. Standardise
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    pca_info = {'used': use_pca, 'n_components': n_components,
                'explained_variance_ratio': None, 'total_explained_variance': None}

    # 2. PCA — guard against requesting more components than features/samples
    if use_pca and key in PCA_READY_DATASETS:
        X_proc = X_scaled
        pca_info['n_components'] = X_scaled.shape[1]
        pca_info['explained_variance_ratio'] = None
        pca_info['total_explained_variance'] = 1.0
    elif use_pca:
        n_comp = min(n_components, X_scaled.shape[1], X_scaled.shape[0] - 1)
        pca = PCA(n_components=n_comp)
        X_proc = pca.fit_transform(X_scaled)
        pca_info['n_components'] = n_comp
        pca_info['explained_variance_ratio'] = pca.explained_variance_ratio_.tolist()
        pca_info['total_explained_variance'] = float(np.sum(pca.explained_variance_ratio_))
    else:
        X_proc = X_scaled

    # 3. Map to [-π, π] for Pauli rotations
    scaler_pi = MinMaxScaler(feature_range=(-np.pi, np.pi))
    X_proc = scaler_pi.fit_transform(X_proc)

    return X_proc, y, pca_info


def get_stratified_subsample(X, y, sample_size, random_state=42):
    if sample_size >= len(y):
        return X, y
    sss = StratifiedShuffleSplit(n_splits=1, train_size=sample_size, random_state=random_state)
    for train_idx, _ in sss.split(X, y):
        return X[train_idx], y[train_idx]


def prepare_train_test_split(X, y, test_size=0.3, random_state=42):
    return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)
