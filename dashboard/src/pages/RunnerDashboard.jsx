import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, CheckCircle2, Circle, AlertCircle, Activity, FileText, Database, Terminal } from 'lucide-react';
import { DISEASES } from '../dataLoader';

const STEPS = [
  { label: 'Data Ingestion & Preprocessing', desc: 'StandardScaler → PCA(4) → [−π, π] scaling', icon: Database },
  { label: 'Classical Baseline Training', desc: 'SVM, Random Forest, Logistic Regression', icon: Activity },
  { label: 'Quantum Kernel Execution', desc: 'ZZFeatureMap, 4-qubit circuit, depolarizing noise', icon: Activity },
  { label: 'Hybrid Meta-Learner Stacking', desc: 'RF + ExtraTrees + GB + QK-SVM', icon: Activity },
  { label: 'Artifact Generation', desc: 'Performance graphs & metrics compilation', icon: FileText },
];

const RunnerDashboard = () => {
  const [selectedDisease, setSelectedDisease] = useState(DISEASES[0].id);
  const [isRunning, setIsRunning]             = useState(false);
  const [isDone, setIsDone]                   = useState(false);
  const [logs, setLogs]                       = useState([]);
  const [activeStep, setActiveStep]           = useState(-1);
  const [backendStatus, setBackendStatus]     = useState('checking');
  const logsEndRef    = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/run', { method: 'OPTIONS' });
        setBackendStatus(res.ok || res.status === 404 || res.status === 405 ? 'online' : 'offline');
      } catch {
        try { await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ disease: '__ping__' }) }); setBackendStatus('online'); }
        catch { setBackendStatus('offline'); }
      }
    };
    check();
  }, []);

  useEffect(() => () => { eventSourceRef.current?.close(); }, []);

  const inferStep = log => {
    const l = log.toLowerCase();
    if (l.includes('loading') || l.includes('preprocess') || l.includes('pca')) return 0;
    if (l.includes('classical') || l.includes('svm') || l.includes('random forest') || l.includes('logistic')) return 1;
    if (l.includes('quantum') || l.includes('qk-svm') || l.includes('circuit')) return 2;
    if (l.includes('hybrid') || l.includes('stacking')) return 3;
    if (l.includes('saving') || l.includes('graph') || l.includes('plot') || l.includes('visualization')) return 4;
    return null;
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true); setIsDone(false); setLogs([]); setActiveStep(0);
    const disease = DISEASES.find(d => d.id === selectedDisease);
    try {
      const res = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ disease: selectedDisease }) });
      const result = await res.json();
      if (!res.ok) { setLogs([{ text: `Error: ${result.error || 'Failed to start pipeline'}`, isError: true }]); setIsRunning(false); return; }
      setLogs([{ text: `>>> Initialization sequence started for ${disease?.name || selectedDisease}...`, isHighlight: true }]);
      const es = new EventSource(`/api/logs/${selectedDisease}`);
      eventSourceRef.current = es;
      es.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (data.log) {
            setLogs(prev => [...prev, { text: data.log, isError: data.log.startsWith('ERROR:'), isSuccess: data.log.includes('✓') }]);
            const step = inferStep(data.log);
            if (step !== null) setActiveStep(step);
          }
          if (data.done) { setIsRunning(false); setIsDone(true); setActiveStep(STEPS.length); es.close(); }
        } catch {}
      };
      es.onerror = () => { setLogs(prev => [...prev, { text: 'Connection to telemetry server lost.', isError: true }]); setIsRunning(false); es.close(); };
    } catch {
      setLogs([{ text: 'Error: Telemetry server unreachable. Verify backend process.', isError: true }]);
      setIsRunning(false);
    }
  };

  const handleReset = () => { eventSourceRef.current?.close(); setIsRunning(false); setIsDone(false); setLogs([]); setActiveStep(-1); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '6rem' }}>

      {/* ═══════════════════════════════════════════════════════
          HEADER: Mission Control
      ═══════════════════════════════════════════════════════ */}
      <div style={{ padding: '4rem 0 3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '24px', height: '1px', background: '#0F172A' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F172A' }}>
              Execution Environment
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: backendStatus === 'online' ? '#15803D' : '#DC2626' }}>
            {backendStatus === 'online' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {backendStatus === 'online' ? 'BACKEND CONNECTED' : 'BACKEND OFFLINE'}
          </div>
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#0F172A', lineHeight: 1.05, marginBottom: '1rem' }}>
          Pipeline Runner
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '480px', lineHeight: 1.75 }}>
          Command center for executing the Hybrid Classical-Quantum benchmark. Monitor compute states and generated artifacts in real-time.
        </p>
      </div>

      {/* ─── Divider ─── */}
      <div style={{ height: '1px', background: '#E2E8F0', marginBottom: '4rem' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '4rem', alignItems: 'start' }}>
        
        {/* ═══════════════════════════════════════════════════════
            LEFT COLUMN: Config & Timeline
        ═══════════════════════════════════════════════════════ */}
        <div>
          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '1.25rem' }}>Target Dataset</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {DISEASES.map(d => (
                <button
                  key={d.id}
                  onClick={() => { if(!isRunning) setSelectedDisease(d.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem',
                    background: selectedDisease === d.id ? '#F1F5F9' : 'transparent',
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    color: selectedDisease === d.id ? '#0F172A' : '#64748B',
                    fontWeight: selectedDisease === d.id ? 600 : 400,
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    textAlign: 'left', transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{d.name}</span>
                  {selectedDisease === d.id && <CheckCircle2 size={14} color="#0F172A" />}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleRun}
                disabled={isRunning || backendStatus === 'offline'}
                style={{
                  flex: 1, padding: '0.75rem 1rem',
                  background: isRunning || backendStatus === 'offline' ? '#E2E8F0' : '#020617',
                  color: isRunning || backendStatus === 'offline' ? '#94A3B8' : '#FFFFFF',
                  border: 'none', borderRadius: '6px',
                  fontSize: '0.85rem', fontWeight: 600, cursor: isRunning || backendStatus === 'offline' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'background 0.2s',
                }}
              >
                {isRunning ? (
                  <>
                    <span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    EXECUTING
                  </>
                ) : <><Play size={14} /> EXECUTE PIPELINE</>}
              </button>
              {logs.length > 0 && (
                <button onClick={handleReset} disabled={isRunning} style={{ padding: '0.75rem 1rem', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.85rem', color: '#020617', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '1.25rem' }}>Compute Sequence</h3>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '0.5rem' }}>
              {STEPS.map((step, idx) => {
                const isActive = activeStep === idx;
                const isPast   = isDone || (isRunning && activeStep > idx);
                const Icon = step.icon;
                return (
                  <div key={idx} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '1rem', opacity: isPast || isActive ? 1 : 0.4 }}>
                    {idx !== STEPS.length - 1 && (
                      <div style={{ position: 'absolute', top: '24px', left: '11px', bottom: '-24px', width: '2px', background: isPast ? '#020617' : '#E2E8F0' }} />
                    )}
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: isPast || isActive ? '#020617' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                    }}>
                      {isPast ? <CheckCircle2 size={12} color="white" /> : isActive ? <span style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', animation: 'blink 1s infinite' }} /> : <Circle size={12} color="#94A3B8" />}
                    </div>
                    <div style={{ paddingTop: '0.125rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#020617' }}>{step.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.125rem' }}>{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT COLUMN: Telemetry Terminal
        ═══════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderBottom: 'none', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#020617', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Terminal size={14} /> Telemetry Output
            </div>
            {isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.65rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB', animation: 'blink 1s infinite' }} /> Active
              </div>
            )}
          </div>
          <div style={{
            flex: 1, background: '#020617', padding: '1.5rem',
            borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px',
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.8, color: '#94A3B8',
            overflowY: 'auto', border: '1px solid #E2E8F0', borderTop: 'none',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {logs.length === 0 ? (
              <span style={{ color: '#475569' }}>
                {backendStatus === 'offline' ? 'CONNECTION REFUSED. Awaiting backend server.' : 'Awaiting execution command.'}
                <span style={{ animation: 'blink 1.2s infinite' }}>_</span>
              </span>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={{ color: log.isError ? '#EF4444' : log.isSuccess ? '#22C55E' : log.isHighlight ? '#38BDF8' : '#94A3B8' }}>
                  {log.text}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
          
          {/* Post-Run Artifacts summary */}
          {isDone && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '1rem', animation: 'fadeIn 0.5s ease' }}>
              <CheckCircle2 size={24} color="#15803D" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>Sequence Terminated Successfully</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.75rem' }}>Artifacts compiled to <code style={{ background: '#F1F5F9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>/results/graphs/{selectedDisease}</code></div>
                <button onClick={() => window.location.hash = `#${selectedDisease}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  View Disease Case Study →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0; transform:translateY(5px)} to{opacity:1; transform:translateY(0)} }
      `}</style>
    </div>
  );
};

export default RunnerDashboard;
