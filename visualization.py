import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os

def save_results_table(results_list, filename="benchmark_results.csv"):
    """
    Saves the list of result dictionaries to a CSV file and prints a message.
    """
    df = pd.DataFrame(results_list)
    df.to_csv(filename, index=False)
    print(f"Results saved to {filename}")
    return df

def plot_metrics_vs_size(df, output_dir="."):
    """
    Plots Accuracy and F1-score against Dataset Size for each evaluated model.
    """
    sns.set_theme(style="whitegrid")
    
    # Accuracy plot
    plt.figure(figsize=(10, 6))
    sns.lineplot(data=df, x='Dataset Size', y='Accuracy', hue='Model', marker='o')
    plt.title('Accuracy vs Dataset Size')
    plt.xlabel('Dataset Size')
    plt.ylabel('Accuracy')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "accuracy_vs_size.png"))
    plt.close()
    
    # F1-score plot
    plt.figure(figsize=(10, 6))
    sns.lineplot(data=df, x='Dataset Size', y='F1-score', hue='Model', marker='o')
    plt.title('F1-score vs Dataset Size')
    plt.xlabel('Dataset Size')
    plt.ylabel('F1-score')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "f1_score_vs_size.png"))
    plt.close()
    
    print("Plots saved to the current directory.")
