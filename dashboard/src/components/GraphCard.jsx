import React, { useState } from 'react';

const GraphCard = ({ title, description, imageUrl, altText }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>{title}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{description}</p>
        </div>
        <div 
          style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '250px',
            cursor: imageUrl ? 'zoom-in' : 'default',
            position: 'relative'
          }}
          onClick={() => imageUrl && setIsExpanded(true)}
          title={imageUrl ? "Click to expand" : ""}
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={altText} 
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '4px', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'block';
                }
                // also remove cursor styles if image failed
                e.target.parentElement.style.cursor = 'default';
              }}
            />
          ) : null}
          <div style={{ display: !imageUrl ? 'block' : 'none', color: 'var(--text-muted)' }}>
            Graph data not available yet.
          </div>
        </div>
      </div>

      {isExpanded && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'zoom-out'
          }}
          onClick={() => setIsExpanded(false)}
        >
          <img 
            src={imageUrl} 
            alt={altText} 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              objectFit: 'contain', 
              borderRadius: '8px',
              backgroundColor: 'white',
              padding: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              cursor: 'default'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
          <button 
            style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '3rem',
              cursor: 'pointer'
            }}
            onClick={() => setIsExpanded(false)}
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
};

export default GraphCard;
