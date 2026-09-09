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
      try {
        const res = await get360EntityDetails(entityType, entityId);
        setData(res);
      } catch (err) {
        setError(err.message || 'حدث خطأ أثناء تحميل سجل 360°');
      } finally {
        setLoading(false);
      }
    }
    if (entityType && entityId) {
      loadDetails();
    }
  }, [entityType, entityId]);

  return (
    <div className="cc-modal-overlay">
      <div className="cc-modal-content" style={{ maxWidth: '900px' }}>
        <div className="cc-modal-header">
          <div>
            <h2>ملف 360° الشامل للكيان 🌐</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
              {entityType === 'consultant' ? 'مستشار معتمد' : entityType === 'session' ? 'جلسة استشارية' : 'عميل / مستخدم'} • المعرف: {entityId}
            </p>
          </div>
          <button className="cc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="cc-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>
              جاري تجميع روابط البيانات المترابطة (360 Degree View)...
            </div>
          ) : error ? (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '16px', borderRadius: '12px' }}>
              ⚠️ {error}
            </div>
          ) : !data ? null : (
            <div>
              {/* Top Banner Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F8FAFC', padding: '18px', borderRadius: '16px', marginBottom: '20px' }}>
                <div className={`cc-avatar ${entityType}`}>
                  {(data.name || data.title || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>
                    {data.name || data.title || 'كيان غير محدد'}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', gap: '16px' }}>
                    {data.email && <span>📧 {data.email}</span>}
                    {data.phone && <span>📞 {data.phone}</span>}
                    <span>الحالة: <strong style={{ color: '#10B981' }}>{data.status || 'نشط'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px', gap: '12px' }}>
                <button
                  style={{
                    padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '13.5px',
                    color: activeTab === 'overview' ? '#0D3C5C' : '#64748B',
                    borderBottom: activeTab === 'overview' ? '3px solid #0D3C5C' : '3px solid transparent'
                  }}
                  onClick={() => setActiveTab('overview')}
                >
                  📊 نظرة عامة وإحصائيات
                </button>
                <button
                  style={{
                    padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '13.5px',
                    color: activeTab === 'appointments' ? '#0D3C5C' : '#64748B',
                    borderBottom: activeTab === 'appointments' ? '3px solid #0D3C5C' : '3px solid transparent'
                  }}
                  onClick={() => setActiveTab('appointments')}
                >
                  📅 الجلسات والمواعيد ({data.appointments?.length || 0})
                </button>
                <button
                  style={{
                    padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '13.5px',
                    color: activeTab === 'invoices' ? '#0D3C5C' : '#64748B',
                    borderBottom: activeTab === 'invoices' ? '3px solid #0D3C5C' : '3px solid transparent'
                  }}
                  onClick={() => setActiveTab('invoices')}
                >
                  💳 الفواتير والمعاملات المالية ({data.invoices?.length || 0})
                </button>
                <button
                  style={{
                    padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '13.5px',
                    color: activeTab === 'tickets' ? '#0D3C5C' : '#64748B',
                    borderBottom: activeTab === 'tickets' ? '3px solid #0D3C5C' : '3px solid transparent'
                  }}
                  onClick={() => setActiveTab('tickets')}
                >
                  🎫 تذاكر الدعم ({data.tickets?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'overview' && (
                <div>
                  <div className="cc-stats-grid">
                    <div className="cc-stat-card">
                      <div className="cc-stat-icon navy">📅</div>
                      <div className="cc-stat-info">
                        <label>إجمالي الجلسات</label>
                        <div className="value">{data.summary_stats?.total_sessions || data.appointments?.length || 0}</div>
                      </div>
                    </div>
                    <div className="cc-stat-card">
                      <div className="cc-stat-icon gold">💰</div>
                      <div className="cc-stat-info">
                        <label>إجمالي المبالغ المالية</label>
                        <div className="value">{data.summary_stats?.total_amount || 0} ر.س</div>
                      </div>
                    </div>
                    <div className="cc-stat-card">
                      <div className="cc-stat-icon green">⭐</div>
                      <div className="cc-stat-info">
                        <label>متوسط التقييم</label>
                        <div className="value">{data.summary_stats?.rating || '5.0'} / 5</div>
                      </div>
                    </div>
                  </div>

                  <h4 style={{ margin: '20px 0 10px 0', fontSize: '14px', fontWeight: 800 }}>تاريخ النشاط الأخير (Audit Log):</h4>
                  <div className="cc-log-list">
                    {(data.audit_logs || []).slice(0, 5).map((log, idx) => (
                      <div className="cc-log-item" key={idx}>
                        <div><strong>{log.action}</strong> — {log.details}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{log.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.appointments || []).length === 0 ? (
                    <p style={{ color: '#64748B' }}>لا توجد جلسات مسجلة.</p>
                  ) : (
                    data.appointments.map((apt, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>جلسة #{apt.id}</strong> — {apt.subject || 'استشارة ضريبية'}
                          <div style={{ fontSize: '12px', color: '#64748B' }}>تاريخ الموعد: {apt.scheduled_at}</div>
                        </div>
                        <span className="cc-status-badge active">{apt.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'invoices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.invoices || []).length === 0 ? (
                    <p style={{ color: '#64748B' }}>لا توجد فواتير مسجلة.</p>
                  ) : (
                    data.invoices.map((inv, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>فاتورة #{inv.id}</strong> — {inv.amount} ر.س
                          <div style={{ fontSize: '12px', color: '#64748B' }}>تاريخ الإصدار: {inv.created_at}</div>
                        </div>
                        <span className="cc-status-badge active">{inv.status || 'مدفوعة'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'tickets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(data.tickets || []).length === 0 ? (
                    <p style={{ color: '#64748B' }}>لا توجد تذاكر دعم مفتوحة.</p>
                  ) : (
                    data.tickets.map((tkt, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>تذكرة #{tkt.id}</strong> — {tkt.subject}
                          <div style={{ fontSize: '12px', color: '#64748B' }}>الأولوية: {tkt.priority}</div>
                        </div>
                        <span className="cc-status-badge paused">{tkt.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
