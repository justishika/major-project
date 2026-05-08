import pandas as pd
from visualization import plot_model_stability

for dataset in ['parkinsons', 'breast_cancer']:
    try:
        df = pd.read_csv(f"{dataset}_benchmark_results.csv")
        plot_model_stability(df, prefix=f"{dataset}_")
    except Exception as e:
        pass
