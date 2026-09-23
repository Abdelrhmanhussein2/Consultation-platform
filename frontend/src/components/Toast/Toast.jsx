import React from 'react';

/**
 * Global Toast Notification Component
 * Appears at the top-center of the screen, above everything.
 */
export default function Toast({ show, message, type = 'success' }) {
  if (!show) return null;

  const isError = type === 'error';
  const isWarning = type === 'warning';

  const bgColor = isError ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#ECFDF5';
  const textColor = isError ? '#991B1B' : isWarning ? '#92400E' : '#065F46';
  const borderColor = isError ? '#F87171' : isWarning ? '#FBBF24' : '#34D399';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toastSlideIn {
          from { transform: translateX(-50%) translateY(-24px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);     opacity: 1; }
        }
      `}} />
      <div style={{
        position: 'fixed',
        top: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: bgColor,
        color: textColor,
        border: `1.5px solid ${borderColor}`,
        padding: '12px 24px',
        borderRadius: '12px',
        boxShadow: '0 12px 32px rgba(13, 60, 92, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 999999,
        fontFamily: "'Tajawal', sans-serif",
        fontWeight: '800',
        fontSize: '14px',
        direction: 'rtl',
        whiteSpace: 'nowrap',
        animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
      }}>
        {isError ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ) : isWarning ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#059669' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        <span>{message}</span>
      </div>
    </>
  );
}

/**
 * Custom hook to manage toast state easily.
 * Usage:
 *   const { toast, showToast } = useToast();
 *   <Toast {...toast} />
 */
export function useToast(duration = 4000) {
  const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });

  const showToast = React.useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, duration);
  }, [duration]);

  return { toast, showToast };
}
