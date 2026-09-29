// frontend/src/components/Regulations/FullTextModal.jsx
import React from 'react';

export default function FullTextModal({ isOpen, onClose, law }) {
  if (!isOpen || !law) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reg-modal-backdrop" onClick={onClose} style={{ zIndex: 400 }}>
      <div className="reg-modal-content" style={{ maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="reg-modal-header">
          <div>
            <h3 className="reg-modal-title">📄 النص الكامل الرسمي - {law.title}</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>الرقم: {law.number} | التاريخ: {law.year}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="reg-btn-outline" onClick={handlePrint}>🖨️ طباعة / PDF</button>
            <button className="reg-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#FAFAFA', borderRadius: '12px', border: '1px solid #E2E8F0', lineHeight: 1.8, fontSize: '1rem', color: '#1E293B' }}>
          <h2 style={{ textAlign: 'center', color: 'var(--reg-navy)', marginBottom: '24px' }}>
            {law.title}
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--reg-blue)', borderBottom: '2px solid var(--reg-blue)', paddingBottom: '6px' }}>الباب الأول: الأحكام العامة</h3>
            <p><strong>المادة الأولى:</strong> تسري أحكام هذا النظام على كافة العقود والالتزامات العمالية الناشئة في المملكة العربية السعودية.</p>
            <p><strong>المادة الثانية:</strong> يكون للكلمات والعبارات التالية المعاني المحددة لها ما لم يقتض السياق غير ذلك.</p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--reg-blue)', borderBottom: '2px solid var(--reg-blue)', paddingBottom: '6px' }}>الباب الثاني: حقوق الطرفين وعقد العمل</h3>
            <p><strong>المادة الخمسون:</strong> يثبت عقد العمل بالكتابة ويحرر من نسختين أصلتين تحتفظ كل جهة بنسخة معتمدة.</p>
            <p><strong>المادة السابعة والسبعون:</strong> إذا أنهي العقد لسبب غير مشروع يستحق الطرف المتضرر تعويضاً مالياً عادلاً.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
