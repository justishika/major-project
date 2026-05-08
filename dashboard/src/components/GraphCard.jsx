import React from 'react';

const GraphCard = ({ title, description, imageUrl, altText }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '250px'
      }}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={altText} 
            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '4px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <div style={{ display: !imageUrl ? 'block' : 'none', color: 'var(--text-muted)' }}>
          Graph data not available yet.
        </div>
      </div>
    </div>
  );
};

export default GraphCard;
