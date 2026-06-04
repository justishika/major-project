import React, { useEffect, useState } from 'react';
import { getBenchmarkResults, getBenchmarkSummary, computeCrossDiseaseInsights, getDiseaseDisplayName, getModelCategory } from '../dataLoader';
import MetricsTable from '../components/MetricsTable';
import GraphCard from '../components/GraphCard';

/* ── Category styling ── */
const CAT_STYLE = {
  hybrid:    { dot: 'dot-hybrid',    badge: 'badge-hybrid' },
  quantum:   { dot: 'dot-quantum',   badge: 'badge-quantum' },
  classical: { dot: 'dot-classical', badge: 'badge-classical' },
};

const fmt = (val) => val != null ? (val * 100).toFixed(2) + '%' : '—';

const CrossDiseaseAnalysis = () => {
  const [insights, setInsights] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBenchmarkResults(),
      getBenchmarkSummary(),
    ]).then(([benchmark, summary]) => {
      const computed = computeCrossDiseaseInsights(benchmark);
      setInsights(computed);
      setSummaryData(summary);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-col gap-8">
        <h1 style={{ fontSize: '2rem' }}>📊 Cross-Disease Analysis</h1>
        <div className="skeleton" style={{ height: '300px' }} />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '150px' }} />)}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex-col gap-8">
        <h1 style={{ fontSize: '2rem' }}>📊 Cross-Disease Analysis</h1>
        <div className="no-data-state">
          <div className="no-data-icon">📊</div>
          <div className="no-data-title">No Benchmark Data Available</div>
          <div className="no-data-desc">Run the benchmark pipeline first to generate cross-disease analysis data.</div>
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
            background: 'linear-gradient(135deg, var(--classical), #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
          }}>
            📊
          </div>
          <h1 style={{ fontSize: '2rem' }}>Cross-Disease Analysis</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Comparative insights across {insights.diseasesWithData.length} disease datasets.
          All findings are computed mathematically from benchmark results.
        </p>
      </div>

      {/* ── Cross-Disease Summary Chart ──────────────────────── */}
      <GraphCard
        title="Cross-Disease Performance Summary"
        description="Grouped bar chart comparing all model accuracies across diseases. Generated from benchmark_results.csv by visualization.py."
        imageUrl="/results/graphs/cross_disease_summary.png"
        altText="Cross-Disease Performance Summary"
        size="large"
      />

      {/* ── Key Findings ────────────────────────────────────── */}
      <div>
        <div className="section-heading">
          <h2>Key Findings</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 stagger">

          {/* Highest Recorded Accuracy */}
          <div className="insight-card accent-success">
            <div className="insight-label">Highest Recorded Accuracy</div>
            <div className="insight-value" style={{ color: 'var(--success)' }}>
              {fmt(insights.highestAccuracy.value)}
            </div>
            <div className="insight-detail">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <div className={`dot ${CAT_STYLE[getModelCategory(insights.highestAccuracy.model)].dot}`} />
                <strong>{insights.highestAccuracy.model}</strong>
              </div>
              on {getDiseaseDisplayName(insights.highestAccuracy.disease)}
            </div>
            <div className="source-tag">📁 benchmark_results.csv · max dataset size</div>
          </div>

          {/* Best Performing Model */}
          <div className="insight-card accent-hybrid">
            <div className="insight-label">Best Performing Model (Mean)</div>
            <div className="insight-value" style={{ color: 'var(--hybrid-light)' }}>
              {insights.bestModel.model.replace(' (Classical+Quantum)', '')}
            </div>
            <div className="insight-detail">
              Mean accuracy: {fmt(insights.bestModel.meanAccuracy)} across {insights.diseasesWithData.length} diseases
            </div>
            <div className="source-tag">📁 Mean of max-size accuracies per disease</div>
          </div>

          {/* Most Consistent Model */}
          <div className="insight-card accent-quantum">
            <div className="insight-label">Most Consistent Model</div>
            <div className="insight-value" style={{ color: 'var(--quantum-light)' }}>
              {insights.mostConsistent.model.replace(' (Classical+Quantum)', '')}
            </div>
            <div className="insight-detail">
              Std deviation: {(insights.mostConsistent.std * 100).toFixed(2)}% · Mean: {fmt(insights.mostConsistent.meanAccuracy)}
            </div>
            <div className="source-tag">📁 Lowest std(accuracy) across diseases</div>
          </div>

          {/* Best Disease */}
          <div className="insight-card accent-success">
            <div className="insight-label">Highest Average Accuracy (Disease)</div>
            <div className="insight-value" style={{ fontSize: '1.35rem' }}>
              {getDiseaseDisplayName(insights.bestDisease.disease)}
            </div>
            <div className="insight-detail">
              Mean across all models: {fmt(insights.bestDisease.meanAccuracy)}
            </div>
            <div className="source-tag">📁 Mean model accuracy at max N</div>
          </div>

          {/* Worst Disease */}
          <div className="insight-card accent-danger">
            <div className="insight-label">Lowest Average Accuracy (Disease)</div>
            <div className="insight-value" style={{ fontSize: '1.35rem', color: 'var(--danger)' }}>
              {getDiseaseDisplayName(insights.worstDisease.disease)}
            </div>
            <div className="insight-detail">
              Mean across all models: {fmt(insights.worstDisease.meanAccuracy)}
            </div>
            <div className="source-tag">📁 Mean model accuracy at max N</div>
          </div>

          {/* Total experiments */}
          <div className="insight-card accent-classical">
            <div className="insight-label">Total Benchmark Experiments</div>
            <div className="insight-value" style={{ color: 'var(--classical)' }}>
              {insights.totalExperiments}
            </div>
            <div className="insight-detail">
              Across {insights.diseasesWithData.length} diseases, all models, sizes, and noise levels
            </div>
            <div className="source-tag">📁 Row count: benchmark_results.csv</div>
          </div>
        </div>
      </div>

      {/* ── Per-Disease Best Model Table ──────────────────── */}
      <div>
        <div className="section-heading">
          <h2>Per-Disease Best Model</h2>
        </div>
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Best Performing Model per Disease · Maximum Dataset Size
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Disease</th>
                  <th>Best Model</th>
                  <th>Type</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(insights.perDiseaseBest)
                  .sort(([, a], [, b]) => (b.accuracy || 0) - (a.accuracy || 0))
                  .map(([disease, best]) => {
                    const cat = getModelCategory(best.model);
                    const catStyle = CAT_STYLE[cat];
                    return (
                      <tr key={disease}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {getDiseaseDisplayName(disease)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className={`dot ${catStyle.dot}`} />
                            {best.model}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${catStyle.badge}`} style={{ fontSize: '0.7rem' }}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </span>
                        </td>
                        <td className="metric-cell" style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: best.accuracy >= 0.9 ? 'var(--success)' : best.accuracy >= 0.7 ? 'var(--text-primary)' : 'var(--warning)',
                        }}>
                          {fmt(best.accuracy)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="source-tag" style={{ margin: '0.75rem 1.5rem' }}>
            📁 Source: benchmark_results.csv · Filtered: max dataset size, noise=0.0 (classical) / 0.01 (noisy/hybrid)
          </div>
        </div>
      </div>

      {/* ── Global Benchmark Summary Table ───────────────── */}
      {summaryData.length > 0 && (
        <div>
          <div className="section-heading">
            <h2>Benchmark Summary Table</h2>
          </div>
          <MetricsTable data={summaryData} title="Mean Accuracy by Disease · Model · Dataset Size" />
          <div className="source-tag" style={{ marginTop: '0.5rem' }}>
            📁 Source: results/data/benchmark_results_summary.csv
          </div>
        </div>
      )}

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
          <strong style={{ color: 'var(--text-secondary)' }}>Data Integrity:</strong>{' '}
          All insights on this page are computed programmatically from loaded CSV data.
          "Best model" = highest mean accuracy at max dataset size across diseases.
          "Most consistent" = lowest standard deviation of accuracy across diseases.
          No values are hardcoded, estimated, or fabricated.
        </div>
      </div>
    </div>
  );
};

export default CrossDiseaseAnalysis;
