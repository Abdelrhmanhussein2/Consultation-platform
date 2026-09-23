import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  title = "تأكيد الإجراء",
  message = "هل أنت متأكد من رغبتك في المتابعة؟",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "danger", // 'danger' | 'primary' | 'warning'
  isLoading = false,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="diwan-confirm-overlay" onClick={onCancel}>
      <div className="diwan-confirm-card" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="diwan-confirm-header">
          <h3 className="diwan-confirm-title">{title}</h3>
        </div>
        
        <div className="diwan-confirm-body">
          <p className="diwan-confirm-message">{message}</p>
        </div>

        <div className="diwan-confirm-actions">
          {Boolean(cancelText) && (
            <button
              type="button"
              className="diwan-confirm-btn diwan-confirm-cancel"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}
          
          <button
            type="button"
            className={`diwan-confirm-btn diwan-confirm-${variant || 'primary'}`}
            onClick={onConfirm || onCancel}
            disabled={isLoading}
          >
            {isLoading ? "جاري التنفيذ..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
