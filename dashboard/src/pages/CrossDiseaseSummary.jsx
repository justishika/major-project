import React, { useEffect, useState, useMemo } from 'react';
import { getBenchmarkResults, getBenchmarkSummary, getMetadata, computeOverviewStats, computeGlobalLeaderboard, DISEASES } from '../dataLoader';
import GraphCard from '../components/GraphCard';

const fmt = v => v != null ? (v * 100).toFixed(1) + '%' : '—';

/* ─── Horizontal accuracy bar ─── */
const AccuracyBar = ({ value, max = 1, color = '#2563EB' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
    <div style={{ flex: 1, height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', width: '44px', textAlign: 'right', flexShrink: 0 }}>
      {fmt(value)}
    </span>
  </div>
);

const MODEL_COLORS = { 'Hybrid (Classical+Quantum)': '#F59E0B', 'QK-SVM (Noiseless)': '#7C3AED', 'QK-SVM (Noisy)': '#8B5CF6', 'Random Forest': '#0EA5A4', 'SVM': '#0369A1', 'Logistic Regression': '#64748B' };

const CrossDiseaseSummary = () => {
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [selectedDisease, setSelectedDisease] = useState(null);

  useEffect(() => {
    Promise.all([getBenchmarkSummary(), getBenchmarkResults(), getMetadata()])
      .then(([, benchmark, meta]) => {
        setBenchmarkData(benchmark);
        setOverviewStats(computeOverviewStats(benchmark, meta));
        const lb = computeGlobalLeaderboard(benchmark);
        setLeaderboard(lb);
      });
  }, []);

  const bestModel  = leaderboard[0] || null;
  const secondModel = leaderboard[1] || null;

  /* Per-disease max accuracies for snapshot */
  const diseaseAccuracies = useMemo(() => {
    if (!benchmarkData.length) return [];
    const byDisease = {};
    benchmarkData.forEach(row => {
      const d = row['Dataset'], a = row['Accuracy'];
      if (d && a != null && (!byDisease[d] || a > byDisease[d])) byDisease[d] = a;
    });
    return Object.entries(byDisease)
      .map(([id, acc]) => {
        const info = DISEASES.find(d => d.id === id);
        return { id, name: info?.name || id, acc };
      })
      .sort((a, b) => b.acc - a.acc);
  }, [benchmarkData]);

  /* Model comparison per disease (for hover) */
  const modelPerformance = useMemo(() => {
    if (!benchmarkData.length || !leaderboard.length) return [];
    return leaderboard.map(item => ({
      model: item.model,
      accuracy: item.accuracy,
      category: item.category,
    }));
  }, [benchmarkData, leaderboard]);

  const maxAcc = diseaseAccuracies[0]?.acc || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingBottom: '6rem' }}>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — EDITORIAL HERO
      ═══════════════════════════════════════════════════════ */}
      <div style={{ padding: '4rem 0 3rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4rem' }}>
          <div style={{ flex: 1, maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
              <div style={{ width: '24px', height: '1px', background: '#2563EB' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563EB' }}>
                Research Platform
              </span>
            </div>
            <h1 style={{ fontSize: '3.75rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#0F172A', lineHeight: 1.05, marginBottom: '1.75rem' }}>
              Hybrid<br />
              Clinical<br />
              Intelligence
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#64748B', lineHeight: 1.8, maxWidth: '500px', marginBottom: '2.5rem' }}>
              A systematic benchmark comparing Classical, Quantum, and Hybrid ML for medical disease prediction across{' '}
              <span style={{ color: '#0F172A', fontWeight: 600 }}>
                {overviewStats ? `${overviewStats.totalProjectDiseases} clinical datasets` : '—'}
              </span>.
            </p>
            {/* Premium Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
              {[
                { v: overviewStats?.coreModelCount ?? '—', l: 'Models Compared', icon: '🧬' },
                { v: overviewStats?.totalExperiments ?? '—', l: 'Benchmark Experiments', icon: '🧪' },
                { v: overviewStats?.diseasesWithBenchmarkData ?? '—', l: 'Datasets with Results', icon: '📊' },
              ].map(stat => (
                <div key={stat.l} style={{ 
                  background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
                  transition: 'transform 0.2s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '1.2rem' }}>{stat.icon}</div>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>{stat.v}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Live benchmark indicator */}
          {benchmarkData.length > 0 && (
            <div style={{ flexShrink: 0, width: '220px' }}>
              <div style={{ padding: '0.5rem 0', borderBottom: '1px solid #E2E8F0', marginBottom: '0' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>
                  System Status
                </span>
              </div>
              {[
                { label: 'Data Pipeline', status: 'Active' },
                { label: 'Benchmark Results', status: 'Loaded' },
                { label: 'Quantum Circuits', status: 'Evaluated' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 0', borderBottom: '1px solid #F8FAFC' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
                    <span style={{ fontSize: '0.72rem', color: '#22C55E', fontWeight: 600 }}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div style={{ height: '1px', background: '#E2E8F0', margin: '0' }} />

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — PRIMARY DISCOVERY
          Large editorial — the #1 finding
      ═══════════════════════════════════════════════════════ */}
      {bestModel && (
        <div style={{ padding: '5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '24px',
            padding: '3.5rem',
            boxShadow: '0 20px 40px -10px rgba(245, 158, 11, 0.08), 0 1px 3px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(30%, -30%)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem', position: 'relative' }}>
              <div style={{ width: '24px', height: '1.5px', background: '#F59E0B' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B45309' }}>
                Primary Discovery
              </span>
            </div>
            <div style={{ fontSize: '5.5rem', fontWeight: 900, letterSpacing: '-0.05em', color: '#0F172A', lineHeight: 0.9, marginBottom: '1.5rem', position: 'relative' }}>
              {fmt(bestModel.accuracy)}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem', letterSpacing: '-0.02em', position: 'relative' }}>
              {bestModel.model.replace(' (Classical+Quantum)', '')}
            </div>
            <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.8, maxWidth: '440px', marginBottom: '2.5rem', position: 'relative' }}>
              The Hybrid Classical-Quantum stacking ensemble achieved the highest mean accuracy across all disease datasets, demonstrating that combining quantum kernel methods with classical ensembles produces measurable performance gains.
            </p>
            {secondModel && (
              <div style={{ padding: '1.5rem 0 0', borderTop: '1px solid rgba(15,23,42,0.06)', position: 'relative' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  Runner-Up
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.02em' }}>{fmt(secondModel.accuracy)}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>{secondModel.model}</div>
                </div>
              </div>
            )}
          </div>

          {/* Model comparison bars — no card wrapper */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '1.75rem' }}>
              Mean Accuracy · All Diseases
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {modelPerformance.slice(0, 6).map(item => (
                <div key={item.model}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: MODEL_COLORS[item.model] || '#94A3B8', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.825rem', color: '#0F172A', fontWeight: item === modelPerformance[0] ? 700 : 400 }}>
                        {item.model.replace(' (Classical+Quantum)', '')}
                      </span>
                    </div>
                  </div>
                  <AccuracyBar value={item.accuracy} color={MODEL_COLORS[item.model] || '#94A3B8'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Divider ─── */}
      <div style={{ height: '1px', background: '#E2E8F0' }} />

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — CROSS-DISEASE CHART
          Full-width, prominent
      ═══════════════════════════════════════════════════════ */}
      <div style={{ padding: '5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '24px', height: '1px', background: '#0EA5A4' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0D7377' }}>
                Performance Overview
              </span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>
              Cross-Disease Benchmark
            </h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', maxWidth: '300px', textAlign: 'right', lineHeight: 1.6 }}>
            All 6 models evaluated across every clinical dataset at maximum training size
          </p>
        </div>
        <GraphCard
          title="All Diseases · All Models · Accuracy Comparison"
          description="Grouped bar chart comparing model accuracy across all disease datasets."
          imageUrl="/results/graphs/cross_disease_summary.png"
          size="large"
        />
      </div>

      {/* ─── Divider ─── */}
      <div style={{ height: '1px', background: '#E2E8F0' }} />

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — DISEASE PERFORMANCE SNAPSHOT
          Editorial list — no cards
      ═══════════════════════════════════════════════════════ */}
      {diseaseAccuracies.length > 0 && (
        <div style={{ padding: '5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '24px', height: '1px', background: '#7C3AED' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C3AED' }}>
              Disease Snapshot
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F172A' }}>
              Peak Accuracy by Disease
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Best model performance per dataset</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {diseaseAccuracies.map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: 'grid', gridTemplateColumns: '28px 200px 1fr 60px',
                  alignItems: 'center', gap: '1.5rem',
                  padding: '1.125rem 0',
                  borderBottom: '1px solid #F8FAFC',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAFE'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', fontFamily: 'var(--font-mono)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '0.925rem', fontWeight: 600, color: '#0F172A' }}>{d.name}</span>
                <AccuracyBar value={d.acc} max={maxAcc} color={d.acc >= 0.9 ? '#22C55E' : d.acc >= 0.75 ? '#2563EB' : '#F59E0B'} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: d.acc >= 0.9 ? '#15803D' : '#0F172A', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                  {fmt(d.acc)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — RESEARCH CONTEXT
          Text-driven, editorial
      ═══════════════════════════════════════════════════════ */}
      <div style={{ height: '1px', background: '#E2E8F0' }} />
      <div style={{ padding: '5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4rem' }}>
        <div style={{ gridColumn: '1 / 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '24px', height: '1px', background: '#94A3B8' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8' }}>
              Methodology
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '1.25rem' }}>
            About the Research
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { step: '01', title: 'Data Preprocessing', body: 'StandardScaler normalization followed by PCA dimensionality reduction to 4 components for quantum feature encoding. MinMaxScaler to [−π, π] for Pauli rotation gates.' },
              { step: '02', title: 'Model Training', body: 'Classical baselines (SVM, Random Forest, Logistic Regression) trained alongside Quantum Kernel SVM using ZZFeatureMap with both noiseless and depolarizing noise simulation (p=0.01, 0.05).' },
              { step: '03', title: 'Hybrid Stacking Ensemble', body: 'RF + ExtraTrees + GradientBoosting + QK-SVM combined via a learned meta-learner. The stacking architecture leverages quantum feature expressibility with classical robustness.' },
            ].map(item => (
              <div key={item.step} style={{ padding: '1.5rem 0', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1', paddingTop: '0.2rem', flexShrink: 0 }}>{item.step}</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.375rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.7 }}>{item.body}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '24px', height: '1px', background: '#94A3B8' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8' }}>
              Technical Stack
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'Quantum Framework', value: 'Qiskit / PennyLane' },
              { label: 'Feature Map', value: 'ZZFeatureMap' },
              { label: 'Qubits', value: '4 (via PCA)' },
              { label: 'Classical Models', value: 'scikit-learn' },
              { label: 'Noise Model', value: 'Depolarizing (p=0.01)' },
              { label: 'Evaluation', value: '70 / 30 train/test' },
              { label: 'Metrics', value: 'Acc, Prec, Recall, F1, AUC' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 0', borderBottom: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{item.label}</span>
                <span style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossDiseaseSummary;
