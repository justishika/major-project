import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CrossDiseaseSummary from './pages/CrossDiseaseSummary';
import DiseaseDetail from './pages/DiseaseDetail';
import RunnerDashboard from './pages/RunnerDashboard';
import GlobalLeaderboard from './pages/GlobalLeaderboard';
import CrossDiseaseAnalysis from './pages/CrossDiseaseAnalysis';

function App() {
  const [activeView, setActiveView] = useState('summary');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Close sidebar on small screens by default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    if (mq.matches) setSidebarOpen(false);
  }, []);

  const renderPage = () => {
    switch (activeView) {
      case 'summary':
        return <CrossDiseaseSummary />;
      case 'leaderboard':
        return <GlobalLeaderboard />;
      case 'cross-disease':
        return <CrossDiseaseAnalysis />;
      case 'runner':
        return <RunnerDashboard />;
      default:
        // Disease detail pages — activeView is the disease ID
        return <DiseaseDetail diseaseId={activeView} />;
    }
  };

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
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
            background: 'rgba(15,23,42,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
          className="mobile-overlay"
        />
      )}

      <main
        style={{
          flex: 1,
          padding: '3rem 3.5rem',
          overflowY: 'auto',
          maxHeight: '100vh',
          background: '#F8FAFC',
          transition: 'margin-left 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div key={activeView} className="animate-slide-up" style={{ maxWidth: '1360px', margin: '0 auto' }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
