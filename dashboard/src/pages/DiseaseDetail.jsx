import React, { useEffect, useState } from 'react';
import { getDiseaseSummary, getMetadata, getMetadataForDisease, getBenchmarkResults, DISEASES } from '../dataLoader';
import MetricsTable from '../components/MetricsTable';
import GraphCard from '../components/GraphCard';

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

/* ── Confusion matrix URL builder ── */
function confusionMatrixUrl(diseaseId, suffix) {
  return `/results/graphs/${diseaseId}/confusion_matrix_${diseaseId}_${suffix}.png`;
}

const DiseaseDetail = ({ diseaseId }) => {
  const [data, setData]           = useState([]);
  const [tab, setTab]             = useState('key');
  const [metadata, setMetadata]   = useState(null);
  const [diseaseMeta, setDiseaseMeta] = useState(null);
  const [hasBenchmarkData, setHasBenchmarkData] = useState(null); // null = loading

  const disease = DISEASES.find(d => d.id === diseaseId);

  useEffect(() => {
    setTab('key');
    setHasBenchmarkData(null);

    // Load per-disease summary CSV
    getDiseaseSummary(diseaseId).then(d => {
      setData(d);
      setHasBenchmarkData(d.length > 0);
    });

    // Load metadata for this disease
    getMetadata().then(meta => {
      setMetadata(meta);
      const dm = getMetadataForDisease(meta, diseaseId);
      setDiseaseMeta(dm);
    });
  }, [diseaseId]);

  if (!disease) return null;

  const gUrl = (suffix) => `/results/graphs/${diseaseId}/${suffix}_${diseaseId}.png`;

  // Check if disease has any graphs by trying to load key graph
  const hasGraphs = hasBenchmarkData !== false;

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
        {/* Accent glow */}
        <div style={{
          position: 'absolute', top: '-30px', right: '2rem',
          width: '180px', height: '180px', borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', position: 'relative' }}>
          {/* Large emoji icon */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', flexShrink: 0,
          }}>
            {disease.icon || '🔬'}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.25rem', marginBottom: '0.4rem' }}>{disease.name}</h1>
            <p style={{ marginBottom: '1.25rem', fontSize: '0.95rem' }}>
              Dataset-specific analysis across 6 models · Hybrid Classical-Quantum Benchmark
            </p>

            {/* Meta pills — from metadata.json, not hardcoded */}
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {diseaseMeta ? (
                <>
                  <span className="badge badge-classical">📦 {diseaseMeta.samples} samples</span>
                  <span className="badge badge-quantum">🔢 {diseaseMeta.features} features</span>
                  <span className="badge badge-neutral">⚖ Imbalance: {diseaseMeta.imbalanceRatio}</span>
                  <span className="badge badge-hybrid">⚛ 4 PCA qubits</span>
                  <span className="badge badge-neutral">70/30 train/test split</span>
                </>
              ) : (
                <>
                  <span className="badge badge-hybrid">⚛ 4 PCA qubits</span>
                  <span className="badge badge-neutral">70/30 train/test split</span>
                </>
              )}
            </div>

            {/* Data availability indicator */}
            <div style={{ marginTop: '0.75rem' }}>
              {hasBenchmarkData === true && (
                <span className="data-status available">
                  <span className="status-dot" /> Benchmark data available
                </span>
              )}
              {hasBenchmarkData === false && (
                <span className="data-status unavailable">
                  <span className="status-dot" /> No benchmark data — run pipeline with: python main.py -d {diseaseId}
                </span>
              )}
              {hasBenchmarkData === null && (
                <span className="data-status unavailable">
                  <span className="status-dot" /> Loading...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dataset Info from metadata.json ────────────────── */}
      {diseaseMeta && (
        <div className="grid grid-cols-2 gap-4">
          {/* PCA Variance */}
          {diseaseMeta.pcaVarianceMap && (
            <div className="card-static" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--quantum-light)' }}>📐</span> PCA Variance Explained
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(diseaseMeta.pcaVarianceMap).map(([components, variance]) => (
                  <div key={components} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: '80px', fontFamily: 'var(--font-mono)' }}>
                      {components} comp.
                    </span>
                    <div style={{
                      flex: 1, height: '8px', borderRadius: '4px',
                      background: 'var(--bg-elevated)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${variance}%`, height: '100%',
                        borderRadius: '4px',
                        background: `linear-gradient(90deg, var(--quantum), var(--quantum-light))`,
                        transition: 'width 0.5s var(--ease)',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', width: '50px', textAlign: 'right' }}>
                      {variance}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="source-tag" style={{ marginTop: '0.75rem' }}>📁 metadata.json</div>
            </div>
          )}

          {/* Clinical Features */}
          {diseaseMeta.clinicalFeatures && (
            <div className="card-static" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--classical)' }}>🏷</span> Clinical Features (Sample)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {diseaseMeta.clinicalFeatures.map((f, i) => (
                  <span key={i} style={{
                    padding: '0.35rem 0.75rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {f}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing {diseaseMeta.clinicalFeatures.length} of {diseaseMeta.features} total features
              </div>
              <div className="source-tag" style={{ marginTop: '0.5rem' }}>📁 metadata.json</div>
            </div>
          )}
        </div>
      )}

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
        hasGraphs ? (
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
        ) : (
          <div className="no-data-state">
            <div className="no-data-icon">📈</div>
            <div className="no-data-title">No Graphs Available</div>
            <div className="no-data-desc">
              Run the benchmark pipeline for this disease to generate graphs:<br />
              <code>python main.py -d {diseaseId}</code>
            </div>
          </div>
        )
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
            <>
              <MetricsTable data={data} title={`Performance Summary · ${disease.name}`} />
              <div className="source-tag" style={{ marginTop: '0.5rem' }}>
                📁 Source: results/data/summary_{diseaseId}.csv
              </div>
            </>
          ) : (
            <div className="no-data-state">
              <div className="no-data-icon">📋</div>
              <div className="no-data-title">Summary Data Not Available</div>
              <div className="no-data-desc">
                Run the benchmark pipeline to generate summary data:<br />
                <code>python main.py -d {diseaseId}</code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiseaseDetail;
