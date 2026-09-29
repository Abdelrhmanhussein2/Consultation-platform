// frontend/src/pages/DateDesignPage.jsx
import React, { useState } from 'react';
import ModernDatePicker from '../components/ModernDatePicker/ModernDatePicker';

export default function DateDesignPage() {
  const [singleDate, setSingleDate] = useState('01/01/2024');
  const [dateFrom, setDateFrom] = useState('01/01/2010');
  const [dateTo, setDateTo] = useState('31/12/2018');

  return (
    <div style={{
      fontFamily: "'Tajawal', sans-serif",
      padding: '40px 24px',
      maxWidth: '960px',
      margin: '0 auto',
      direction: 'rtl',
      color: '#0D3C5C'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid #DCE5EA',
        boxShadow: '0 12px 40px rgba(13, 60, 92, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #E5EBEE', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0D3C5C' }}>تصميم منقي التواريخ العصري (Modern Date Picker Design)</h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '13px' }}>
              مكون مخصص يتيح اختيار التاريخ من تقويم تفاعلي عصري أو كتابته يدوياً مع أزرار اختصارات سريعة، يعتمد خط <strong>Tajawal</strong> حصرياً.
            </p>
          </div>
          <span style={{ background: '#E8F8F1', color: '#149B6D', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>
            جاهز للاستخدام والتصدير
          </span>
        </div>

        {/* Section 1: Single Date Picker */}
        <div style={{ marginBottom: '36px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0D3C5C', marginBottom: '12px' }}>1. اختيار تاريخ منفرد (Single Date)</h3>
          <div style={{ maxWidth: '320px' }}>
            <ModernDatePicker
              label="تاريخ الإجراء / صدور القانون"
              value={singleDate}
              onChange={setSingleDate}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748B' }}>
            القيمة المحددة حالياً: <strong>{singleDate || 'لم يتم التحديد'}</strong>
          </div>
        </div>

        {/* Section 2: Range Date Picker */}
        <div style={{ marginBottom: '36px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0D3C5C', marginBottom: '12px' }}>2. نطاق فترة زمنية (Date Range)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '640px' }}>
            <ModernDatePicker
              label="من تاريخ"
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="DD/MM/YYYY"
            />
            <ModernDatePicker
              label="إلى تاريخ"
              value={dateTo}
              onChange={setDateTo}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            الفترة المحددة: من <strong>{dateFrom || '---'}</strong> إلى <strong>{dateTo || '---'}</strong>
          </div>
        </div>

        {/* Section 3: Usage Instructions */}
        <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 800, color: '#0D3C5C' }}>طريقة الاستخدام والإستدعاء في أي صفحة:</h4>
          <pre style={{
            background: '#0D3C5C',
            color: '#ffffff',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '12px',
            direction: 'ltr',
            overflowX: 'auto',
            margin: 0
          }}>
{`import ModernDatePicker from '../components/ModernDatePicker/ModernDatePicker';

<ModernDatePicker
  label="من تاريخ"
  value={dateFrom}
  onChange={(val) => setDateFrom(val)}
  placeholder="DD/MM/YYYY"
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
