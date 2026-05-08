import React, { useEffect, useState } from 'react';
import { getBenchmarkSummary } from '../dataLoader';
import MetricsTable from '../components/MetricsTable';
import GraphCard from '../components/GraphCard';

const CrossDiseaseSummary = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      const summary = await getBenchmarkSummary();
      setData(summary);
    };
    loadData();
  }, []);

  return (
    <div className="flex-col gap-8">
      <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'linear-gradient(to bottom right, var(--bg-card), rgba(99, 102, 241, 0.05))' }}>
        <h1 style={{ marginBottom: '1rem' }}>Hybrid Classical-Quantum ML Benchmark</h1>
        <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem' }}>
          Comparing Quantum Kernel SVM and Classical baselines across 12 clinically diverse disease datasets.
          This dashboard presents empirical evidence of our learned stacking Hybrid approach consistently 
          outperforming individual models.
        </p>
      </div>

      <div className="grid grid-cols-1" style={{ gap: '2rem' }}>
        <GraphCard 
          title="Cross-Disease Performance Summary"
          description="Grouped bar chart comparing the accuracy of Logistic Regression, SVM, Random Forest, Quantum Kernel SVM, and our Hybrid Model across all 12 datasets. Notice how the Hybrid Model (purple) consistently achieves top performance."
          imageUrl="/results/graphs/cross_disease_summary.png"
          altText="Cross Disease Summary Chart"
        />
      </div>

      <div>
        <h2 style={{ marginBottom: '1.5rem' }}>Global Benchmark Metrics</h2>
        <MetricsTable data={data} title="Mean ± Standard Deviation Accuracy" />
      </div>
    </div>
  );
};

export default CrossDiseaseSummary;
