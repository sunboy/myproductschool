import React from 'react';

export function CuAnnouncementBar() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2000,
      background: 'linear-gradient(90deg, #6647f0 0%, #0091ff 100%)',
      padding: '10px 20px',
      textAlign: 'center',
      fontSize: 14,
      fontWeight: 500,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}>
      <span>✨</span>
      <span>
        Introducing <strong>ClickUp Brain Max</strong> — AI that works across your entire team
      </span>
      <a
        href="#"
        style={{
          color: '#fff',
          textDecoration: 'underline',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        Learn more →
      </a>
      <button
        style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: 18,
          cursor: 'pointer',
          lineHeight: 1,
          padding: 4,
          opacity: 0.8,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
