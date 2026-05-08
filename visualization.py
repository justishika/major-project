import matplotlib
matplotlib.use('Agg')   # non-interactive backend — safe for long pipeline runs
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import os
from sklearn.metrics import precision_recall_curve, roc_curve, auc, confusion_matrix

plt.style.use("default")
sns.set_theme(style="whitegrid", rc={
    "axes.facecolor": "#ffffff",
    "figure.facecolor": "#ffffff",
    "axes.edgecolor": "#e5e7eb",
    "grid.color": "#f3f4f6",
    "text.color": "#1f2937",
    "axes.labelcolor": "#374151",
    "xtick.color": "#4b5563",
    "ytick.color": "#4b5563",
    "font.family": "sans-serif",
    "font.sans-serif": ["Inter", "Arial", "sans-serif"]
})
# ─────────────────────────────────────────────────────────────────────────────
# VISUALIZATION MODULE
# All graphs saved as PNG to results/graphs/<dataset_name>/ (per disease).
# cross_disease_summary.png is saved to results/graphs/ root.
# plt.close() is called after every save — no interactive display needed.
# ─────────────────────────────────────────────────────────────────────────────

# Colour constants — Hybrid always gets standout refined color
_HYBRID_COLOUR = '#d97706' # Sophisticated Amber
_PALETTE       = 'muted'

# Models shown in the primary comparison charts
_CANONICAL = [
    'SVM', 'Logistic Regression', 'Random Forest',
    'QK-SVM (Noiseless)', 'QK-SVM (Noisy)', 'Hybrid (Classical+Quantum)',
]

# Label cleanup applied in every visualization (fallback for older CSVs)
_LABEL_FIX = {
    'VQC (Noiseless)':       'QK-SVM (Noiseless)',
    'VQC (Noisy)':           'QK-SVM (Noisy)',
    'VQC':                   'QK-SVM',
    'Hybrid (Classical+VQC)':'Hybrid (Classical+QK-SVM)',
}


def _prep(output_dir):
    os.makedirs(output_dir, exist_ok=True)


def _fix_labels(series):
    return series.replace(_LABEL_FIX)


def _model_color(model, palette_colors, model_list):
    """Return _HYBRID_COLOUR for Hybrid model, else a palette colour."""
    if 'Hybrid' in str(model):
        return _HYBRID_COLOUR
    idx = model_list.index(model) if model in model_list else 0
    return palette_colors[idx % len(palette_colors)]


def save_results_table(results_list, filename="benchmark_results.csv"):
    df = pd.DataFrame(results_list)
    df.to_csv(filename, index=False)
    print(f"Results saved to {filename}")
    return df


# ── 1. Accuracy vs Dataset Size ───────────────────────────────────────────────
def plot_accuracy_vs_size(df, output_dir="."):
    _prep(output_dir)

    agg = (
        df.groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)['Accuracy']
        .mean().rename(columns={'Accuracy': 'Mean Accuracy'})
    )
    agg['Model'] = _fix_labels(agg['Model'])

    for ds in agg['Dataset'].unique():
        sub = agg[agg['Dataset'] == ds]
        plt.figure(figsize=(10, 6))
        ax = plt.gca()
        models = sub['Model'].unique().tolist()
        palette = sns.color_palette(_PALETTE, len(models))
        for model in models:
            m_data = sub[sub['Model'] == model]
            color  = _HYBRID_COLOUR if 'Hybrid' in model else palette[models.index(model)]
            lw     = 2.5 if 'Hybrid' in model else 1.5
            ax.plot(m_data['Dataset Size'], m_data['Mean Accuracy'],
                    marker='o', label=model, color=color, linewidth=lw)
        ax.set_title(f'Accuracy vs Dataset Size — {ds.replace("_"," ").title()}', fontsize=13)
        ax.set_xlabel('Dataset Size')
        ax.set_ylabel('Mean Accuracy')
        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9)

        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"accuracy_vs_size_{ds}.png"), dpi=130)
        plt.close()


# ── 2. Model Stability ────────────────────────────────────────────────────────
def plot_model_stability(df, output_dir="."):
    _prep(output_dir)

    stable = (
        df.dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model'], as_index=False)
        .agg(**{'Mean Accuracy': ('Accuracy', 'mean'), 'Std Accuracy': ('Accuracy', 'std')})
    )
    stable['Model'] = _fix_labels(stable['Model'])

    for ds in stable['Dataset'].unique():
        sub = stable[stable['Dataset'] == ds].copy()
        colors = [
            _HYBRID_COLOUR if 'Hybrid' in m else '#5b9bd5'
            for m in sub['Model']
        ]
        plt.figure(figsize=(12, 6))
        bars = plt.bar(sub['Model'], sub['Mean Accuracy'],
                       yerr=sub['Std Accuracy'].fillna(0), capsize=5,
                       color=colors, alpha=0.85)
        for bar, val in zip(bars, sub['Mean Accuracy']):
            plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.005,
                     f'{val:.3f}', ha='center', va='bottom', fontsize=8)
        plt.title(f'Model Stability (Mean ± Std Accuracy) — {ds.replace("_"," ").title()}', fontsize=13)
        plt.xlabel('Model')
        plt.ylabel('Accuracy')
        plt.xticks(rotation=25, ha='right')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"model_stability_{ds}.png"), dpi=130)
        plt.close()


# ── 3. Noise Sensitivity ──────────────────────────────────────────────────────
def plot_noise_sensitivity(df, baseline_model='SVM', output_dir="."):
    _prep(output_dir)

    vqc = df[df['Model'].isin([
        'QK-SVM (Noisy)', 'QK-SVM (Noiseless Noise-Curve)',
        'VQC (Noisy)', 'VQC (Noiseless Noise-Curve)',
    ])].copy()
    if vqc.empty:
        return
    vqc['Model'] = 'QK-SVM'
    vqc_agg = (
        vqc.groupby(['Dataset', 'Noise Level'], as_index=False)['Accuracy']
        .mean().rename(columns={'Accuracy': 'Mean Accuracy'})
    )

    for ds in vqc_agg['Dataset'].unique():
        sub = vqc_agg[vqc_agg['Dataset'] == ds]
        plt.figure(figsize=(10, 6))
        sns.lineplot(data=sub, x='Noise Level', y='Mean Accuracy', marker='o', label='QK-SVM')
        base = df[(df['Dataset'] == ds) & (df['Model'] == baseline_model)]
        if not base.empty:
            plt.axhline(y=base['Accuracy'].mean(), linestyle='--',
                        color='gray', label=f'{baseline_model} baseline')
        plt.title(f'Noise Sensitivity — {ds.replace("_"," ").title()}', fontsize=13)
        plt.xlabel('Depolarizing Noise Probability')
        plt.ylabel('Mean Accuracy')
        plt.legend()

        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"noise_sensitivity_{ds}.png"), dpi=130)
        plt.close()


# ── 4. Precision-Recall Curves ────────────────────────────────────────────────
def plot_precision_recall_tradeoff(curve_records, output_dir="."):
    _prep(output_dir)
    if not curve_records:
        return
    by_ds = {}
    for r in curve_records:
        by_ds.setdefault(r['Dataset'], []).append(r)

    for ds, rows in by_ds.items():
        plt.figure(figsize=(10, 6))
        models = [r['Model'] for r in rows]
        palette = sns.color_palette(_PALETTE, len(models))
        for i, rec in enumerate(rows):
            if rec['y_score'] is None:
                continue
            prec, rec_, _ = precision_recall_curve(rec['y_true'], rec['y_score'])
            label = rec['Model'].replace('VQC', 'QK-SVM')
            color = _HYBRID_COLOUR if 'Hybrid' in label else palette[i]
            lw    = 2.5 if 'Hybrid' in label else 1.5
            plt.plot(rec_, prec, label=label, color=color, linewidth=lw)
        plt.title(f'Precision-Recall Curve — {ds.replace("_"," ").title()}', fontsize=13)
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.legend(fontsize=9)

        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"precision_recall_curve_{ds}.png"), dpi=130)
        plt.close()


# ── 5. ROC Curves ─────────────────────────────────────────────────────────────
def plot_roc_curve(curve_records, output_dir="."):
    _prep(output_dir)
    if not curve_records:
        return
    by_ds = {}
    for r in curve_records:
        by_ds.setdefault(r['Dataset'], []).append(r)

    for ds, rows in by_ds.items():
        plt.figure(figsize=(10, 6))
        models = [r['Model'] for r in rows]
        palette = sns.color_palette(_PALETTE, len(models))
        for i, rec in enumerate(rows):
            if rec['y_score'] is None:
                continue
            fpr, tpr, _ = roc_curve(rec['y_true'], rec['y_score'])
            roc_auc = auc(fpr, tpr)
            label = rec['Model'].replace('VQC', 'QK-SVM')
            color = _HYBRID_COLOUR if 'Hybrid' in label else palette[i]
            lw    = 2.5 if 'Hybrid' in label else 1.5
            plt.plot(fpr, tpr, label=f"{label} (AUC={roc_auc:.2f})",
                     color=color, linewidth=lw)
        plt.plot([0, 1], [0, 1], linestyle='--', color='lightgray')
        plt.title(f'ROC Curve — {ds.replace("_"," ").title()}', fontsize=13)
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.legend(fontsize=9)

        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"roc_curve_{ds}.png"), dpi=130)
        plt.close()


# ── 6. Overfitting Behavior ───────────────────────────────────────────────────
def plot_overfitting_behavior(df, output_dir="."):
    _prep(output_dir)
    valid = df.dropna(subset=['Train Accuracy', 'Accuracy'])
    if valid.empty:
        return
    tr_agg   = valid.groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)['Train Accuracy'].mean()
    te_agg   = valid.groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)['Accuracy'].mean()
    tr_agg['Split'] = 'Train'; tr_agg = tr_agg.rename(columns={'Train Accuracy': 'Score'})
    te_agg['Split'] = 'Test';  te_agg = te_agg.rename(columns={'Accuracy': 'Score'})
    merged = pd.concat([tr_agg, te_agg], ignore_index=True)
    merged['Model'] = _fix_labels(merged['Model'])

    for ds in merged['Dataset'].unique():
        sub = merged[merged['Dataset'] == ds]
        plt.figure(figsize=(12, 6))
        sns.lineplot(data=sub, x='Dataset Size', y='Score',
                     hue='Model', style='Split', marker='o')
        plt.title(f'Overfitting Behavior (Train vs Test) — {ds.replace("_"," ").title()}', fontsize=13)
        plt.xlabel('Dataset Size')
        plt.ylabel('Accuracy')
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=8)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"overfitting_behavior_{ds}.png"), dpi=130)
        plt.close()


# ── 7. Confusion Matrices ─────────────────────────────────────────────────────
def plot_confusion_matrices(curve_records, output_dir="."):
    _prep(output_dir)
    if not curve_records:
        return
    for rec in curve_records:
        if rec['y_pred'] is None:
            continue
        cm = confusion_matrix(rec['y_true'], rec['y_pred'], labels=[0, 1])
        plt.figure(figsize=(6, 5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
        plt.title(f"Confusion Matrix\n{rec['Dataset']} — {rec['Model']}", fontsize=11)
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        safe = rec['Model'].replace(' ', '_').replace('(', '').replace(')', '')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir,
                    f"confusion_matrix_{rec['Dataset']}_{safe}.png"), dpi=130)
        plt.close()


# ── 8. Single Metric vs Size (helper) ────────────────────────────────────────
def plot_single_metric_vs_size(df, metric, output_dir="."):
    if metric not in df.columns:
        return
    _prep(output_dir)
    valid = df.dropna(subset=[metric])
    if valid.empty:
        return
    agg = valid.groupby(['Dataset', 'Model', 'Dataset Size'], as_index=False)[metric].mean()
    agg['Model'] = _fix_labels(agg['Model'])

    for ds in agg['Dataset'].unique():
        sub    = agg[agg['Dataset'] == ds]
        models = sub['Model'].unique().tolist()
        palette = sns.color_palette(_PALETTE, len(models))
        plt.figure(figsize=(10, 6))
        ax = plt.gca()
        for model in models:
            m_data = sub[sub['Model'] == model]
            color  = _HYBRID_COLOUR if 'Hybrid' in model else palette[models.index(model)]
            lw     = 2.5 if 'Hybrid' in model else 1.5
            ax.plot(m_data['Dataset Size'], m_data[metric],
                    marker='o', label=model, color=color, linewidth=lw)
        ax.set_title(f'{metric} vs Dataset Size — {ds.replace("_"," ").title()}', fontsize=13)
        ax.set_xlabel('Dataset Size')
        ax.set_ylabel(metric)
        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=8)
        plt.tight_layout()
        safe = metric.replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').lower()
        plt.savefig(os.path.join(output_dir, f"{safe}_vs_size_{ds}.png"), dpi=130)
        plt.close()


def plot_all_individual_metrics(df, output_dir="."):
    for m in ['Precision', 'Recall', 'F1-score', 'Sensitivity',
              'Specificity', 'ROC-AUC', 'Train Accuracy',
              'Generalization Gap', 'Runtime (s)']:
        plot_single_metric_vs_size(df, m, output_dir)
    print("  All individual metric plots saved.")


# ── 9. Metric Heatmap (Model × Metric at max size) ───────────────────────────
def plot_metric_heatmap(df, max_size, output_dir="."):
    """
    Heatmap: rows = canonical models, columns = key metrics, values = mean at max_size.
    Instantly shows which model dominates across ALL metrics simultaneously.
    """
    _prep(output_dir)
    metrics = ['Accuracy', 'Precision', 'Recall', 'F1-score',
               'Sensitivity', 'Specificity', 'ROC-AUC']
    canonical = _CANONICAL

    sub = (
        df[(df['Model'].isin(canonical)) & (df['Dataset Size'] == max_size)]
        .dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model'])[metrics]
        .mean()
        .reset_index()
    )
    if sub.empty:
        return

    for ds in sub['Dataset'].unique():
        ds_sub = sub[sub['Dataset'] == ds].set_index('Model')[metrics]
        # Reorder so Hybrid is last (bottom) for easy visual comparison
        order = [m for m in canonical if m in ds_sub.index]
        ds_sub = ds_sub.loc[order]

        plt.figure(figsize=(10, max(4, len(order) * 0.7)))
        sns.heatmap(ds_sub, annot=True, fmt='.3f', cmap='YlOrRd',
                    vmin=0.0, vmax=1.0, linewidths=0.5, linecolor='white')
        plt.title(
            f'Model × Metric Heatmap (N={max_size}) — {ds.replace("_"," ").title()}',
            fontsize=12
        )
        plt.xlabel('Metric')
        plt.ylabel('Model')
        plt.xticks(rotation=30, ha='right', fontsize=9)
        plt.yticks(rotation=0, fontsize=9)
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"metric_heatmap_{ds}.png"), dpi=130)
        plt.close()


# ── 10. Cross-Disease Summary (saved to graphs root) ─────────────────────────
def plot_cross_disease_summary(df, output_dir="."):
    """
    Grouped bar chart: mean accuracy per (disease, model) aggregated across
    ALL sizes and runs.  Hybrid bars are highlighted in red so dominance is
    immediately obvious.  Saved to results/graphs/cross_disease_summary.png
    """
    _prep(output_dir)

    keep = ['SVM', 'Logistic Regression', 'Random Forest',
            'QK-SVM (Noiseless)', 'Hybrid (Classical+Quantum)']
    agg = (
        df[df['Model'].isin(keep)]
        .dropna(subset=['Accuracy'])
        .groupby(['Dataset', 'Model'], as_index=False)['Accuracy']
        .mean()
    )
    if agg.empty:
        print("  cross_disease_summary: no data — skipped.")
        return

    pivot = agg.pivot(index='Dataset', columns='Model', values='Accuracy').fillna(0)
    n_ds, n_m = len(pivot), len(pivot.columns)
    palette = sns.color_palette(_PALETTE, n_m)

    fig, ax = plt.subplots(figsize=(max(14, n_ds * 2.5), 7))
    x     = np.arange(n_ds)
    width = 0.8 / n_m

    for i, model in enumerate(pivot.columns):
        color  = _HYBRID_COLOUR if 'Hybrid' in model else palette[i]
        ec     = 'black' if 'Hybrid' in model else 'none'
        lw     = 1.5    if 'Hybrid' in model else 0
        vals   = pivot[model].values
        bars   = ax.bar(x + i * width, vals, width, label=model,
                        color=color, alpha=0.88, edgecolor=ec, linewidth=lw)
        for bar in bars:
            h = bar.get_height()
            if h > 0.01:
                ax.text(bar.get_x() + bar.get_width() / 2, h + 0.005,
                        f'{h:.3f}', ha='center', va='bottom',
                        fontsize=7, rotation=90)

    ax.set_xlabel('Disease Dataset', fontsize=12)
    ax.set_ylabel('Mean Accuracy', fontsize=12)
    ax.set_title(
        'Cross-Disease Model Comparison — Mean Accuracy\n'
        '(Hybrid (Classical+Quantum) highlighted in red)',
        fontsize=13
    )
    ax.set_xticks(x + width * (n_m - 1) / 2)
    ax.set_xticklabels(
        [d.replace('_', ' ').title() for d in pivot.index],
        rotation=20, ha='right', fontsize=10
    )
    ax.set_ylim(0, 1.12)
    ax.legend(bbox_to_anchor=(1.01, 1), loc='upper left', fontsize=9)
    ax.yaxis.grid(True, alpha=0.4)
    plt.tight_layout()
    path = os.path.join(output_dir, 'cross_disease_summary.png')
    plt.savefig(path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  Saved: {path}")
