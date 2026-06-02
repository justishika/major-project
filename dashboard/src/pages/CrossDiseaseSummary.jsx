import React, { useEffect, useState } from 'react';
import { getBenchmarkSummary } from '../dataLoader';
import MetricsTable from '../components/MetricsTable';
import GraphCard from '../components/GraphCard';

/* ── Stat card ──────────────────────────────── */
const StatCard = ({ label, value, sub, accent }) => (
  <div className="stat-chip" style={accent ? { borderColor: accent, boxShadow: `0 0 20px ${accent}20` } : {}}>
    <span className="label">{label}</span>
    <span className="value" style={accent ? { color: accent } : {}}>{value}</span>
    {sub && <span className="sub">{sub}</span>}
  </div>
);

/* ── Orbit animation SVG ────────────────────── */
const QuantumOrbit = () => (
  <svg
    width="120" height="120" viewBox="0 0 120 120"
    style={{ flexShrink: 0, opacity: 0.7 }}
  >
    <defs>
      <radialGradient id="orb" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Central node */}
    <circle cx="60" cy="60" r="10" fill="url(#orb)" />
    <circle cx="60" cy="60" r="6" fill="#8b5cf6" />
    {/* Orbit rings */}
    <ellipse cx="60" cy="60" rx="42" ry="18" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1"
      transform="rotate(-30 60 60)" />
    <ellipse cx="60" cy="60" rx="42" ry="18" fill="none" stroke="rgba(6,182,212,0.25)" strokeWidth="1"
      transform="rotate(30 60 60)" />
    <ellipse cx="60" cy="60" rx="42" ry="18" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="1"
      transform="rotate(90 60 60)" />
    {/* Orbiting dots */}
    <circle r="4" fill="#8b5cf6" opacity="0.9">
      <animateMotion dur="3s" repeatCount="indefinite">
        <mpath href="#orbit1" />
      </animateMotion>
    </circle>
    <path id="orbit1" d="M18,60 a42,18 0 1,1 84,0 a42,18 0 1,1 -84,0"
      transform="rotate(-30 60 60) translate(60,60) scale(1) translate(-60,-60)" fill="none" />
    <circle r="3.5" fill="#06b6d4" opacity="0.8">
      <animateMotion dur="5s" repeatCount="indefinite" begin="1s">
        <mpath href="#orbit2" />
      </animateMotion>
    </circle>
    <path id="orbit2" d="M18,60 a42,18 0 1,0 84,0 a42,18 0 1,0 -84,0"
      transform="rotate(30 60 60) translate(60,60) scale(1) translate(-60,-60)" fill="none" />
    <circle r="3" fill="#f59e0b" opacity="0.8">
      <animateMotion dur="4s" repeatCount="indefinite" begin="2s">
        <mpath href="#orbit3" />
      </animateMotion>
    </circle>
    <path id="orbit3" d="M18,60 a42,18 0 1,1 84,0 a42,18 0 1,1 -84,0"
      transform="rotate(90 60 60) translate(60,60) scale(1) translate(-60,-60)" fill="none" />
  </svg>
);

const CrossDiseaseSummary = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    getBenchmarkSummary().then(setData);
  }, []);

  return (
    <div className="flex-col gap-8">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0d1117 0%, #111827 60%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '3rem 3rem',
        overflow: 'hidden',
      }}>
        {/* Background glows */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '30%',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', position: 'relative' }}>
          <QuantumOrbit />

          <div style={{ flex: 1 }}>
            {/* Eyebrow tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div className="badge badge-quantum">⚛ Quantum ML Research</div>
              <div className="badge badge-success">✓ Results Ready</div>
            </div>

            <h1 style={{ fontSize: '2.4rem', marginBottom: '0.75rem', lineHeight: 1.15 }}>
              Hybrid Classical-Quantum{' '}
              <span className="gradient-text">Disease Benchmark</span>
            </h1>
            <p style={{ fontSize: '1.05rem', maxWidth: '600px', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Empirical comparison of Quantum Kernel SVM vs. Classical ML across{' '}
              <strong style={{ color: 'var(--text-primary)' }}>10 clinically diverse disease datasets</strong>.
              Our Hybrid stacking ensemble demonstrates consistent performance superiority.
            </p>

            {/* Stat row */}
            <div className="flex gap-3 stagger" style={{ flexWrap: 'wrap' }}>
              <StatCard label="Diseases" value="10" sub="Clinical Datasets" />
              <StatCard label="Models" value="6" sub="Compared per disease" />
              <StatCard label="Graphs" value="220+" sub="Performance visualizations" />
              <StatCard label="Best Model" value="Hybrid" sub="Classical + Quantum stacking" accent="var(--hybrid)" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Model Legend ──────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '1.25rem 1.5rem',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', alignSelf: 'center', marginRight: '0.5rem' }}>
          Models
        </span>
        {[
          { name: 'Hybrid (Classical+Quantum)', type: 'hybrid', desc: 'Stacking ensemble' },
          { name: 'QK-SVM (Noiseless)',         type: 'quantum', desc: 'ZZFeatureMap kernel' },
          { name: 'QK-SVM (Noisy)',             type: 'quantum', desc: 'Depolarizing noise' },
          { name: 'Random Forest',              type: 'classical', desc: 'Ensemble baseline' },
          { name: 'SVM',                        type: 'classical', desc: 'Classical kernel' },
          { name: 'Logistic Regression',        type: 'classical', desc: 'Linear baseline' },
        ].map(m => (
          <div key={m.name} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '999px',
          }}>
            <div className={`dot dot-${m.type}`} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{m.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>· {m.desc}</span>
          </div>
        ))}
      </div>

      {/* ── Cross-Disease Chart ───────────────────────────────── */}
      <div>
        <div className="section-heading">
          <h2>Cross-Disease Performance</h2>
        </div>
        <GraphCard
          title="All Diseases · All Models · Accuracy Comparison"
          description="Grouped bar chart comparing model accuracy across all 10 disease datasets. The Hybrid model (gold) consistently achieves top or near-top performance across diverse clinical contexts."
          imageUrl="/results/graphs/cross_disease_summary.png"
          altText="Cross-Disease Performance Summary"
          size="large"
        />
      </div>

      {/* ── Pipeline Architecture ─────────────────────────────── */}
      <div>
        <div className="section-heading">
          <h2>Pipeline Architecture</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 stagger">
          {[
            { step: '01', title: 'Data Preprocessing', desc: 'StandardScaler → PCA (4 qubits) → MinMaxScaler to [−π, π] for Pauli rotations', icon: '⚙', color: 'var(--classical)' },
            { step: '02', title: 'Model Training', desc: 'Classical baselines (SVM, RF, LR) + Quantum Kernel SVM with ZZFeatureMap + noise simulation', icon: '🧪', color: 'var(--quantum-light)' },
            { step: '03', title: 'Hybrid Stacking', desc: 'RF + QK-SVM meta-learner with learned stacking weights outperforms all individual models', icon: '🔗', color: 'var(--hybrid)' },
          ].map(item => (
            <div key={item.step} className="card animate-slide-up" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem',
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: item.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Step {item.step}
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.825rem', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Global Metrics Table ──────────────────────────────── */}
      {data.length > 0 && (
        <div>
          <div className="section-heading">
            <h2>Global Benchmark Metrics</h2>
          </div>
          <MetricsTable data={data} title="Mean Accuracy by Disease · Model · Dataset Size" />
        </div>
      )}
    </div>
  );
};

export default CrossDiseaseSummary;
