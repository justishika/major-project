import React, { useEffect, useState } from 'react';
import { getBenchmarkResults, computeGlobalLeaderboard, getModelCategory, getDiseaseDisplayName } from '../dataLoader';

/* ── Rank medals ── */
const RANK_DISPLAY = {
  1: { medal: '🥇', color: '#fbbf24' },
  2: { medal: '🥈', color: '#a78bfa' },
  3: { medal: '🥉', color: '#06b6d4' },
};

/* ── Category styling ── */
const CATEGORY_STYLE = {
  hybrid:    { dotClass: 'dot-hybrid',    badge: 'badge-hybrid',    label: 'Hybrid' },
  quantum:   { dotClass: 'dot-quantum',   badge: 'badge-quantum',   label: 'Quantum' },
  classical: { dotClass: 'dot-classical', badge: 'badge-classical', label: 'Classical' },
};

const fmt = (val) => val != null ? (val * 100).toFixed(2) + '%' : '—';
const fmtRaw = (val) => val != null ? val.toFixed(4) : '—';

const GlobalLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [expandedModel, setExpandedModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBenchmarkResults().then(data => {
      setBenchmarkData(data);
      const lb = computeGlobalLeaderboard(data);
      setLeaderboard(lb);
      setLoading(false);
    });
  }, []);

  // Compute per-disease breakdown for expanded model
  const getPerDiseaseBreakdown = (modelName) => {
    if (!benchmarkData.length) return [];

    // Get max size per disease
    const diseaseMaxSize = {};
    benchmarkData.forEach(row => {
      const ds = row['Dataset'];
      const size = row['Dataset Size'];
      if (ds && size != null) {
        diseaseMaxSize[ds] = Math.max(diseaseMaxSize[ds] || 0, size);
      }
    });

    return Object.entries(diseaseMaxSize).map(([disease, maxSize]) => {
      const row = benchmarkData.find(r => {
        if (r['Dataset'] !== disease || r['Model'] !== modelName || r['Dataset Size'] !== maxSize) return false;
        const noise = r['Noise Level'];
        if (modelName === 'QK-SVM (Noisy)' || modelName === 'Hybrid (Classical+Quantum)') {
          return noise === 0.01;
        }
        return noise === 0.0 || noise === 0;
      });

      return {
        disease,
        displayName: getDiseaseDisplayName(disease),
        accuracy: row ? row['Accuracy'] : null,
        precision: row ? row['Precision'] : null,
        recall: row ? row['Recall'] : null,
        f1: row ? row['F1-score'] : null,
        rocAuc: row ? row['ROC-AUC'] : null,
        datasetSize: maxSize,
      };
    }).sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
  };

  if (loading) {
    return (
      <div className="flex-col gap-8">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '2rem' }}>🏆 Global Leaderboard</h1>
        </div>
        <div className="skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="flex-col gap-8">
        <h1 style={{ fontSize: '2rem' }}>🏆 Global Leaderboard</h1>
        <div className="no-data-state">
          <div className="no-data-icon">📊</div>
          <div className="no-data-title">No Benchmark Data Available</div>
          <div className="no-data-desc">Run the benchmark pipeline first to generate results.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col gap-8" style={{ paddingBottom: '4rem' }}>

      {/* ── Header ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--hybrid), #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
          }}>
            🏆
          </div>
          <h1 style={{ fontSize: '2rem' }}>Global Leaderboard</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Models ranked by mean accuracy across all diseases at maximum dataset size.
          All rankings are computed dynamically from benchmark results.
        </p>
        <div className="source-tag" style={{ marginTop: '0.5rem' }}>
          📁 Source: benchmark_results.csv · Filtered: max dataset size per disease · Noise: 0.0 (classical/noiseless), 0.01 (noisy/hybrid)
        </div>
      </div>

      {/* ── Top 3 Podium ── */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {leaderboard.slice(0, 3).map((item) => {
          const rank = RANK_DISPLAY[item.rank];
          const catStyle = CATEGORY_STYLE[item.category];
          return (
            <div key={item.model} className="insight-card" style={{
              textAlign: 'center',
              borderColor: `${rank.color}30`,
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{rank.medal}</div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: rank.color, marginBottom: '0.5rem',
              }}>
                #{item.rank} Overall
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {item.model}
              </div>
              <span className={`badge ${catStyle.badge}`} style={{ marginBottom: '0.75rem' }}>
                {catStyle.label}
              </span>
              <div style={{
                fontSize: '2rem', fontWeight: 700, color: rank.color,
                fontFamily: 'var(--font-heading)', marginTop: '0.5rem',
              }}>
                {fmt(item.accuracy)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Mean Accuracy · {item.diseaseCount} diseases
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Full Leaderboard Table ── */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Complete Rankings · All Metrics
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {leaderboard.length} models · {leaderboard[0]?.diseaseCount || 0} diseases
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                <th>Model</th>
                <th>Type</th>
                <th>Mean Accuracy</th>
                <th>Mean Precision</th>
                <th>Mean Recall</th>
                <th>Mean F1-Score</th>
                <th>Mean ROC-AUC</th>
                <th>Diseases</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((item) => {
                const rank = RANK_DISPLAY[item.rank];
                const catStyle = CATEGORY_STYLE[item.category];
                const isExpanded = expandedModel === item.model;
                const breakdown = isExpanded ? getPerDiseaseBreakdown(item.model) : [];

                // Find the best metric value in each column for highlighting
                const maxAcc = Math.max(...leaderboard.map(l => l.accuracy || 0));
                const maxPrec = Math.max(...leaderboard.map(l => l.precision || 0));
                const maxRec = Math.max(...leaderboard.map(l => l.recall || 0));
                const maxF1 = Math.max(...leaderboard.map(l => l.f1 || 0));
                const maxAuc = Math.max(...leaderboard.map(l => l.rocAuc || 0));

                return (
                  <React.Fragment key={item.model}>
                    <tr className={`rank-${item.rank}`}>
                      <td className="rank-cell">
                        {rank ? rank.medal : item.rank}
                      </td>
                      <td className="model-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className={`dot ${catStyle.dotClass}`} />
                          {item.model}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${catStyle.badge}`} style={{ fontSize: '0.7rem' }}>
                          {catStyle.label}
                        </span>
                      </td>
                      <td className={`metric-cell ${item.accuracy === maxAcc ? 'highlight' : ''}`}>
                        {fmt(item.accuracy)}
                      </td>
                      <td className={`metric-cell ${item.precision === maxPrec ? 'highlight' : ''}`}>
                        {fmt(item.precision)}
                      </td>
                      <td className={`metric-cell ${item.recall === maxRec ? 'highlight' : ''}`}>
                        {fmt(item.recall)}
                      </td>
                      <td className={`metric-cell ${item.f1 === maxF1 ? 'highlight' : ''}`}>
                        {fmt(item.f1)}
                      </td>
                      <td className={`metric-cell ${item.rocAuc === maxAuc ? 'highlight' : ''}`}>
                        {fmtRaw(item.rocAuc)}
                      </td>
                      <td className="metric-cell">{item.diseaseCount}</td>
                      <td>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setExpandedModel(isExpanded ? null : item.model)}
                        >
                          {isExpanded ? '▲ Collapse' : '▼ Details'}
                        </button>
                      </td>
                    </tr>
                    {/* Expanded per-disease breakdown */}
                    {isExpanded && breakdown.map((d) => (
                      <tr key={`${item.model}-${d.disease}`} style={{ background: 'rgba(139,92,246,0.03)' }}>
                        <td></td>
                        <td style={{ paddingLeft: '2.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          ↳ {d.displayName}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            N={d.datasetSize}
                          </span>
                        </td>
                        <td className="metric-cell">{d.accuracy != null ? fmt(d.accuracy) : '—'}</td>
                        <td className="metric-cell">{d.precision != null ? fmt(d.precision) : '—'}</td>
                        <td className="metric-cell">{d.recall != null ? fmt(d.recall) : '—'}</td>
                        <td className="metric-cell">{d.f1 != null ? fmt(d.f1) : '—'}</td>
                        <td className="metric-cell">{d.rocAuc != null ? fmtRaw(d.rocAuc) : '—'}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Data Attribution ── */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
      }}>
        <span>ℹ</span>
        <div>
          <strong style={{ color: 'var(--text-secondary)' }}>Academic Defensibility Note:</strong>{' '}
          All rankings are computed from <code>benchmark_results.csv</code> at each disease's maximum dataset size.
          Mean values are arithmetic averages across diseases. No hardcoded ordering or estimated values are used.
          ROC-AUC values are raw (0–1 scale); all other metrics shown as percentages.
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
