// frontend/src/components/Regulations/LegalReader/LegalArticleCompare.jsx
import React from 'react';

export default function LegalArticleCompare({ isOpen, onClose, historyData }) {
  if (!isOpen || !historyData) return null;

  return (
    <div className="reg-modal-backdrop" style={{ zIndex: 420 }} onClick={onClose}>
      <div className="reg-modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        <div className="reg-modal-header">
          <h3 className="reg-modal-title">مقارنة التعديلات التشريعية - المادة {historyData.article_num}</h3>
          <button className="reg-modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: '#EFF6FF', borderRight: '4px solid var(--reg-blue)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem', color: '#1E40AF' }}>
          <strong>ملخص التعديل:</strong> {historyData.changes_summary}
          <div style={{ marginTop: '4px', fontSize: '0.8rem', opacity: 0.85 }}>تاريخ التعديل: {historyData.amendment_date}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Old Version */}
          <div style={{ background: '#FFF0F0', border: '1px solid #FECDD3', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#991B1B', fontSize: '0.95rem' }}>
              النص السابق (قبل التعديل)
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#7F1D1D' }}>
              {historyData.previous_version}
            </div>
          </div>

          {/* New Version */}
          <div style={{ background: '#E8F8F1', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#065F46', fontSize: '0.95rem' }}>
              النص الحالي الساري (بعد التعديل)
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#064E3B' }}>
              {historyData.current_version}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="reg-btn-outline" onClick={onClose}>إغلاق المقارنة</button>
        </div>
      </div>
    </div>
  );
}
