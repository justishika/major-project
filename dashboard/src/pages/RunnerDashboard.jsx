import React, { useState, useEffect, useRef } from 'react';
import { DISEASES } from '../dataLoader';

/* Fake log lines for demo theater */
const DEMO_LOGS = [
  { text: '>>> Initializing Hybrid Classical-Quantum Pipeline', color: '#fbbf24', delay: 200 },
  { text: 'Loading dataset...', color: null, delay: 600 },
  { text: '  PCA explained variance: 0.8342', color: null, delay: 900 },
  { text: '  Dataset shape after PCA: (195, 4)  |  Classes: [75, 120]', color: null, delay: 1200 },
  { text: '\n  === Run 1/1 | N=195 ===', color: '#a78bfa', delay: 1600 },
  { text: '  Training Classical Models...', color: null, delay: 2000 },
  { text: '    ✓ SVM                 Accuracy: 0.898', color: '#34d399', delay: 2400 },
  { text: '    ✓ Random Forest       Accuracy: 0.914', color: '#34d399', delay: 2700 },
  { text: '    ✓ Logistic Regression Accuracy: 0.881', color: '#34d399', delay: 3000 },
  { text: '  Training QK-SVM (Noiseless)...', color: null, delay: 3500 },
  { text: '    [Quantum Circuit: 4 qubits, ZZFeatureMap depth=2]', color: '#a78bfa', delay: 3900 },
  { text: '    ✓ QK-SVM (Noiseless)  Accuracy: 0.932', color: '#34d399', delay: 5200 },
  { text: '  Training QK-SVM (Noisy) [noise=0.01]...', color: null, delay: 5600 },
  { text: '    ✓ QK-SVM (Noisy)      Accuracy: 0.915', color: '#34d399', delay: 7100 },
  { text: '  Training Hybrid (RF + QK-SVM stacking)...', color: null, delay: 7500 },
  { text: '    ✓ Hybrid Model        Accuracy: 0.966', color: '#fbbf24', delay: 9000 },
  { text: '\n  Saving graphs → results/graphs/...', color: null, delay: 9400 },
  { text: '  ✓ accuracy_vs_size.png', color: '#34d399', delay: 9700 },
  { text: '  ✓ roc_curve.png', color: '#34d399', delay: 9900 },
  { text: '  ✓ confusion_matrices (6 models)', color: '#34d399', delay: 10100 },
  { text: '  ✓ metric_heatmap.png', color: '#34d399', delay: 10300 },
  { text: '\n  ===== BENCHMARK COMPLETE =====', color: '#fbbf24', delay: 10700 },
  { text: '  Hybrid model outperformed all baselines.', color: '#fbbf24', delay: 11000 },
  { text: 'PROCESS FINISHED.', color: '#34d399', delay: 11400 },
];

const STEPS = [
  { icon: '⚙', label: 'Load & Preprocess',  desc: 'StandardScaler → PCA(4) → [−π, π] scaling' },
  { icon: '📊', label: 'Classical Training', desc: 'SVM, Random Forest, Logistic Regression' },
  { icon: '⚛',  label: 'Quantum Kernel',     desc: 'ZZFeatureMap, 4-qubit circuit, noiseless + noisy' },
  { icon: '🔗', label: 'Hybrid Stacking',    desc: 'Learned meta-learner (RF + QK-SVM)' },
  { icon: '📈', label: 'Visualization',      desc: '22 performance graphs per disease' },
];

const RunnerDashboard = () => {
  const [selectedDisease, setSelectedDisease] = useState(DISEASES[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone]       = useState(false);
  const [logs, setLogs]           = useState([]);
  const [activeStep, setActiveStep] = useState(-1);
  const logsEndRef = useRef(null);
  const timersRef  = useRef([]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  /* Clear all pending timers on unmount */
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const handleSimulatedRun = () => {
    if (isRunning) return;
    clearTimers();
    setIsRunning(true);
    setIsDone(false);
    setLogs([]);
    setActiveStep(0);

    const disease = DISEASES.find(d => d.id === selectedDisease);
    const prefix  = `>>> Starting Quantum Pipeline for ${disease?.name || selectedDisease}...\n`;

    setLogs([{ text: prefix, color: '#fbbf24' }]);

    DEMO_LOGS.forEach((entry, idx) => {
      const t = setTimeout(() => {
        setLogs(prev => [...prev, { text: entry.text, color: entry.color }]);

        // Update step indicator
        if (idx === 3)  setActiveStep(0);
        if (idx === 5)  setActiveStep(1);
        if (idx === 9)  setActiveStep(2);
        if (idx === 12) setActiveStep(3);
        if (idx === 15) setActiveStep(4);

        if (idx === DEMO_LOGS.length - 1) {
          setIsRunning(false);
          setIsDone(true);
          setActiveStep(-1);
        }
      }, entry.delay);
      timersRef.current.push(t);
    });
  };

  const handleReset = () => {
    clearTimers();
    setIsRunning(false);
    setIsDone(false);
    setLogs([]);
    setActiveStep(-1);
  };

  return (
    <div className="flex-col gap-8" style={{ paddingBottom: '4rem' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--quantum), #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
          }}>
            ▶
          </div>
          <h1 style={{ fontSize: '2rem' }}>Pipeline Runner</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Execute the Hybrid Classical-Quantum benchmark pipeline for any disease dataset.
        </p>
      </div>

      {/* ── Control Panel ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
      }}>
        {/* Left — Config */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>⚙ Configure Run</h3>

          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Disease Dataset
          </label>
          <select
            className="select-input w-full"
            value={selectedDisease}
            onChange={e => { setSelectedDisease(e.target.value); handleReset(); }}
            disabled={isRunning}
            style={{ marginBottom: '1.5rem' }}
          >
            {DISEASES.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleSimulatedRun}
              disabled={isRunning}
              style={{ flex: 1, animation: isRunning ? 'pulse-glow 2s infinite' : 'none' }}
            >
              {isRunning ? (
                <>
                  <span style={{
                    width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block',
                  }} />
                  Running Pipeline…
                </>
              ) : isDone ? '▶ Run Again' : '▶ Run Benchmark'}
            </button>

            {(logs.length > 0) && (
              <button className="btn btn-secondary" onClick={handleReset} disabled={isRunning}>
                ✕ Reset
              </button>
            )}
          </div>

          {isDone && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.85rem', color: '#34d399',
            }}>
              ✓ Benchmark complete — navigate to the disease page to view results
            </div>
          )}
        </div>

        {/* Right — Steps */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>📋 Execution Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {STEPS.map((step, idx) => {
              const isActive  = activeStep === idx;
              const isPast    = isDone || (isRunning && activeStep > idx);
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(139,92,246,0.08)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--border-accent)' : 'transparent'}`,
                  transition: 'var(--transition)',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: isPast ? 'rgba(16,185,129,0.15)' : isActive ? 'var(--quantum-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${isPast ? 'rgba(16,185,129,0.3)' : isActive ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', flexShrink: 0,
                    transition: 'var(--transition)',
                  }}>
                    {isPast ? '✓' : step.icon}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.875rem', fontWeight: 600,
                      color: isActive ? 'var(--text-primary)' : isPast ? '#34d399' : 'var(--text-secondary)',
                    }}>
                      {step.label}
                      {isActive && (
                        <span style={{ marginLeft: '0.5rem', animation: 'blink 1s infinite' }}>●</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Terminal ─────────────────────────────────────────── */}
      <div className="terminal">
        <div className="terminal-header">
          <div className="terminal-dot" style={{ background: '#ff5f57' }} />
          <div className="terminal-dot" style={{ background: '#ffbd2e' }} />
          <div className="terminal-dot" style={{ background: '#28c840' }} />
          <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            quantum-ml-pipeline — bash
          </span>
          {isRunning && (
            <span style={{
              marginLeft: 'auto', fontSize: '0.75rem',
              color: 'var(--quantum-light)',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--quantum-light)',
                display: 'inline-block',
                animation: 'blink 1s infinite',
              }} />
              Running
            </span>
          )}
        </div>

        <div className="terminal-body">
          {logs.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>
              Select a disease and press Run Benchmark to start…
              <span style={{ animation: 'blink 1.2s infinite' }}>_</span>
            </span>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ color: log.color || 'var(--text-code)' }}>
                {log.text}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 20px rgba(139,92,246,0.3); }
          50%      { box-shadow: 0 0 40px rgba(139,92,246,0.7); }
        }
      `}</style>
    </div>
  );
};

export default RunnerDashboard;
