import os

import pandas as pd
import streamlit as st
from PIL import Image

st.set_page_config(page_title="Quantum ML Benchmark Dashboard", layout="wide")

st.title("Quantum Machine Learning Benchmark Dashboard")
st.markdown("Current benchmark outputs from `results/data` and `results/graphs`.")

RESULTS_CSV = os.path.join("results", "data", "benchmark_results.csv")
GRAPHS_DIR = os.path.join("results", "graphs")

if not os.path.exists(RESULTS_CSV):
    st.warning("Run `python main.py` to generate benchmark results.")
    st.stop()

df_results = pd.read_csv(RESULTS_CSV)
available_datasets = sorted(df_results["Dataset"].dropna().unique().tolist())
if not available_datasets:
    st.warning("No datasets found in benchmark results.")
    st.stop()

st.sidebar.header("Configuration")
dataset_key = st.sidebar.selectbox("Select Dataset", available_datasets)

ds_df = df_results[df_results["Dataset"] == dataset_key].copy()
display_name = dataset_key.replace("_", " ").title()
st.header(f"Dataset Insights: {display_name}")

metric_cols = [
    "Accuracy", "Precision", "Recall", "F1-score", "ROC-AUC",
    "Sensitivity", "Specificity", "Train Accuracy", "Generalization Gap",
]
existing_metrics = [col for col in metric_cols if col in ds_df.columns]
summary = ds_df.groupby("Model")[existing_metrics].mean(numeric_only=True).reset_index()
st.subheader("Benchmark Metrics")
st.dataframe(summary, use_container_width=True)

plots = [
    ("Accuracy vs Dataset Size", f"accuracy_vs_size_{dataset_key}.png"),
    ("Model Stability", f"model_stability_{dataset_key}.png"),
    ("Noise Sensitivity", f"noise_sensitivity_{dataset_key}.png"),
    ("Precision-Recall Curve", f"precision_recall_curve_{dataset_key}.png"),
    ("ROC Curve", f"roc_curve_{dataset_key}.png"),
    ("Overfitting Behavior", f"overfitting_behavior_{dataset_key}.png"),
    ("Metric Heatmap", f"metric_heatmap_{dataset_key}.png"),
]

st.subheader("Graphs")
for title, filename in plots:
    path = os.path.join(GRAPHS_DIR, dataset_key, filename)
    if os.path.exists(path):
        st.markdown(f"**{title}**")
        st.image(Image.open(path), use_container_width=True)

st.subheader("Confusion Matrices")
cm_dir = os.path.join(GRAPHS_DIR, dataset_key)
if os.path.exists(cm_dir):
    cm_files = sorted(
        filename for filename in os.listdir(cm_dir)
        if filename.startswith(f"confusion_matrix_{dataset_key}_") and filename.endswith(".png")
    )
    cols = st.columns(2)
    for idx, filename in enumerate(cm_files):
        with cols[idx % 2]:
            title = filename.replace(f"confusion_matrix_{dataset_key}_", "").replace(".png", "").replace("_", " ")
            st.markdown(f"**{title}**")
            st.image(Image.open(os.path.join(cm_dir, filename)), use_container_width=True)
