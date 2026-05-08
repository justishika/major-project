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
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Performance Summary Metrics</h2>
        <MetricsTable data={data} />
      </div>
    </div>
  );
};

export default DiseaseDetail;
