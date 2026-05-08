import React from 'react';

const MetricsTable = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const headers = Object.keys(data[0]).filter(key => key !== 'Unnamed: 0');

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
      {title && <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h3>}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                {h.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              {headers.map(h => {
                let val = row[h];
                // Format numbers if they are floats
                if (typeof val === 'number' && !Number.isInteger(val)) {
                  val = val.toFixed(4);
                }
                // Highlight Hybrid model
                const isHybrid = row['Model'] === 'Hybrid';
                
                return (
                  <td key={h} style={{ 
                    padding: '0.75rem', 
                    fontSize: '0.95rem',
                    color: isHybrid ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: isHybrid ? 600 : 400
                  }}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetricsTable;
