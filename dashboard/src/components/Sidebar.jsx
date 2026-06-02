import React, { useState } from 'react';
import { DISEASES } from '../dataLoader';

/* ── Disease icons ──────────────────────────────────── */
const DISEASE_ICONS = {
  parkinsons:        '🧠',
  breast_cancer:     '🩺',
  hepatitis_c:       '🫀',
  heart_disease:     '❤️',
  mammographic_mass: '🔬',
  thyroid_disease:   '⚗️',
  indian_liver:      '🫁',
  chronic_kidney:    '🧫',
  wilsons_disease:   '🧬',
  als:               '⚡',
  acute_nephritis:   '💊',
  heart_failure:     '🫶',
};

/* ── Nav items ──────────────────────────────────────── */
const NAV_TOP = [
  { id: 'summary', label: 'Cross-Disease Summary', icon: '◈' },
  { id: 'runner',  label: 'Pipeline Runner',        icon: '▶' },
];

const Sidebar = ({ activeDisease, setActiveDisease, sidebarOpen, setSidebarOpen }) => {
  const [hovered, setHovered] = useState(null);

  const navigate = (id) => {
    setActiveDisease(id);
    if (window.innerWidth < 900) setSidebarOpen(false);
  };

  return (
    <>
      {/* ── Toggle button (always visible) ── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '1.25rem',
          left: sidebarOpen ? '265px' : '1.25rem',
          zIndex: 100,
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? '←' : '≡'}
      </button>

      {/* ── Sidebar panel ── */}
      <div
        style={{
          width: '280px',
          minWidth: '280px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-panel)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          zIndex: 50,
          flexShrink: 0,
          marginLeft: sidebarOpen ? 0 : '-280px',
        }}
      >
        {/* ── Logo / Brand ── */}
        <div style={{ padding: '1.75rem 1.5rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {/* Quantum atom icon */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--quantum), #6d28d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
              boxShadow: '0 0 16px rgba(139,92,246,0.4)',
            }}>
              ⚛
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Quantum ML
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--quantum-light)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Benchmark Dashboard
              </div>
            </div>
          </div>

          {/* Model legend pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <span className="badge badge-quantum">Quantum</span>
            <span className="badge badge-classical">Classical</span>
            <span className="badge badge-hybrid">Hybrid</span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0 1.5rem' }} />

        {/* ── Top Navigation ── */}
        <div style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_TOP.map(item => {
            const isActive = activeDisease === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.08))'
                    : hovered === item.id ? 'var(--bg-elevated)' : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--border-accent)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                  width: '100%',
                  position: 'relative',
                }}
              >
                <span style={{
                  fontSize: '1rem',
                  width: '20px',
                  textAlign: 'center',
                  color: isActive ? 'var(--quantum-light)' : 'inherit',
                }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: '3px', borderRadius: '0 2px 2px 0',
                    background: 'var(--quantum)',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0 1.5rem' }} />

        {/* ── Disease list ── */}
        <div style={{ padding: '0.75rem 0.75rem', flex: 1 }}>
          <div style={{
            padding: '0.5rem 0.875rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.25rem',
          }}>
            Diseases · {DISEASES.length}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {DISEASES.map((disease, idx) => {
              const isActive = activeDisease === disease.id;
              const icon = DISEASE_ICONS[disease.id] || '🔬';
              return (
                <button
                  key={disease.id}
                  onClick={() => navigate(disease.id)}
                  onMouseEnter={() => setHovered(disease.id)}
                  onMouseLeave={() => setHovered(null)}
                  title={disease.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    background: isActive
                      ? 'rgba(139,92,246,0.1)'
                      : hovered === disease.id ? 'var(--bg-elevated)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(139,92,246,0.25)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition)',
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                  <span style={{
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {disease.name}
                  </span>
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: '3px', borderRadius: '0 2px 2px 0',
                      background: 'var(--quantum)',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div className="dot dot-quantum" />
            <span>6 Models · 10 Diseases · 220+ Graphs</span>
          </div>
          <div>Hybrid Classical-Quantum ML · 2025</div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
