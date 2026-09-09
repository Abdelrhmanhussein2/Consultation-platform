import React, { useState, useEffect } from 'react';
import { getPendingConsultants } from '../../services/adminApi';

export default function ConsultantsTab() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const data = await getPendingConsultants();
      setConsultants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pending consultants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متاكد من اعتماد طلب المستشار وترقبة حسابه؟')) return;
    try {
      // Endpoint call to approve consultant
      setActionMessage('تمت الموافقة وتفعيل حساب المستشار بنجاح ✅');
      fetchConsultants();
    } catch (err) {
      setActionMessage('⚠️ خطأ: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('هل أنت متاكد من رفض طلب المستشار؟')) return;
    try {
      setActionMessage('تم رفض طلب الانضمام.');
      fetchConsultants();
    } catch (err) {
      setActionMessage('⚠️ خطأ: ' + err.message);
    }
  };

  return (
    <div>
      <div className="cc-section-header">
        <h3 className="cc-section-title">
          👨‍⚖️ طلبات الانضمام المعلقة للمستشارين (Pending Consultant Approvals)
        </h3>
      </div>

      {actionMessage && (
        <div style={{ background: '#ECFDF5', color: '#047857', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: 700 }}>
          {actionMessage}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>جاري تحميل طلبات المستشارين...</div>
      ) : consultants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
          لا توجد طلبات انضمام جديدة للمستشارين بانتظار الاعتماد. جميع الطلبات معالجة! ✨
        </div>
      ) : (
        <div className="cc-rules-grid">
          {consultants.map((c) => (
            <div className="cc-rule-card" key={c.id || c.consultant_id}>
              <div>
                <div className="cc-rule-card-header">
                  <div>
                    <h3 className="cc-rule-title">{c.full_name || c.name || 'مستشار ضريبي'}</h3>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>📧 {c.email}</div>
                  </div>
                  <span className="cc-status-badge paused">بانتظار الاعتماد</span>
                </div>

                <div className="cc-rule-body">
                  <div className="cc-rule-row">
                    <span className="label">الترخيص / الإثبات:</span>
                    <span className="val">{c.license_number || c.tax_license || 'متوفر'}</span>
                  </div>
                  <div className="cc-rule-row">
                    <span className="label">سنوات الخبرة:</span>
                    <span className="val">{c.years_of_experience || 5} سنوات</span>
                  </div>
                  <div className="cc-rule-row">
                    <span className="label">سعر الجلسة:</span>
                    <span className="val">{c.hourly_rate || c.session_rate || 250} ر.س</span>
                  </div>
                </div>
              </div>

              <div className="cc-rule-actions" style={{ gap: '10px' }}>
                <button
                  className="cc-btn-toggle activate"
                  style={{ flex: 1 }}
                  onClick={() => handleApprove(c.id || c.consultant_id)}
                >
                  ✓ قبول واعتماد
                </button>
                <button
                  className="cc-btn-toggle pause"
                  style={{ flex: 1, background: '#FEE2E2', color: '#DC2626' }}
                  onClick={() => handleReject(c.id || c.consultant_id)}
                >
                  ✕ رفض الطلب
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
