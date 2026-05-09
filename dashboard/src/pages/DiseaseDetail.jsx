import React, { useEffect, useState } from 'react';
import { getDiseaseSummary, DISEASES } from '../dataLoader';
import MetricsTable from '../components/MetricsTable';
import GraphCard from '../components/GraphCard';

const DiseaseDetail = ({ diseaseId }) => {
  const [data, setData] = useState([]);
  const disease = DISEASES.find(d => d.id === diseaseId);

  useEffect(() => {
    const loadData = async () => {
      const summary = await getDiseaseSummary(diseaseId);
      setData(summary);
    };
    loadData();
  }, [diseaseId]);

  if (!disease) return null;

  return (
    <div className="flex-col gap-8" style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{disease.name}</h1>
        <p style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>Dataset specific analysis and model benchmarking</p>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <GraphCard 
          title="Accuracy vs Dataset Size"
          description="Illustrates how model accuracy scales as we provide more training data. Quantum models often show advantages at smaller sizes, while Classical models catch up as size increases."
          imageUrl={`/results/graphs/${diseaseId}/accuracy_vs_size_${diseaseId}.png`}
        />
        <GraphCard 
          title="Model Stability"
          description="Bar chart detailing the mean accuracy with standard deviation error bars. Smaller error bars indicate a more robust, stable model across multiple training splits."
          imageUrl={`/results/graphs/${diseaseId}/model_stability_${diseaseId}.png`}
        />
        <GraphCard 
          title="Noise Sensitivity"
          description="Demonstrates how the Quantum Kernel SVM degrades when depolarizing noise is injected, comparing its decay curve against the robust SVM baseline."
          imageUrl={`/results/graphs/${diseaseId}/noise_sensitivity_${diseaseId}.png`}
        />
        <GraphCard 
          title="Overfitting Behavior"
          description="Compares Training Accuracy vs Testing Accuracy to visualize the Generalization Gap and identify models that overfit."
          imageUrl={`/results/graphs/${diseaseId}/overfitting_behavior_${diseaseId}.png`}
        />
        <GraphCard 
          title="ROC Curve"
          description="Receiver Operating Characteristic curve. A higher Area Under Curve (AUC) indicates superior ability to distinguish between classes (e.g., diseased vs healthy)."
          imageUrl={`/results/graphs/${diseaseId}/roc_curve_${diseaseId}.png`}
        />
        <GraphCard 
          title="Precision-Recall Curve"
          description="Critical for medical datasets with class imbalance. Highlights the tradeoff between false positives and false negatives."
          imageUrl={`/results/graphs/${diseaseId}/precision_recall_curve_${diseaseId}.png`}
        />
        <GraphCard 
          title="Metric Heatmap"
          description="Comprehensive correlation and performance heatmap across all extracted metrics at the maximum dataset size."
          imageUrl={`/results/graphs/${diseaseId}/metric_heatmap_${diseaseId}.png`}
        />
        <GraphCard 
          title="Generalization Gap vs Size"
          description="Plots the difference between train and test accuracy as the dataset size grows."
          imageUrl={`/results/graphs/${diseaseId}/generalization_gap_vs_size_${diseaseId}.png`}
        />
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Individual Metrics</h2>
        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
          <GraphCard title="F1-Score" description="" imageUrl={`/results/graphs/${diseaseId}/f1_score_vs_size_${diseaseId}.png`} />
          <GraphCard title="ROC-AUC" description="" imageUrl={`/results/graphs/${diseaseId}/roc_auc_vs_size_${diseaseId}.png`} />
          <GraphCard title="Precision" description="" imageUrl={`/results/graphs/${diseaseId}/precision_vs_size_${diseaseId}.png`} />
          <GraphCard title="Recall" description="" imageUrl={`/results/graphs/${diseaseId}/recall_vs_size_${diseaseId}.png`} />
          <GraphCard title="Sensitivity" description="" imageUrl={`/results/graphs/${diseaseId}/sensitivity_vs_size_${diseaseId}.png`} />
          <GraphCard title="Specificity" description="" imageUrl={`/results/graphs/${diseaseId}/specificity_vs_size_${diseaseId}.png`} />
          <GraphCard title="Train Accuracy" description="" imageUrl={`/results/graphs/${diseaseId}/train_accuracy_vs_size_${diseaseId}.png`} />
          <GraphCard title="Runtime (s)" description="" imageUrl={`/results/graphs/${diseaseId}/runtime_s_vs_size_${diseaseId}.png`} />
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Confusion Matrices</h2>
        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
          <GraphCard title="Hybrid Model" description="Classical + Quantum Stacking" imageUrl={`/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_Hybrid_Classical+Quantum.png`} />
          <GraphCard title="QK-SVM (Noiseless)" description="Pure Quantum Kernel" imageUrl={`/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_QK-SVM_Noiseless.png`} />
          <GraphCard title="QK-SVM (Noisy)" description="Quantum Kernel with Depolarizing Noise" imageUrl={`/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_QK-SVM_Noisy.png`} />
          <GraphCard title="SVM" description="Classical Support Vector Machine" imageUrl={`/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_SVM.png`} />
          <GraphCard title="Random Forest" description="Classical Ensemble" imageUrl={`/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_Random_Forest.png`} />
          <GraphCard title="Logistic Regression" description="Classical Baseline" imageUrl={`/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_Logistic_Regression.png`} />
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Performance Summary Metrics</h2>
        <MetricsTable data={data} />
      </div>
    </div>
  );
};

export default DiseaseDetail;
