import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CrossDiseaseSummary from './pages/CrossDiseaseSummary';
import DiseaseDetail from './pages/DiseaseDetail';

function App() {
  const [activeDisease, setActiveDisease] = useState('summary');

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <Sidebar activeDisease={activeDisease} setActiveDisease={setActiveDisease} />
      
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        {activeDisease === 'summary' ? (
          <CrossDiseaseSummary />
        ) : (
          <DiseaseDetail key={activeDisease} diseaseId={activeDisease} />
        )}
      </main>
    </div>
  );
}

export default App;
