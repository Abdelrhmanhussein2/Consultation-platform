import React, { useState, useEffect } from 'react';
import { get360EntityDetails } from '../../services/adminApi';

export default function Entity360Modal({ entityType, entityId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      setError('');
      try {
        const res = await get360EntityDetails(entityType, entityId);
        setData(res);
      } catch (err) {
        setError(err.message || 'حدث خطأ أثناء تحميل ملف 360°');
      } finally {
        setLoading(false);
      }
    }
    if (entityType && entityId) {
      loadDetails();
    }
  }, [entityType, entityId]);

  return (
    <div className="cc-modal-overlay" onClick={onClose}>
      <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="cc-modal-head">
          <div>
            <div className="cc-modal-title">ملف 360° الشامل للكيان</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {entityType === 'consultant' ? 'مستشار معتمد' : entityType === 'session' ? 'جلسة استشارية' : 'عميل / مستخدم'} · المعرف: {entityId}
            </div>
          </div>
          <button className="cc-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Modal Body */}
        <div className="cc-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
              جاري تجميع وإحالة البيانات المترابطة 360° من قاعدة البيانات...
            </div>
          ) : error ? (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', fontSize: '13px' }}>
              {error}
            </div>
          ) : !data ? null : (
            <div>
              {/* Profile Top Banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '18px', borderRadius: '14px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <div className="cc-avatar" style={{ width: '54px', height: '54px', fontSize: '20px' }}>
                  {(data.name || data.title || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>
                    {data.name || data.title || 'كيان إداري'}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {data.email && <span>البريد: {data.email}</span>}
                    {data.phone && <span>الهاتف: {data.phone}</span>}
                    <span>الحالة: <strong style={{ color: '#10b981' }}>{data.status || 'نشط'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="cc-modal-tabs" style={{ padding: 0, marginBottom: '20px' }}>
                <button
                  className={`cc-modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  نظرة عامة
                </button>
                <button
                  className={`cc-modal-tab ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  الجلسات ({data.appointments?.length || 0})
                </button>
                <button
                  className={`cc-modal-tab ${activeTab === 'invoices' ? 'active' : ''}`}
                  onClick={() => setActiveTab('invoices')}
                >
                  الفواتير ({data.invoices?.length || 0})
                </button>
                <button
                  className={`cc-modal-tab ${activeTab === 'tickets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tickets')}
                >
                  تذاكر الدعم ({data.tickets?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'overview' && (
                <div>
                  <div className="cc-stats-grid">
                    <div className="cc-stat-card">
                      <div className="cc-stat-content">
                        <span className="cc-stat-label">إجمالي الجلسات</span>
                        <span className="cc-stat-value">{data.summary_stats?.total_sessions || data.appointments?.length || 0}</span>
                      </div>
                    </div>
                    <div className="cc-stat-card">
                      <div className="cc-stat-content">
                        <span className="cc-stat-label">المبالغ المسجلة</span>
                        <span className="cc-stat-value">{data.summary_stats?.total_amount || 0} د.أ</span>
                      </div>
                    </div>
                    <div className="cc-stat-card">
                      <div className="cc-stat-content">
                        <span className="cc-stat-label">التقييم</span>
                        <span className="cc-stat-value">{data.summary_stats?.rating || '5.0'} / 5</span>
                      </div>
                    </div>
                  </div>

                  <h4 style={{ margin: '20px 0 10px 0', fontSize: '14px', fontWeight: 800 }}>تاريخ النشاط الأخير (Audit Logs):</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(data.audit_logs || []).slice(0, 5).map((log, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderRight: '4px solid #0d3859', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                        <div><strong>{log.action}</strong> — {log.details}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{log.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.appointments || []).length === 0 ? (
                    <p style={{ color: '#64748b' }}>لا توجد جلسات مسجلة.</p>
                  ) : (
                    data.appointments.map((apt, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>جلسة #{apt.id}</strong> — {apt.subject || 'استشارة ضريبية'}
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>تاريخ الموعد: {apt.scheduled_at || apt.date || '—'}</div>
                        </div>
                        <span className="cc-status active">{apt.status || 'مؤكدة'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'invoices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.invoices || []).length === 0 ? (
                    <p style={{ color: '#64748b' }}>لا توجد فواتير مسجلة.</p>
                  ) : (
                    data.invoices.map((inv, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>فاتورة #{inv.id}</strong> — {inv.amount} د.أ
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>تاريخ الإصدار: {inv.created_at || inv.date || '—'}</div>
                        </div>
                        <span className="cc-status active">{inv.status || 'مدفوعة'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'tickets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.tickets || []).length === 0 ? (
                    <p style={{ color: '#64748b' }}>لا توجد تذاكر دعم مسجلة.</p>
                  ) : (
                    data.tickets.map((tkt, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>تذكرة #{tkt.id}</strong> — {tkt.subject}
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>الأولوية: {tkt.priority || 'عادية'}</div>
                        </div>
                        <span className="cc-status pending">{tkt.status || 'مفتوحة'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="cc-modal-actions">
          <button className="cc-btn-ghost" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}
