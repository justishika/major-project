import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os
from sklearn.metrics import precision_recall_curve, roc_curve, auc, confusion_matrix

def save_results_table(results_list, filename="benchmark_results.csv"):
    """
    Saves the list of result dictionaries to a CSV file and prints a message.
    """
    df = pd.DataFrame(results_list)
    df.to_csv(filename, index=False)
    print(f"Results saved to {filename}")
    return df

def _prepare_output(output_dir):
    os.makedirs(output_dir, exist_ok=True)


def plot_accuracy_vs_size(df, output_dir="."):
    """
    Graph 1: Accuracy vs dataset size (mean across runs).
    """
    _prepare_output(output_dir)
    sns.set_theme(style="whitegrid")

    agg = (
        df.groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)['Accuracy']
        .mean()
        .rename(columns={'Accuracy': 'Mean Accuracy'})
    )

    for dataset_name in agg['Dataset'].unique():
        subset = agg[agg['Dataset'] == dataset_name]
        plt.figure(figsize=(10, 6))
        sns.lineplot(data=subset, x='Dataset Size', y='Mean Accuracy', hue='Model', marker='o')
        plt.title(f'Accuracy vs Dataset Size ({dataset_name})')
        plt.xlabel('Dataset Size')
        plt.ylabel('Accuracy')
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"accuracy_vs_size_{dataset_name}.png"))
        plt.close()


def plot_model_stability(df, output_dir="."):
    """
    Graph 2: Mean accuracy with std-dev error bars.
    """
    _prepare_output(output_dir)
    stable = (
        df.dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model'], as_index=False)
        .agg(
            **{
                'Mean Accuracy': ('Accuracy', 'mean'),
                'Std Accuracy': ('Accuracy', 'std')
            }
        )
    )

    for dataset_name in stable['Dataset'].unique():
        subset = stable[stable['Dataset'] == dataset_name]
        plt.figure(figsize=(11, 6))
        plt.bar(subset['Model'], subset['Mean Accuracy'], yerr=subset['Std Accuracy'], capsize=5)
        plt.title(f'Model Stability (Mean ± Std Accuracy) - {dataset_name}')
        plt.xlabel('Model')
        plt.ylabel('Accuracy')
        plt.xticks(rotation=20)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"model_stability_{dataset_name}.png"))
        plt.close()


def plot_noise_sensitivity(df, baseline_model='SVM', output_dir="."):
    """
    Graph 3: Noise sensitivity curve for VQC with optional classical baseline.
    """
    _prepare_output(output_dir)
    vqc = df[df['Model'].isin(['VQC (Noisy)', 'VQC (Noiseless Noise-Curve)'])].copy()
    if vqc.empty:
        return

    vqc['Model'] = 'VQC'
    vqc_agg = (
        vqc.groupby(['Dataset', 'Noise Level'], as_index=False)['Accuracy']
        .mean()
        .rename(columns={'Accuracy': 'Mean Accuracy'})
    )

    for dataset_name in vqc_agg['Dataset'].unique():
        subset = vqc_agg[vqc_agg['Dataset'] == dataset_name]
        plt.figure(figsize=(10, 6))
        sns.lineplot(data=subset, x='Noise Level', y='Mean Accuracy', marker='o', label='VQC')

        baseline = df[(df['Dataset'] == dataset_name) & (df['Model'] == baseline_model)]
        if not baseline.empty:
            baseline_acc = baseline['Accuracy'].mean()
            plt.axhline(y=baseline_acc, linestyle='--', label=f'{baseline_model} baseline')

        plt.title(f'Noise Sensitivity Curve - {dataset_name}')
        plt.xlabel('Noise level')
        plt.ylabel('Accuracy')
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"noise_sensitivity_{dataset_name}.png"))
        plt.close()


def plot_precision_recall_tradeoff(curve_records, output_dir="."):
    """
    Graph 4: Precision-Recall curves for selected models.
    """
    _prepare_output(output_dir)
    if not curve_records:
        return

    by_dataset = {}
    for rec in curve_records:
        by_dataset.setdefault(rec['Dataset'], []).append(rec)

    for dataset_name, rows in by_dataset.items():
        plt.figure(figsize=(10, 6))
        for rec in rows:
            y_true = rec['y_true']
            y_score = rec['y_score']
            if y_score is None:
                continue
            precision, recall, _ = precision_recall_curve(y_true, y_score)
            plt.plot(recall, precision, label=rec['Model'])

        plt.title(f'Precision-Recall Curve - {dataset_name}')
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"precision_recall_curve_{dataset_name}.png"))
        plt.close()


def plot_roc_curve(curve_records, output_dir="."):
    """
    Graph 5: ROC curve for selected models.
    """
    _prepare_output(output_dir)
    if not curve_records:
        return

    by_dataset = {}
    for rec in curve_records:
        by_dataset.setdefault(rec['Dataset'], []).append(rec)

    for dataset_name, rows in by_dataset.items():
        plt.figure(figsize=(10, 6))
        for rec in rows:
            y_true = rec['y_true']
            y_score = rec['y_score']
            if y_score is None:
                continue
            fpr, tpr, _ = roc_curve(y_true, y_score)
            roc_auc = auc(fpr, tpr)
            plt.plot(fpr, tpr, label=f"{rec['Model']} (AUC={roc_auc:.2f})")

        plt.plot([0, 1], [0, 1], linestyle='--', color='gray')
        plt.title(f'ROC Curve - {dataset_name}')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"roc_curve_{dataset_name}.png"))
        plt.close()


def plot_overfitting_behavior(df, output_dir="."):
    """
    Graph 6: Train vs test accuracy behavior.
    """
    _prepare_output(output_dir)
    valid = df.dropna(subset=['Train Accuracy', 'Accuracy'])
    if valid.empty:
        return

    train_agg = valid.groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)['Train Accuracy'].mean()
    test_agg = valid.groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)['Accuracy'].mean()
    train_agg['Split'] = 'Train'
    train_agg = train_agg.rename(columns={'Train Accuracy': 'Score'})
    test_agg['Split'] = 'Test'
    test_agg = test_agg.rename(columns={'Accuracy': 'Score'})
    merged = pd.concat([train_agg, test_agg], ignore_index=True)

    for dataset_name in merged['Dataset'].unique():
        subset = merged[merged['Dataset'] == dataset_name]
        plt.figure(figsize=(11, 6))
        sns.lineplot(data=subset, x='Dataset Size', y='Score', hue='Model', style='Split', marker='o')
        plt.title(f'Overfitting Behavior (Train vs Test Accuracy) - {dataset_name}')
        plt.xlabel('Dataset Size')
        plt.ylabel('Accuracy')
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"overfitting_behavior_{dataset_name}.png"))
        plt.close()


def plot_confusion_matrices(curve_records, output_dir="."):
    """
    Additional visual: confusion matrices for representative run.
    """
    _prepare_output(output_dir)
    if not curve_records:
        return

    for rec in curve_records:
        y_true = rec['y_true']
        y_pred = rec['y_pred']
        if y_pred is None:
            continue
        cm = confusion_matrix(y_true, y_pred, labels=[0, 1])

        plt.figure(figsize=(10, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
        plt.title(f"Confusion Matrix - {rec['Dataset']} - {rec['Model']}")
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        safe_name = rec['Model'].replace(' ', '_').replace('(', '').replace(')', '')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"confusion_matrix_{rec['Dataset']}_{safe_name}.png"))
        plt.close()

def plot_single_metric_vs_size(df, metric, output_dir="."):
    if metric not in df.columns:
        return
    _prepare_output(output_dir)
    valid = df.dropna(subset=[metric])
    if valid.empty:
        return
    
    agg = valid.groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)[metric].mean()
    for dataset_name in agg['Dataset'].unique():
        subset = agg[agg['Dataset'] == dataset_name]
        plt.figure(figsize=(10, 6))
        sns.lineplot(data=subset, x='Dataset Size', y=metric, hue='Model', marker='o')
        plt.title(f'{metric} vs Dataset Size ({dataset_name})')
        plt.xlabel('Dataset Size')
        plt.ylabel(metric)
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        safe_name = metric.replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').lower()
        plt.savefig(os.path.join(output_dir, f"{safe_name}_vs_size_{dataset_name}.png"))
        plt.close()

def plot_all_individual_metrics(df, output_dir="."):
    metrics = ['Precision', 'Recall', 'F1-score', 'Sensitivity', 'Specificity', 'ROC-AUC', 'Train Accuracy', 'Generalization Gap', 'Runtime (s)']
    for m in metrics:
        plot_single_metric_vs_size(df, m, output_dir)

    print("All evaluation plots saved.")
