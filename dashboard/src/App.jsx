import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CrossDiseaseSummary from './pages/CrossDiseaseSummary';
import DiseaseDetail from './pages/DiseaseDetail';
import RunnerDashboard from './pages/RunnerDashboard';

function App() {
  const [activeDisease, setActiveDisease] = useState('summary');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Close sidebar on small screens by default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    if (mq.matches) setSidebarOpen(false);
  }, []);

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar
        activeDisease={activeDisease}
        setActiveDisease={setActiveDisease}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
          className="mobile-overlay"
        />
      )}

      <main
        style={{
          flex: 1,
          padding: '2.5rem 3rem',
          overflowY: 'auto',
          maxHeight: '100vh',
          transition: 'margin-left 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div key={activeDisease} className="animate-slide-up" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {activeDisease === 'summary' ? (
            <CrossDiseaseSummary />
          ) : activeDisease === 'runner' ? (
            <RunnerDashboard />
          ) : (
            <DiseaseDetail diseaseId={activeDisease} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
