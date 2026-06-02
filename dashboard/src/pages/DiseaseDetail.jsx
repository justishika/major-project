import React, { useEffect, useState } from 'react';
import { getDiseaseSummary, DISEASES } from '../dataLoader';
import MetricsTable from '../components/MetricsTable';
import GraphCard from '../components/GraphCard';

/* ── Disease metadata ────────────────────────────── */
const DISEASE_META = {
  parkinsons:        { icon: '🧠', samples: 195, features: '22 vocal', color: '#a78bfa' },
  breast_cancer:     { icon: '🩺', samples: 400, features: '30 cell nuclei', color: '#f472b6' },
  hepatitis_c:       { icon: '🫀', samples: 120, features: '19 serology', color: '#fb923c' },
  heart_disease:     { icon: '❤️', samples: 220, features: '13 clinical', color: '#f87171' },
  mammographic_mass: { icon: '🔬', samples: 500, features: '5 BI-RADS', color: '#e879f9' },
  thyroid_disease:   { icon: '⚗️', samples: 500, features: '29 lab panel', color: '#34d399' },
  indian_liver:      { icon: '🫁', samples: 400, features: '10 enzymes', color: '#fbbf24' },
  chronic_kidney:    { icon: '🧫', samples: 350, features: '25 blood panel', color: '#60a5fa' },
  wilsons_disease:   { icon: '🧬', samples: 250, features: '8 copper markers', color: '#a3e635' },
  als:               { icon: '⚡', samples: 250, features: '8 neurological', color: '#22d3ee' },
  acute_nephritis:   { icon: '💊', samples: 120, features: '6 clinical', color: '#f97316' },
  heart_failure:     { icon: '🫶', samples: 299, features: '13 clinical', color: '#ec4899' },
};

/* ── Tab definitions ─────────────────────────────── */
const TABS = [
  { id: 'key',        label: '📈 Key Graphs' },
  { id: 'metrics',    label: '📊 Individual Metrics' },
  { id: 'matrices',   label: '🔲 Confusion Matrices' },
  { id: 'table',      label: '📋 Summary Table' },
];

/* ── Graph definitions per tab ───────────────────── */
const KEY_GRAPHS = [
  { key: 'accuracy_vs_size',       title: 'Accuracy vs Dataset Size',   desc: 'How accuracy scales as training data grows. Quantum models often show advantages at smaller N.' },
  { key: 'model_stability',        title: 'Model Stability',            desc: 'Mean accuracy ± std error bars. Smaller bars = more robust model across splits.' },
  { key: 'noise_sensitivity',      title: 'Noise Sensitivity',          desc: 'QK-SVM performance under depolarizing noise vs. classical SVM baseline.' },
  { key: 'overfitting_behavior',   title: 'Overfitting Behavior',       desc: 'Train vs. test accuracy. Gap reveals generalization quality.' },
  { key: 'roc_curve',              title: 'ROC Curve',                  desc: 'Area Under Curve measures class-discrimination power. AUC=1.0 is perfect.' },
  { key: 'precision_recall_curve', title: 'Precision-Recall Curve',     desc: 'Critical for imbalanced medical datasets — highlights false positive vs. false negative tradeoffs.' },
  { key: 'metric_heatmap',         title: 'Metric Heatmap',             desc: 'All metrics at maximum dataset size — quick model vs. metric overview.' },
  { key: 'generalization_gap_vs_size', title: 'Generalization Gap vs Size', desc: 'Train − Test accuracy as N grows. Converging gap = model generalizes well.' },
];

const METRIC_GRAPHS = [
  { key: 'f1_score_vs_size',      title: 'F1-Score vs Size' },
  { key: 'roc_auc_vs_size',       title: 'ROC-AUC vs Size' },
  { key: 'precision_vs_size',     title: 'Precision vs Size' },
  { key: 'recall_vs_size',        title: 'Recall vs Size' },
  { key: 'sensitivity_vs_size',   title: 'Sensitivity vs Size' },
  { key: 'specificity_vs_size',   title: 'Specificity vs Size' },
  { key: 'train_accuracy_vs_size',title: 'Train Accuracy vs Size' },
  { key: 'runtime_s_vs_size',     title: 'Runtime (s) vs Size' },
];

const MATRIX_MODELS = [
  { suffix: 'Hybrid_Classical+Quantum', title: 'Hybrid (Classical+Quantum)', type: 'hybrid',    desc: 'Stacking ensemble' },
  { suffix: 'QK-SVM_Noiseless',         title: 'QK-SVM (Noiseless)',         type: 'quantum',   desc: 'Pure quantum kernel' },
  { suffix: 'QK-SVM_Noisy',             title: 'QK-SVM (Noisy)',             type: 'quantum',   desc: 'With depolarizing noise' },
  { suffix: 'SVM',                      title: 'SVM',                        type: 'classical', desc: 'Classical kernel SVM' },
  { suffix: 'Random_Forest',            title: 'Random Forest',              type: 'classical', desc: 'Classical ensemble' },
  { suffix: 'Logistic_Regression',      title: 'Logistic Regression',        type: 'classical', desc: 'Classical linear baseline' },
];

/* ── Hybrid confusion matrix has two naming variants ── */
function confusionMatrixUrl(diseaseId, suffix) {
  if (suffix === 'Hybrid_Classical+Quantum') {
    // Try both variants
    return `/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_Hybrid_Classical+Quantum.png`;
  }
  return `/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_${suffix}.png`;
}

const DiseaseDetail = ({ diseaseId }) => {
  const [data, setData]   = useState([]);
  const [tab, setTab]     = useState('key');

  const disease = DISEASES.find(d => d.id === diseaseId);
  const meta    = DISEASE_META[diseaseId] || {};

  useEffect(() => {
    setTab('key');
    getDiseaseSummary(diseaseId).then(setData);
  }, [diseaseId]);

  if (!disease) return null;

  const gUrl = (suffix) => `/results/graphs/${diseaseId}/${suffix}_${diseaseId}.png`;

  return (
    <div className="flex-col gap-8" style={{ paddingBottom: '4rem' }}>

      {/* ── Page Header ──────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        padding: '2rem 2.5rem',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
      }}>
        {/* Accent glow behind icon */}
        <div style={{
          position: 'absolute', top: '-30px', right: '2rem',
          width: '180px', height: '180px', borderRadius: '50%',
          background: `radial-gradient(ellipse, ${meta.color || 'var(--quantum)'}20 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', position: 'relative' }}>
          {/* Large emoji icon */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: `${meta.color || 'var(--quantum)'}15`,
            border: `1px solid ${meta.color || 'var(--quantum)'}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0,
          }}>
            {meta.icon || '🔬'}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.25rem', marginBottom: '0.4rem' }}>{disease.name}</h1>
            <p style={{ marginBottom: '1.25rem', fontSize: '0.95rem' }}>
              Dataset-specific analysis across 6 models · Hybrid Classical-Quantum Benchmark
            </p>

            {/* Meta pills */}
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {meta.samples && (
                <span className="badge badge-classical">📦 {meta.samples} samples</span>
              )}
              {meta.features && (
                <span className="badge badge-quantum">🔢 {meta.features} features</span>
              )}
              <span className="badge badge-hybrid">⚛ 4 PCA qubits</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                70/30 train/test split
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div>
        <div className="tab-list" style={{ overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────── */}

      {/* KEY GRAPHS */}
      {tab === 'key' && (
        <div className="grid grid-cols-2 gap-6 stagger animate-slide-up">
          {KEY_GRAPHS.map(g => (
            <GraphCard
              key={g.key}
              title={g.title}
              description={g.desc}
              imageUrl={gUrl(g.key)}
            />
          ))}
        </div>
      )}

      {/* INDIVIDUAL METRICS */}
      {tab === 'metrics' && (
        <div>
          <div style={{
            padding: '0.875rem 1.25rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>ℹ</span>
            All metrics plotted against dataset size (N). Each line represents one model.
            Quantum models in <span style={{ color: 'var(--quantum-light)' }}>purple</span>,
            Classical in <span style={{ color: 'var(--classical)' }}>cyan</span>,
            Hybrid in <span style={{ color: 'var(--hybrid)' }}>gold</span>.
          </div>
          <div className="grid grid-cols-3 gap-4 stagger animate-slide-up">
            {METRIC_GRAPHS.map(g => (
              <GraphCard key={g.key} title={g.title} imageUrl={gUrl(g.key)} size="small" />
            ))}
          </div>
        </div>
      )}

      {/* CONFUSION MATRICES */}
      {tab === 'matrices' && (
        <div>
          <div style={{
            padding: '0.875rem 1.25rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>ℹ</span>
            Confusion matrices at maximum dataset size (N_max). Diagonal = correct predictions.
          </div>
          <div className="grid grid-cols-3 gap-4 stagger animate-slide-up">
            {MATRIX_MODELS.map(m => (
              <GraphCard
                key={m.suffix}
                title={m.title}
                description={m.desc}
                imageUrl={confusionMatrixUrl(diseaseId, m.suffix)}
                size="small"
              />
            ))}
          </div>
        </div>
      )}

      {/* SUMMARY TABLE */}
      {tab === 'table' && (
        <div className="animate-slide-up">
          {data.length > 0 ? (
            <MetricsTable data={data} title={`Performance Summary · ${disease.name}`} />
          ) : (
            <div style={{
              textAlign: 'center', padding: '4rem',
              color: 'var(--text-muted)', fontSize: '0.9rem',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
              Summary CSV not found. Run the benchmark pipeline first.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiseaseDetail;
