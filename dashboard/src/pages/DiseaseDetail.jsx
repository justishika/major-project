import React, { useEffect, useState } from 'react';
import { getDiseaseSummary, getMetadata, getMetadataForDisease, DISEASES } from '../dataLoader';
import { ChevronDown, Beaker, FileText, BarChart } from 'lucide-react';
import MetricsTable from '../components/MetricsTable';
import GraphCard from '../components/GraphCard';

const METRICS = [
  { id: 'accuracy_vs_size',           label: 'Accuracy Progression' },
  { id: 'model_stability',            label: 'Model Stability' },
  { id: 'noise_sensitivity',          label: 'Noise Sensitivity' },
  { id: 'overfitting_behavior',       label: 'Overfitting Behavior' },
  { id: 'roc_curve',                  label: 'ROC Curve' },
  { id: 'precision_recall_curve',     label: 'Precision-Recall Curve' },
  { id: 'metric_heatmap',             label: 'Metrics Heatmap' },
  { id: 'generalization_gap_vs_size', label: 'Generalization Gap vs Size' },
  { id: 'f1_score_vs_size',           label: 'F1 Score vs Size' },
  { id: 'roc_auc_vs_size',            label: 'ROC AUC vs Size' },
  { id: 'precision_vs_size',          label: 'Precision vs Size' },
  { id: 'recall_vs_size',             label: 'Recall vs Size' },
  { id: 'sensitivity_vs_size',        label: 'Sensitivity vs Size' },
  { id: 'specificity_vs_size',        label: 'Specificity vs Size' },
  { id: 'train_accuracy_vs_size',     label: 'Train Accuracy vs Size' },
  { id: 'runtime_s_vs_size',          label: 'Runtime (s) vs Size' },
];

const MATRIX_MODELS = [
  { suffix: 'Hybrid_Classical+Quantum', label: 'Hybrid Meta-Learner' },
  { suffix: 'QK-SVM_Noiseless',         label: 'QK-SVM (Noiseless)' },
  { suffix: 'QK-SVM_Noisy',             label: 'QK-SVM (Noisy)' },
  { suffix: 'SVM',                      label: 'SVM' },
  { suffix: 'Logistic_Regression',      label: 'Logistic Regression' },
  { suffix: 'Random_Forest',            label: 'Random Forest' },
];

const fmt = v => v != null ? (v * 100).toFixed(1) + '%' : '—';

const DiseaseDetail = ({ diseaseId }) => {
  const [data, setData]               = useState([]);
  const [diseaseMeta, setDiseaseMeta] = useState(null);
  const [hasBenchmarkData, setHasBenchmarkData] = useState(null);
  const [activeMetric, setActiveMetric] = useState(METRICS[0].id);
  const [activeMatrix, setActiveMatrix] = useState(MATRIX_MODELS[0].suffix);

  const disease = DISEASES.find(d => d.id === diseaseId);

  useEffect(() => {
    setActiveMetric(METRICS[0].id);
    setActiveMatrix(MATRIX_MODELS[0].suffix);
    setHasBenchmarkData(null);
    getDiseaseSummary(diseaseId).then(d => { setData(d); setHasBenchmarkData(d.length > 0); });
    getMetadata().then(meta => { setDiseaseMeta(getMetadataForDisease(meta, diseaseId)); });
  }, [diseaseId]);

  if (!disease) return null;

  const gUrl = suffix => `/results/graphs/${diseaseId}/${suffix}_${diseaseId}.png`;
  const cmUrl = suffix => `/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_${suffix}.png`;

  // Best model logic
  const maxAcc = data.length ? Math.max(...data.map(d => d['Accuracy'] || 0)) : null;
  const bestModelRow = data.find(d => d['Accuracy'] === maxAcc);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '8rem' }}>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — RESEARCH CASE STUDY HERO
      ═══════════════════════════════════════════════════════ */}
      <div style={{ padding: '4rem 0 3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '24px', height: '1px', background: '#0F172A' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F172A' }}>
            Clinical Case Study
          </span>
        </div>
        <h1 style={{ fontSize: '3.75rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#0F172A', lineHeight: 1.05, marginBottom: '1.5rem' }}>
          {disease.name}
        </h1>

        {/* Clinical Meta */}
        {diseaseMeta && (
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '1.5rem 0' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '0.25rem' }}>Patient Samples</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{diseaseMeta.samples}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '0.25rem' }}>Features</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{diseaseMeta.features}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '0.25rem' }}>Class Imbalance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{diseaseMeta.imbalanceRatio}</div>
            </div>
          </div>
        )}

        {/* Primary Insight */}
        {hasBenchmarkData === true && bestModelRow && (
          <div style={{ background: '#F8FAFC', padding: '2rem', borderLeft: '4px solid #0F172A' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', marginBottom: '0.75rem' }}>Primary Benchmark Finding</div>
            <div style={{ fontSize: '1.25rem', color: '#0F172A', lineHeight: 1.6 }}>
              The <strong style={{ color: '#F59E0B' }}>{bestModelRow['Model']}</strong> model achieved the highest predictive accuracy of <strong style={{ fontFamily: 'var(--font-mono)' }}>{fmt(maxAcc)}</strong> at maximum dataset size, demonstrating superior pattern recognition for this specific pathology compared to standalone classical baselines.
            </div>
          </div>
        )}
        
        {hasBenchmarkData === false && (
          <div style={{ padding: '2rem', background: '#FEE2E2', color: '#991B1B', borderLeft: '4px solid #EF4444' }}>
            No benchmark data generated. Please run the pipeline for this dataset.
          </div>
        )}
      </div>

      {hasBenchmarkData === true && (
        <>
          {/* ═══════════════════════════════════════════════════════
              SECTION 2 — INTERACTIVE CHART (ONE AT A TIME)
          ═══════════════════════════════════════════════════════ */}
          <div style={{ padding: '3rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>Performance Analytics</h2>
                <div style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.25rem' }}>Visualize metric progression and model stability</div>
              </div>
              
              {/* Switcher */}
              <div style={{ position: 'relative' }}>
                <select
                  value={activeMetric}
                  onChange={e => setActiveMetric(e.target.value)}
                  style={{
                    appearance: 'none', padding: '0.75rem 1rem', paddingRight: '2.5rem',
                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px',
                    fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <ChevronDown size={14} color="#64748B" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
            
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <GraphCard 
                title={METRICS.find(m => m.id === activeMetric)?.label} 
                imageUrl={gUrl(activeMetric)} 
                size="large" 
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              SECTION 3 — CONFUSION MATRICES
          ═══════════════════════════════════════════════════════ */}
          <div style={{ padding: '4rem 0', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>Diagnostic Matrices</h2>
                <div style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.25rem' }}>True vs Predicted distributions at maximum N</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {MATRIX_MODELS.map(m => (
                  <button
                    key={m.suffix}
                    onClick={() => setActiveMatrix(m.suffix)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                      background: activeMatrix === m.suffix ? '#020617' : '#F1F5F9',
                      color: activeMatrix === m.suffix ? '#FFFFFF' : '#64748B',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '600px' }}>
                <GraphCard 
                  title={MATRIX_MODELS.find(m => m.suffix === activeMatrix)?.label} 
                  imageUrl={cmUrl(activeMatrix)} 
                  size="large" 
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              SECTION 4 — SUMMARY TABLE & INTERPRETATION
          ═══════════════════════════════════════════════════════ */}
          <div style={{ padding: '4rem 0', borderTop: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A', marginBottom: '2rem' }}>Clinical Data Summary</h2>
            <MetricsTable data={data} title="Model Performance Comparison" />
          </div>
          
        </>
      )}
    </div>
  );
};

export default DiseaseDetail;
