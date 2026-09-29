// frontend/src/components/Regulations/RelatedDrawer.jsx
import React from 'react';

export default function RelatedDrawer({ isOpen, onClose, law }) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '440px',
        maxWidth: '90vw',
        background: '#fff',
        boxShadow: '0 0 50px rgba(0,0,0,0.3)',
        zIndex: 350,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        fontFamily: 'var(--reg-font)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--reg-navy)' }}>
          🔗 التشريعات والتعديلات المرتبطة
        </h3>
        <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: '#F8FAFC', borderRight: '4px solid var(--reg-blue)', padding: '14px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--reg-blue)' }}>لائحة تنفيذية</span>
          <h4 style={{ margin: '4px 0', fontSize: '0.95rem', color: 'var(--reg-navy)' }}>اللائحة التنفيذية لنظام العمل</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>توضح تفاصيل ضوابط فترة التجربة والإنهاء ونماذج العقود الاسترشادية.</p>
        </div>

        <div style={{ background: '#F8FAFC', borderRight: '4px solid var(--reg-orange)', padding: '14px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--reg-orange)' }}>قرار وزاري معدل</span>
          <h4 style={{ margin: '4px 0', fontSize: '0.95rem', color: 'var(--reg-navy)' }}>قرار وزير الموارد البشرية رقم (4412)</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>تعديل نموذج عقد العمل الموحد وتفعيل منصة قوى للاعتماد.</p>
        </div>

        <div style={{ background: '#F8FAFC', borderRight: '4px solid var(--reg-green)', padding: '14px', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--reg-green)' }}>سابقة قضائية</span>
          <h4 style={{ margin: '4px 0', fontSize: '0.95rem', color: 'var(--reg-navy)' }}>حكم المحكمة العمالية العليا (1444 هـ)</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>تطبيق المادة 77 وشروط استحقاق التعويض المالي عند إنهاء العقود غير محددة المدة.</p>
        </div>
      </div>
    </div>
  );
}
