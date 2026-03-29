import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data'

def load_and_preprocess_data():
    """
    Downloads the dataset, separates features and labels, 
    normalizes features, and applies PCA.
    """
    print("Downloading dataset...")
    df = pd.read_csv(URL)
    
    # 'name' column is not a feature
    X = df.drop(columns=['name', 'status'])
    y = df['status'].values
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Apply PCA down to 4 components (for 4 qubits)
    pca = PCA(n_components=4)
    X_pca = pca.fit_transform(X_scaled)
    
    return X_pca, y

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
