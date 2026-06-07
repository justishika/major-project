import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart2, BookOpen, Activity, Search, FlaskConical, ChevronRight } from 'lucide-react';
import { DISEASES, getBenchmarkResults, computeOverviewStats } from '../dataLoader';

const NAV_ITEMS = [
  { id: 'summary',       label: 'Overview',              icon: LayoutDashboard },
  { id: 'leaderboard',   label: 'Leaderboard',           icon: BarChart2 },
  { id: 'cross-disease', label: 'Research Insights',     icon: BookOpen },
];

const Sidebar = ({ activeView, setActiveView, sidebarOpen, setSidebarOpen }) => {
  const [search, setSearch]               = useState('');
  const [dynamicStats, setDynamicStats]   = useState(null);
  const [diseasesWithData, setDiseasesWithData] = useState(new Set());

  useEffect(() => {
    getBenchmarkResults().then(data => {
      if (data.length > 0) {
        setDynamicStats(computeOverviewStats(data, null));
        const ds = new Set();
        data.forEach(r => { if (r['Dataset']) ds.add(r['Dataset']); });
        setDiseasesWithData(ds);
      }
    });
  }, []);

  const navigate = id => {
    setActiveView(id);
    if (window.innerWidth < 900) setSidebarOpen(false);
  };

  const filtered = DISEASES.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '1.25rem',
          left: sidebarOpen ? '261px' : '1.25rem',
          zIndex: 100,
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: '#0F172A',
          border: '1px solid #1E293B',
          color: '#F8FAFC',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <ChevronRight style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} size={16} />
      </button>

      {/* Sidebar panel */}
      <div
        style={{
          width: '272px',
          minWidth: '272px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: '#020617',
          borderRight: '1px solid #0F172A',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          zIndex: 50,
          flexShrink: 0,
          marginLeft: sidebarOpen ? 0 : '-272px',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '2rem 1.5rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.375rem' }}>
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M45 74 C31.745 74 21 63.255 21 50 C21 36.745 31.745 26 45 26 C58.255 26 69 36.745 69 50 C69 55.4 67.2 60.4 64.1 64.1" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round" />
              <path d="M52 52 L80 80" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round" />
              <circle cx="82" cy="32" r="7" fill="#3B82F6" />
            </svg>
            <div>
              <div style={{
                fontWeight: 800, fontSize: '1.25rem',
                color: '#FFFFFF', letterSpacing: '-0.02em',
                lineHeight: 1.1, marginBottom: '0.15rem'
              }}>
                MedQuant
              </div>
              <div style={{ fontSize: '0.55rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Hybrid Clinical Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: '0.5rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          {NAV_ITEMS.map(item => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: '1px solid transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s ease', width: '100%',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.color = '#F8FAFC'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.7, color: isActive ? '#3B82F6' : 'inherit' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#0F172A', margin: '1rem 1.5rem' }} />

        {/* Disease Explorer */}
        <div style={{ padding: '0 0.875rem 1rem', flex: 1 }}>
          <div style={{
            padding: '0.25rem 0.625rem 0.625rem',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#64748B',
          }}>
            Clinical Datasets
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.875rem',
                paddingLeft: '2rem',
                background: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '6px',
                fontSize: '0.825rem', color: '#F8FAFC',
                outline: 'none', transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#334155'}
              onBlur={e => e.target.style.borderColor = '#1E293B'}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {filtered.map(disease => {
              const isActive  = activeView === disease.id;
              const hasData   = diseasesWithData.has(disease.id);
              return (
                <button
                  key={disease.id}
                  onClick={() => navigate(disease.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '6px',
                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: '1px solid transparent',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease', width: '100%',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.color = '#F8FAFC'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}}
                >
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    background: isActive ? '#3B82F6' : '#475569',
                    border: 'none'
                  }} />
                  <span style={{
                    fontSize: '0.825rem', fontWeight: isActive ? 600 : 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {disease.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid #0F172A',
          fontSize: '0.72rem', color: '#64748B', lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 600, color: '#94A3B8', marginBottom: '0.2rem' }}>
            Stanford-style Protocol
          </div>
          <div>v1.2.0-beta</div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
