import React, { useState, useEffect, useRef } from 'react';
import { DISEASES } from '../dataLoader';

/* ── Pipeline steps (describes the actual workflow) ── */
const STEPS = [
  { icon: '⚙', label: 'Load & Preprocess',  desc: 'StandardScaler → PCA(4) → [−π, π] scaling' },
  { icon: '📊', label: 'Classical Training', desc: 'SVM, Random Forest, Logistic Regression' },
  { icon: '⚛',  label: 'Quantum Kernel',     desc: 'ZZFeatureMap, 4-qubit circuit, noiseless + noisy' },
  { icon: '🔗', label: 'Hybrid Stacking',    desc: 'Learned meta-learner (RF + ExtraTrees + GB + QK-SVM)' },
  { icon: '📈', label: 'Visualization',      desc: 'Performance graphs per disease' },
];

const RunnerDashboard = () => {
  const [selectedDisease, setSelectedDisease] = useState(DISEASES[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone]       = useState(false);
  const [logs, setLogs]           = useState([]);
  const [activeStep, setActiveStep] = useState(-1);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const logsEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Check backend connectivity
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/run', { method: 'OPTIONS' });
        setBackendStatus(res.ok || res.status === 404 || res.status === 405 ? 'online' : 'offline');
      } catch {
        // Try a simple POST to see if it responds at all
        try {
          const res = await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disease: '__ping__' }),
          });
          setBackendStatus('online');
        } catch {
          setBackendStatus('offline');
        }
      }
    };
    checkBackend();
  }, []);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const inferStep = (logLine) => {
    const lower = logLine.toLowerCase();
    if (lower.includes('loading') || lower.includes('preprocess') || lower.includes('pca')) return 0;
    if (lower.includes('classical') || lower.includes('svm') || lower.includes('random forest') || lower.includes('logistic')) return 1;
    if (lower.includes('quantum') || lower.includes('qk-svm') || lower.includes('circuit')) return 2;
    if (lower.includes('hybrid') || lower.includes('stacking')) return 3;
    if (lower.includes('saving') || lower.includes('graph') || lower.includes('plot') || lower.includes('visualization')) return 4;
    return null;
  };

  const handleRealRun = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setIsDone(false);
    setLogs([]);
    setActiveStep(0);

    const disease = DISEASES.find(d => d.id === selectedDisease);

    // Start the pipeline via API
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease: selectedDisease }),
      });

      const result = await res.json();

      if (!res.ok) {
        setLogs([{ text: `Error: ${result.error || 'Failed to start pipeline'}`, color: '#ef4444' }]);
        setIsRunning(false);
        return;
      }

      setLogs([{ text: `>>> Starting pipeline for ${disease?.name || selectedDisease}...`, color: '#fbbf24' }]);

      // Connect to SSE log stream
      const eventSource = new EventSource(`/api/logs/${selectedDisease}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.log) {
            const isError = data.log.startsWith('ERROR:');
            setLogs(prev => [...prev, {
              text: data.log,
              color: isError ? '#ef4444' : data.log.includes('✓') ? '#34d399' : null,
            }]);

            // Infer pipeline step from log content
            const step = inferStep(data.log);
            if (step !== null) setActiveStep(step);
          }

          if (data.done) {
            setIsRunning(false);
            setIsDone(true);
            setActiveStep(-1);
            eventSource.close();
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        setLogs(prev => [...prev, { text: 'Connection to backend lost.', color: '#ef4444' }]);
        setIsRunning(false);
        eventSource.close();
      };

    } catch (err) {
      setLogs([{ text: `Error: Could not connect to backend server. Is it running?`, color: '#ef4444' }]);
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
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

      {/* ── Backend Status ────────────────────────────────── */}
      {backendStatus === 'offline' && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          fontSize: '0.85rem',
        }}>
          <span style={{ color: '#ef4444', fontSize: '1.1rem' }}>⚠</span>
          <div>
            <div style={{ color: '#f87171', fontWeight: 600, marginBottom: '0.25rem' }}>Backend Server Not Running</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Start the backend server to enable pipeline execution:
              <code style={{ display: 'block', marginTop: '0.5rem' }}>cd dashboard && node server.js</code>
            </div>
          </div>
        </div>
      )}

      {backendStatus === 'online' && (
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.82rem',
          color: '#34d399',
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#34d399', boxShadow: '0 0 6px #34d399',
            display: 'inline-block',
          }} />
          Backend server connected — ready to execute benchmarks
        </div>
      )}

      {/* ── Control Panel ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
      }}>
        {/* Left — Config */}
        <div className="card-static" style={{ padding: '1.75rem' }}>
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
              onClick={handleRealRun}
              disabled={isRunning || backendStatus === 'offline'}
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
        <div className="card-static" style={{ padding: '1.75rem' }}>
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
              {backendStatus === 'offline'
                ? 'Backend server not running. Start with: node server.js'
                : 'Select a disease and press Run Benchmark to start…'
              }
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
      `}
      </style>
    </div>
  );
};

export default RunnerDashboard;
