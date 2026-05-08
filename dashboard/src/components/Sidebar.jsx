import React from 'react';
import { DISEASES } from '../dataLoader';
import { LayoutDashboard, ActivitySquare } from 'lucide-react';

const Sidebar = ({ activeDisease, setActiveDisease }) => {
  return (
    <div className="glass" style={{
      width: '280px',
      height: 'calc(100vh - 4rem)',
      position: 'sticky',
      top: '2rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Quantum ML</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>Benchmark Dashboard</p>
      </div>

      <button 
        onClick={() => setActiveDisease('summary')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          background: activeDisease === 'summary' ? 'rgba(217, 119, 6, 0.05)' : 'transparent',
          border: '1px solid',
          borderColor: activeDisease === 'summary' ? 'var(--accent-primary)' : 'transparent',
          color: activeDisease === 'summary' ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'var(--transition)'
        }}
      >
        <LayoutDashboard size={18} />
        <span style={{ fontWeight: 500 }}>Cross-Disease Summary</span>
      </button>

      <button 
        onClick={() => setActiveDisease('runner')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          background: activeDisease === 'runner' ? 'rgba(217, 119, 6, 0.05)' : 'transparent',
          border: '1px solid',
          borderColor: activeDisease === 'runner' ? 'var(--accent-primary)' : 'transparent',
          color: activeDisease === 'runner' ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'var(--transition)'
        }}
      >
        <LayoutDashboard size={18} />
        <span style={{ fontWeight: 500 }}>Run Pipeline</span>
      </button>

      <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
        Individual Diseases
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {DISEASES.map(disease => (
          <button
            key={disease.id}
            onClick={() => setActiveDisease(disease.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: activeDisease === disease.id ? 'rgba(0,0,0,0.05)' : 'transparent',
              border: 'none',
              color: activeDisease === disease.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'var(--transition)',
              fontSize: '0.9rem'
            }}
          >
            <ActivitySquare size={16} style={{ color: activeDisease === disease.id ? 'var(--accent-secondary)' : 'currentColor' }}/>
            {disease.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
