import React, { useState, useCallback } from 'react';

/* Expand icon SVG inline */
const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

const GraphCard = ({ title, description, imageUrl, altText, size = 'normal' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setIsExpanded(false);
  }, []);

  React.useEffect(() => {
    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isExpanded, handleKeyDown]);

  const minHeight = size === 'small' ? '180px' : size === 'large' ? '380px' : '260px';

  return (
    <>
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Card Header ── */}
        <div style={{
          padding: '1rem 1.25rem 0.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: description ? '0.3rem' : 0,
              letterSpacing: '-0.01em',
            }}>
              {title}
            </h3>
            {description && (
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                {description}
              </p>
            )}
          </div>
          {imageUrl && !imgError && (
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                transition: 'var(--transition)',
                flexShrink: 0,
              }}
              title="Expand graph"
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--quantum-light)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            >
              <ExpandIcon />
            </button>
          )}
        </div>

        {/* ── Image area ── */}
        <div
          style={{
            flex: 1,
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight,
            cursor: imageUrl && !imgError ? 'zoom-in' : 'default',
            position: 'relative',
            background: imgLoaded ? 'transparent' : 'rgba(255,255,255,0.01)',
          }}
          onClick={() => imageUrl && !imgError && setIsExpanded(true)}
        >
          {/* Skeleton shimmer while loading */}
          {!imgLoaded && !imgError && imageUrl && (
            <div style={{
              position: 'absolute', inset: '0.75rem',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          )}

          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={altText || title}
              style={{
                maxWidth: '100%',
                maxHeight: size === 'large' ? '360px' : '340px',
                objectFit: 'contain',
                borderRadius: '6px',
                opacity: imgLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
                display: 'block',
              }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : imgError ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-muted)',
              fontSize: '0.825rem',
            }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <span>Graph not available</span>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
              No graph data
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {isExpanded && (
        <div
          className="lightbox-overlay"
          onClick={() => setIsExpanded(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              color: 'white',
              fontSize: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)',
              zIndex: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            ✕
          </button>

          {/* Caption */}
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            border: '1px solid var(--border-strong)',
            borderRadius: '999px',
            padding: '0.5rem 1.25rem',
            color: 'var(--text-secondary)',
            fontSize: '0.825rem',
            backdropFilter: 'blur(8px)',
          }}>
            {title} · Press Esc to close
          </div>

          <img
            src={imageUrl}
            alt={altText || title}
            style={{
              maxWidth: '92vw',
              maxHeight: '86vh',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </>
  );
};

export default GraphCard;
