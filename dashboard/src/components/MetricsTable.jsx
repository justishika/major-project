import React from 'react';

/* Color-code model names */
const MODEL_COLORS = {
  'Hybrid (Classical+Quantum)': 'var(--hybrid-light)',
  'Hybrid':                     'var(--hybrid-light)',
  'QK-SVM (Noiseless)':         'var(--quantum-light)',
  'QK-SVM (Noisy)':             '#c084fc',
  'Random Forest':              'var(--classical)',
  'SVM':                        '#67e8f9',
  'Logistic Regression':        '#86efac',
};

const MODEL_DOTS = {
  'Hybrid (Classical+Quantum)': 'dot-hybrid',
  'Hybrid':                     'dot-hybrid',
  'QK-SVM (Noiseless)':         'dot-quantum',
  'QK-SVM (Noisy)':             'dot-quantum',
  'Random Forest':              'dot-classical',
  'SVM':                        'dot-classical',
  'Logistic Regression':        'dot-classical',
};

const MetricsTable = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const headers = Object.keys(data[0]).filter(k => k !== 'Unnamed: 0');

  return (
    <div className="panel" style={{ overflowX: 'auto' }}>
      {title && (
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {title}
          </span>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h}>{h.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const modelName = row['Model'] || '';
            const isHybrid = modelName.includes('Hybrid');
            const dotClass = MODEL_DOTS[modelName] || 'dot-classical';
            const textColor = MODEL_COLORS[modelName];

            return (
              <tr key={idx} style={isHybrid ? { background: 'rgba(245,158,11,0.04)' } : {}}>
                {headers.map(h => {
                  let val = row[h];
                  if (typeof val === 'number' && !Number.isInteger(val)) {
                    val = val.toFixed(4);
                  }
                  const isModel = h === 'Model';
                  return (
                    <td key={h} style={{
                      color: isModel ? textColor : (isHybrid ? 'var(--text-primary)' : undefined),
                      fontWeight: isHybrid ? 500 : 400,
                    }}>
                      {isModel ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className={`dot ${dotClass}`} />
                          {val}
                        </div>
                      ) : val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MetricsTable;
