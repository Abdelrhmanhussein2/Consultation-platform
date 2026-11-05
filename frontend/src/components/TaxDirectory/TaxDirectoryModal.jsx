// frontend/src/components/TaxDirectory/TaxDirectoryModal.jsx
import React, { useEffect } from 'react';

const CopyIcon = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export default function TaxDirectoryModal({ record, onClose, onCopyTax }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!record) return null;

  return (
    <div
      className="td-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tdModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="td-modal">
        {/* Modal Top Header */}
        <div className="td-modal-top">
          <button
            type="button"
            className="td-modal-close"
            onClick={onClose}
            aria-label="إغلاق"
            title="إغلاق"
          >
            ✕
          </button>
          <div className="td-modal-kicker">الكشف الضريبي والجهات المعتمدة</div>
          <div className="td-modal-heading-row">
            <div className="td-modal-emblem" aria-hidden="true">
              د
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#F59A23', fontWeight: 800, marginBottom: '3px' }}>
                معلومات الجهة
              </div>
              <h2 className="td-modal-title" id="tdModalTitle">
                {record.name || 'اسم الجهة غير متوفر'}
              </h2>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                <span className="td-type-tag">{record.type || 'غير محدد'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="td-modal-body">
          <div className="td-tax-label-row">
            <h3 className="td-detail-label">الرقم الضريبي</h3>
            <span className="td-tax-hint">رقم الجهة التعريفي</span>
          </div>

          <div className="td-tax-card">
            <div className="td-tax-value-wrap">
              <span className="td-tax-mini-mark" aria-hidden="true" />
              <strong>{record.tax || 'غير متوفر'}</strong>
            </div>
            <button
              type="button"
              className="td-copy-btn"
              onClick={() => onCopyTax(record.tax)}
              title="نسخ الرقم الضريبي"
            >
              <CopyIcon size={14} color="#FFFFFF" />
              <span>نسخ الرقم</span>
            </button>
          </div>

          <div className="td-details-heading">
            <span className="td-heading-bar" aria-hidden="true" />
            <span className="td-heading-text">بيانات الجهة</span>
          </div>

          <div className="td-details-grid">
            <div className="td-detail-box">
              <div className="label">اسم الجهة</div>
              <div className="value">{record.name || '—'}</div>
            </div>
            <div className="td-detail-box">
              <div className="label">نوع الجهة</div>
              <div className="value">{record.type || 'غير محدد'}</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom */}
        <div className="td-modal-bottom">
          <button
            type="button"
            className="td-btn-reset"
            onClick={onClose}
            style={{ height: '40px', padding: '0 22px' }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

