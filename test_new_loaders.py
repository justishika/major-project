import sys
import os
sys.path.append(os.getcwd())

from data_preprocessing import load_and_preprocess_data

datasets = ['acute_nephritis', 'heart_failure']

for ds in datasets:
    print(f"\n--- Testing {ds} ---")
    try:
        X, y, pca_info = load_and_preprocess_data(ds, n_components=4, use_pca=True)
        print(f"Shape of X: {X.shape}")
        print(f"Shape of y: {y.shape}")
        print(f"Unique targets: {set(y)}")
        print(f"PCA Info: {pca_info}")
        print("Success!")
    except Exception as e:
        print(f"Failed! Error: {e}")
