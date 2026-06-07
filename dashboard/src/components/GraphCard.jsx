import React, { useState, useCallback } from 'react';

const ExpandIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const GraphCard = ({ title, description, imageUrl, altText, size = 'normal' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgLoaded, setImgLoaded]   = useState(false);
  const [imgError, setImgError]     = useState(false);

  const handleKeyDown = useCallback(e => { if (e.key === 'Escape') setIsExpanded(false); }, []);

  React.useEffect(() => {
    if (isExpanded) { document.addEventListener('keydown', handleKeyDown); document.body.style.overflow = 'hidden'; }
    else            { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; }
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [isExpanded, handleKeyDown]);

  const minHeight = size === 'small' ? '180px' : size === 'large' ? '380px' : '260px';

  return (
    <>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem 0.875rem',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: description ? '0.25rem' : 0, letterSpacing: '-0.01em' }}>
              {title}
            </h3>
            {description && (
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.4, margin: 0 }}>{description}</p>
            )}
          </div>
          {imageUrl && !imgError && (
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '7px',
                color: '#94A3B8', cursor: 'pointer', padding: '0.35rem',
                display: 'flex', alignItems: 'center', transition: 'all 0.15s', flexShrink: 0,
              }}
              title="Expand graph"
              onMouseEnter={e => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.background = 'rgba(37,99,235,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
            >
              <ExpandIcon />
            </button>
          )}
        </div>

        {/* Image area */}
        <div style={{
          flex: 1, padding: '0.875rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight, cursor: imageUrl && !imgError ? 'zoom-in' : 'default',
          position: 'relative', background: imgLoaded ? 'transparent' : '#FAFAFA',
        }} onClick={() => imageUrl && !imgError && setIsExpanded(true)}>
          {/* Skeleton shimmer */}
          {!imgLoaded && !imgError && imageUrl && (
            <div style={{
              position: 'absolute', inset: '0.875rem', borderRadius: '8px',
              background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
              backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite',
            }} />
          )}
          {imageUrl && !imgError ? (
            <img
              src={imageUrl} alt={altText || title}
              style={{ maxWidth: '100%', maxHeight: size === 'large' ? '360px' : '340px', objectFit: 'contain', borderRadius: '6px', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease', display: 'block' }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : imgError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#CBD5E1', fontSize: '0.825rem' }}>
              <span style={{ fontSize: '1.75rem' }}>📊</span>
              <span style={{ color: '#94A3B8' }}>Graph not available</span>
            </div>
          ) : (
            <div style={{ color: '#CBD5E1', fontSize: '0.825rem' }}>No graph data</div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {isExpanded && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.2s ease',
        }} onClick={() => setIsExpanded(false)}>
          <button onClick={() => setIsExpanded(false)} style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%', width: '42px', height: '42px',
            color: 'white', fontSize: '1.25rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s', zIndex: 1,
          }}>✕</button>
          <div style={{
            position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '999px', padding: '0.5rem 1.25rem',
            color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', backdropFilter: 'blur(8px)',
          }}>
            {title} · Press Esc to close
          </div>
          <div style={{
            width: '90vw', height: '86vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={e => e.stopPropagation()}>
            <img
              src={imageUrl} alt={altText || title}
              style={{ background: '#FFFFFF', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
            />
          </div>
        </div>
      )}
      <style>{`
        @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

export default GraphCard;
