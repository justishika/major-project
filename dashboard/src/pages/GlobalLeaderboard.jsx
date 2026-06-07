import React, { useEffect, useState } from 'react';
import { getBenchmarkResults, computeGlobalLeaderboard, getModelCategory, getDiseaseDisplayName } from '../dataLoader';

const fmt    = v => v != null ? (v * 100).toFixed(2) + '%' : '—';
const fmtRaw = v => v != null ? v.toFixed(4) : '—';

const TYPE_COLOR = { hybrid: '#F59E0B', quantum: '#7C3AED', classical: '#0EA5A4' };
const TYPE_LABEL = { hybrid: 'Hybrid', quantum: 'Quantum', classical: 'Classical' };

const RANK_META = {
  1: { label: '#1',  ring: '#F59E0B', size: '5rem',   accent: '#D97706' },
  2: { label: '#2',  ring: '#94A3B8', size: '4rem',   accent: '#64748B' },
  3: { label: '#3',  ring: '#0EA5A4', size: '3.5rem', accent: '#0D7377' },
};

/* Horizontal metric bar */
const MetricBar = ({ label, value, max, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
      <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{fmt(value)}</span>
    </div>
    <div style={{ height: '3px', background: '#F1F5F9', borderRadius: '2px' }}>
      <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  </div>
);

const GlobalLeaderboard = () => {
  const [leaderboard, setLeaderboard]     = useState([]);
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [expandedModel, setExpandedModel] = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    getBenchmarkResults().then(data => {
      setBenchmarkData(data);
      setLeaderboard(computeGlobalLeaderboard(data));
      setLoading(false);
    });
  }, []);

  const getPerDiseaseBreakdown = modelName => {
    if (!benchmarkData.length) return [];
    const diseaseMaxSize = {};
    benchmarkData.forEach(row => {
      const ds = row['Dataset'], sz = row['Dataset Size'];
      if (ds && sz != null) diseaseMaxSize[ds] = Math.max(diseaseMaxSize[ds] || 0, sz);
    });
    return Object.entries(diseaseMaxSize).map(([disease, maxSize]) => {
      const row = benchmarkData.find(r => {
        if (r['Dataset'] !== disease || r['Model'] !== modelName || r['Dataset Size'] !== maxSize) return false;
        const n = r['Noise Level'];
        if (modelName === 'QK-SVM (Noisy)' || modelName === 'Hybrid (Classical+Quantum)') return n === 0.01;
        return n === 0.0 || n === 0;
      });
      return { disease, displayName: getDiseaseDisplayName(disease), accuracy: row?.['Accuracy'] ?? null, f1: row?.['F1-score'] ?? null, rocAuc: row?.['ROC-AUC'] ?? null, datasetSize: maxSize };
    }).sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
  };

  if (loading) return (
    <div style={{ paddingTop: '4rem' }}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '2px', marginBottom: '3rem', width: '200px' }} />
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '2px', width: '320px', marginBottom: '1rem' }} />
    </div>
  );

  if (!leaderboard.length) return (
    <div style={{ paddingTop: '4rem', color: '#94A3B8', textAlign: 'center' }}>No benchmark data available.</div>
  );

  const maxAcc  = Math.max(...leaderboard.map(l => l.accuracy  || 0));
  const maxPrec = Math.max(...leaderboard.map(l => l.precision || 0));
  const maxRec  = Math.max(...leaderboard.map(l => l.recall    || 0));
  const maxF1   = Math.max(...leaderboard.map(l => l.f1        || 0));
  const maxAuc  = Math.max(...leaderboard.map(l => l.rocAuc    || 0));
  const winner  = leaderboard[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '6rem' }}>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — PAGE HEADER
      ═══════════════════════════════════════════════════════ */}
      <div style={{ padding: '4rem 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <div style={{ width: '24px', height: '1px', background: '#2563EB' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563EB' }}>
            Global Rankings
          </span>
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#0F172A', lineHeight: 1.05, marginBottom: '1rem' }}>
          Benchmark<br />Leaderboard
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '480px', lineHeight: 1.75, paddingBottom: '3.5rem', borderBottom: '1px solid #E2E8F0' }}>
          Models ranked by mean accuracy across all disease datasets at maximum training size. Rankings computed dynamically from benchmark results.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — PODIUM (asymmetric layout)
      ═══════════════════════════════════════════════════════ */}
      <div style={{ padding: '5rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'start' }}>

        {/* Left — Winner deep dive */}
        {/* Left — Winner deep dive */}
        <div style={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 20px 40px -10px rgba(245, 158, 11, 0.15)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ width: '24px', height: '2px', background: '#F59E0B' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B45309' }}>
              Champion
            </span>
          </div>
          <div style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#D97706', lineHeight: 0.9, marginBottom: '1rem', position: 'relative' }}>
            {fmt(winner.accuracy)}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', position: 'relative' }}>
            {winner.model.replace(' (Classical+Quantum)', '')}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#B45309', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '2.5rem', position: 'relative' }}>
            {TYPE_LABEL[winner.category]} · {winner.diseaseCount} Diseases
          </div>

          {/* Winner metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <MetricBar label="Accuracy"  value={winner.accuracy}  max={maxAcc}  color="#F59E0B" />
            <MetricBar label="Precision" value={winner.precision} max={maxPrec} color="#F59E0B" />
            <MetricBar label="Recall"    value={winner.recall}    max={maxRec}  color="#F59E0B" />
            <MetricBar label="F1-Score"  value={winner.f1}        max={maxF1}   color="#F59E0B" />
            <MetricBar label="ROC-AUC"   value={winner.rocAuc}    max={maxAuc}  color="#F59E0B" />
          </div>
        </div>

        {/* Right — Other podium + why winner leads */}
        <div>
          {/* 2nd and 3rd */}
          {leaderboard.slice(1, 3).map((item, i) => {
            const meta = RANK_META[item.rank];
            const cat  = TYPE_COLOR[item.category];
            return (
              <div key={item.model} style={{ 
                padding: '1.5rem', 
                background: '#ffffff',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                marginBottom: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: '#CBD5E1', paddingTop: '0.25rem', width: '24px', flexShrink: 0 }}>
                    {String(item.rank).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{item.model.replace(' (Classical+Quantum)', '')}</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: meta.accent, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{fmt(item.accuracy)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat }} />
                      <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>{TYPE_LABEL[item.category]} · {item.diseaseCount} diseases</span>
                    </div>
                    <div style={{ marginTop: '1rem', height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                      <div style={{ width: `${(item.accuracy / winner.accuracy) * 100}%`, height: '100%', background: cat, borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Why hybrid wins */}
          <div style={{ marginTop: '2.5rem', padding: '1.75rem', background: '#F8FAFC', borderRadius: '12px', borderLeft: '3px solid #F59E0B' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              Why the Hybrid Model Leads
            </div>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>
              The stacking ensemble leverages quantum kernel expressibility in the feature space alongside classical model robustness. QK-SVM contributes non-linear quantum separability while RF and GradientBoosting handle noise and overfitting — the combination is greater than the sum of its parts.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div style={{ height: '1px', background: '#E2E8F0' }} />

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — COMPLETE RANKINGS TABLE
      ═══════════════════════════════════════════════════════ */}
      <div style={{ padding: '4rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Complete Rankings
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{leaderboard.length} models · {leaderboard[0]?.diseaseCount || 0} diseases</span>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', background: '#ffffff' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['', 'Model', 'Type', 'Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC', ''].map((h, i) => (
                    <th key={i} style={{ padding: '0.875rem 1.25rem', textAlign: i <= 1 ? 'left' : 'left', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, idx) => {
                  const cat = TYPE_COLOR[item.category];
                  const isExpanded = expandedModel === item.model;
                  const breakdown  = isExpanded ? getPerDiseaseBreakdown(item.model) : [];
                  return (
                    <React.Fragment key={item.model}>
                      <tr style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s', background: idx % 2 === 0 ? '#FFFFFF' : '#FDFDFE' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#FDFDFE'}
                      >
                        <td style={{ padding: '1rem 1.25rem', width: '44px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: item.rank <= 3 ? ['#D97706','#64748B','#0D7377'][item.rank-1] : '#CBD5E1' }}>
                            {String(item.rank).padStart(2, '0')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cat, flexShrink: 0 }} />
                            {item.model}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600, background: `${cat}12`, color: cat, border: `1px solid ${cat}30` }}>
                            {TYPE_LABEL[item.category]}
                          </span>
                        </td>
                        {[
                          { v: fmt(item.accuracy),  best: item.accuracy === maxAcc  },
                          { v: fmt(item.precision), best: item.precision === maxPrec },
                          { v: fmt(item.recall),    best: item.recall === maxRec    },
                          { v: fmt(item.f1),        best: item.f1 === maxF1         },
                          { v: fmtRaw(item.rocAuc), best: item.rocAuc === maxAuc    },
                        ].map((cell, ci) => (
                          <td key={ci} style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', fontWeight: cell.best ? 700 : 400, color: cell.best ? '#15803D' : '#475569' }}>
                            {cell.v}
                            {cell.best && <span style={{ marginLeft: '0.375rem', fontSize: '0.6rem', color: '#22C55E' }}>▲</span>}
                          </td>
                        ))}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <button onClick={() => setExpandedModel(isExpanded ? null : item.model)}
                            style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0', background: 'transparent', color: '#64748B', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                          >
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && breakdown.map(d => (
                        <tr key={`${item.model}-${d.disease}`} style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.625rem 1.25rem' }} />
                          <td style={{ padding: '0.625rem 1.25rem', fontSize: '0.8rem', color: '#64748B', paddingLeft: '2.75rem' }}>
                            ↳ {d.displayName}
                          </td>
                          <td style={{ padding: '0.625rem 1.25rem', fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>N={d.datasetSize}</td>
                          <td style={{ padding: '0.625rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748B' }}>{d.accuracy != null ? fmt(d.accuracy) : '—'}</td>
                          <td colSpan={4} style={{ padding: '0.625rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94A3B8' }}>
                            F1: {d.f1 != null ? fmt(d.f1) : '—'} &nbsp;·&nbsp; AUC: {d.rocAuc != null ? fmtRaw(d.rocAuc) : '—'}
                          </td>
                          <td />
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.875rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '0.72rem', color: '#94A3B8' }}>
            All values at maximum dataset size per disease. No hardcoded data. Source: benchmark_results.csv
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
