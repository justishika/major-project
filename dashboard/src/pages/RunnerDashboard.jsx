import React, { useState, useEffect, useRef } from 'react';
import { Play, SquareTerminal } from 'lucide-react';
import { DISEASES } from '../dataLoader';

const RunnerDashboard = () => {
  const [selectedDisease, setSelectedDisease] = useState(DISEASES[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([`>>> Starting Quantum Pipeline for ${selectedDisease}...\n`]);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease: selectedDisease })
      });

      if (!res.ok) {
        setLogs(prev => [...prev, `ERROR: Backend returned ${res.status}`]);
        setIsRunning(false);
        return;
      }

      const evtSource = new EventSource(`/api/logs/${selectedDisease}`);
      
      evtSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.done) {
          evtSource.close();
          setIsRunning(false);
        }
        setLogs(prev => [...prev, data.log]);
      };

      evtSource.onerror = () => {
        setLogs(prev => [...prev, 'ERROR: Connection to log stream lost.']);
        evtSource.close();
        setIsRunning(false);
      };

    } catch (err) {
      setLogs(prev => [...prev, `ERROR: ${err.message}`]);
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-col gap-8">
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Pipeline Runner</h1>
        <p style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>Execute the Hybrid Classical-Quantum benchmark directly from the UI</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: '1rem' }}>Configure Run</h3>
          <select 
            value={selectedDisease} 
            onChange={(e) => setSelectedDisease(e.target.value)}
            disabled={isRunning}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-dark)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
              outline: 'none',
              fontFamily: 'var(--font-body)'
            }}
          >
            {DISEASES.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          
          <button 
            className="btn btn-primary" 
            onClick={handleRun}
            disabled={isRunning}
            style={{ 
              width: '100%', 
              opacity: isRunning ? 0.5 : 1,
              animation: isRunning ? 'glow-pulse 2s infinite' : 'none'
            }}
          >
            <Play size={18} />
            {isRunning ? 'Running Pipeline...' : 'Run Benchmark'}
          </button>
        </div>
        
        <div style={{ flex: 1 }}>
          <div className="glass" style={{ padding: '1.5rem', background: 'var(--bg-dark)', height: '100%' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-secondary)' }}>Execution Flow</h4>
            <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>1. Load and preprocess clinical dataset</li>
              <li>2. Apply standard scaling and PCA</li>
              <li>3. Train Classical Baselines (SVM, RF, LR)</li>
              <li>4. Train Quantum Models (ZZFeatureMap)</li>
              <li>5. Build Hybrid Stacking Ensemble</li>
              <li>6. Generate and save performance graphs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      <div className="glass-panel" style={{ background: '#1c1917', border: '1px solid var(--border-color)' }}>
        <div style={{ 
          padding: '0.75rem 1.5rem', 
          borderBottom: '1px solid #4b5563',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#a8a29e'
        }}>
          <SquareTerminal size={16} />
          <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>Terminal Output</span>
        </div>
        <div style={{ 
          padding: '1.5rem', 
          height: '400px', 
          overflowY: 'auto',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.85rem',
          color: '#e5e7eb',
          lineHeight: 1.5
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#6b7280' }}>Waiting for execution to start...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ 
                color: log.includes('ERROR') ? '#ff4a4a' : 
                       log.includes('SUCCESS') ? '#4ade80' : 
                       log.includes('>>>') ? '#fbbf24' : 'inherit'
              }}>
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default RunnerDashboard;
