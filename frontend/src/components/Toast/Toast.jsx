import React from 'react';

/**
 * Global Toast Notification Component
 * Appears at the top-center of the screen, above everything.
 */
export default function Toast({ show, message, type = 'success' }) {
  if (!show) return null;

  const isError = type === 'error';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toastSlideIn {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);     opacity: 1; }
        }
      `}} />
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: isError ? '#FEF2F2' : '#F0FDF4',
        color: isError ? '#991B1B' : '#15803D',
        border: `1.5px solid ${isError ? '#FCA5A5' : '#86EFAC'}`,
        padding: '13px 28px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 99999,
        fontFamily: 'Tajawal, sans-serif',
        fontWeight: '700',
        fontSize: '15px',
        direction: 'rtl',
        whiteSpace: 'nowrap',
        animation: 'toastSlideIn 0.3s ease-out',
        pointerEvents: 'none',
      }}>
        {isError ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round">
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
