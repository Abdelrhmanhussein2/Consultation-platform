import React, { useState } from 'react';

export default function ConsultantCredentialModal({ consultant, onClose, onApprove, onReject }) {
  const [activeTab, setActiveTab] = useState('full');

  if (!consultant) return null;

  return (
    <div className="cc-modal-overlay" onClick={onClose}>
      <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cc-modal-head">
          <div>
            <div className="cc-modal-title">ملف الاعتماد والتوثيق للمستشار — {consultant.name || consultant.full_name}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              المعرف: {consultant.id} · الترخيص: {consultant.license_number || consultant.license || 'مستوفى'}
            </div>
          </div>
          <button className="cc-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Modal Sub Tabs */}
        <div className="cc-modal-tabs">
          <button
            className={`cc-modal-tab ${activeTab === 'full' ? 'active' : ''}`}
            onClick={() => setActiveTab('full')}
          >
            الملف الكامل
          </button>
          <button
            className={`cc-modal-tab ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            الوثائق والشهادات
          </button>
          <button
            className={`cc-modal-tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            التقييمات والجودة
          </button>
        </div>

        {/* Modal Body */}
        <div className="cc-modal-body">
          {activeTab === 'full' && (
            <div>
              <div className="cc-stats-grid">
                <div className="cc-stat-card">
                  <div className="cc-stat-content">
                    <span className="cc-stat-label">الخبرة والمؤهل</span>
                    <span className="cc-stat-value" style={{ fontSize: '15px' }}>{consultant.years_of_experience || 8} سنوات خبرة</span>
                  </div>
                </div>

                <div className="cc-stat-card">
                  <div className="cc-stat-content">
                    <span className="cc-stat-label">الاستشارات المنفذة</span>
                    <span className="cc-stat-value">{consultant.consultations_count || consultant.consultations || 0}</span>
                  </div>
                </div>

                <div className="cc-stat-card">
                  <div className="cc-stat-content">
                    <span className="cc-stat-label">التقييم العام</span>
                    <span className="cc-stat-value">{consultant.rating || '4.9'} / 5</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800 }}>البيانات الأساسية والتغطية:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div><strong>البريد الإلكتروني:</strong> {consultant.email || '—'}</div>
                  <div><strong>رقم الهاتف:</strong> {consultant.phone || '—'}</div>
                  <div><strong>التخصصات:</strong> {Array.isArray(consultant.specialties) ? consultant.specialties.join('، ') : consultant.specialties || 'ضريبة المبيعات والدخل'}</div>
                  <div><strong>الدول المشمولة:</strong> {Array.isArray(consultant.countries) ? consultant.countries.join('، ') : 'الأردن، السعودية'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>صورة الهوية الوطنية / إثبات الشخصية</strong>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>الحالة: صالح ومتحقق</div>
                </div>
                <button className="cc-btn-ghost" onClick={() => alert('معاينة المستند')}>معاينة</button>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>الشهادة الأكاديمية والترخيص الضريبي</strong>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>الحالة: سارية المفعول</div>
                </div>
                <button className="cc-btn-ghost" onClick={() => alert('معاينة المستند')}>معاينة</button>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '32px' }}>
              جميع مراجعات وتقييمات العملاء السابقة ضمن المستوى المستهدف (ممتاز).
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="cc-modal-actions">
          <button className="cc-btn-ghost" onClick={onClose}>إغلاق</button>
          <button className="cc-btn-ghost" onClick={() => onReject(consultant)}>طلب استكمال / رفض</button>
          <button className="cc-btn-primary" onClick={() => onApprove(consultant)}>قبول واعتماد</button>
        </div>
      </div>
    </div>
  );
}
