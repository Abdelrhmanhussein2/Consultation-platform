// frontend/src/components/Regulations/LegalReader/DocumentInfoPanel.jsx
import React, { useState } from 'react';

export default function DocumentInfoPanel({ law, notes, onRemoveNote }) {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="legal-reader-right-panel">
      <div className="panel-tabs-header">
        <button
          className={`panel-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          ℹ️ معلومات
        </button>
        <button
          className={`panel-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 التعديلات
        </button>
        <button
          className={`panel-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          📝 ملاحظاتي ({notes.length})
        </button>
      </div>

      <div className="panel-tab-body">
        {activeTab === 'info' && (
          <div style={{ fontSize: '0.9rem', color: 'var(--reg-text)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--reg-navy)' }}>بطاقة الوثيقة التشريعية</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div><strong>نوع الوثيقة:</strong> {law?.type || 'نظام ملكي'}</div>
              <div><strong>رقم المرسوم:</strong> {law?.number || 'م/51'}</div>
              <div><strong>تاريخ الإصدار:</strong> {law?.issue_date || '1426/08/23 هـ'}</div>
              <div><strong>الجهة المصدرة:</strong> {law?.issuing_authority || 'مجلس الوزراء'}</div>
              <div><strong>حالة النظام:</strong> <span style={{ color: '#149B6D', fontWeight: 700 }}>ساري المفعول</span></div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ fontSize: '0.85rem' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--reg-navy)' }}>التسلسل الزمني للتعديلات</h4>
            <div style={{ borderRight: '2px solid var(--reg-blue)', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong>تعديل 1445/03/15 هـ:</strong>
                <p style={{ margin: '2px 0 0 0', color: '#64748B' }}>تحديث أحكام فترة التجربة والتعويض عن فسخ العقد.</p>
              </div>
              <div>
                <strong>تعديل 1442/01/10 هـ:</strong>
                <p style={{ margin: '2px 0 0 0', color: '#64748B' }}>تحديث ساعات العمل المرنة والعمل عن بعد.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--reg-navy)', fontSize: '0.95rem' }}>
              الملاحظات والتظليلات المحفوظة
            </h4>
            {notes.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>لم تقم بتظليل أي نص أو إضافة ملاحظات بعد.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notes.map((n, idx) => (
                  <div key={idx} style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div style={{ fontStyle: 'italic', color: '#78350F', marginBottom: '4px' }}>"{n.selectedText}"</div>
                    {n.noteText && <div style={{ fontWeight: 700, color: '#92400E' }}>✍️ {n.noteText}</div>}
                    <button
                      onClick={() => onRemoveNote(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer', marginTop: '6px' }}
                    >
                      حذف الملاحظة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
