import React, { useState, useEffect } from 'react';
import { getPendingConsultants, handleConsultantAction } from '../../services/adminApi';
import ConsultantCredentialModal from './ConsultantCredentialModal';
import RejectConsultantModal from './RejectConsultantModal';

export default function ConsultantsTab() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'cards' | 'list'
  const [actionMessage, setActionMessage] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [rejectingConsultant, setRejectingConsultant] = useState(null);

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

  const handleApprove = async (consultant) => {
    try {
      await handleConsultantAction(consultant.id || consultant.user_id, 'approve');
      setActionMessage(`تمت موافقة واعتماد حساب المستشار ${consultant.name || consultant.full_name} بنجاح`);
      setSelectedConsultant(null);
      fetchConsultants();
    } catch (err) {
      setActionMessage('خطأ في الاعتماد: ' + err.message);
    }
  };

  const handleConfirmReject = async (rejectionData) => {
    if (!rejectingConsultant) return;
    try {
      await handleConsultantAction(
        rejectingConsultant.id || rejectingConsultant.user_id,
        'reject',
        rejectionData.reason
      );
      setActionMessage(
        rejectionData.mode === 'final'
          ? 'تم تسجيل القرار كالرفض النهائي للمستشار.'
          : 'تم إرسال طلب الاستكمال والمهلة للمستشار بنجاح.'
      );
      setRejectingConsultant(null);
      setSelectedConsultant(null);
      fetchConsultants();
    } catch (err) {
      setActionMessage('خطأ: ' + err.message);
    }
  };

  const kanbanLanes = ['قيد التوثيق', 'موثق', 'مرفوض', 'قيد التجديد'];

  const getConsultantsForLane = (lane) => {
    return consultants.filter((c) => {
      const st = (c.verification_status || c.status || 'قيد التوثيق').toLowerCase();
      if (lane === 'قيد التوثيق') return st.includes('توثيق') || st.includes('pending');
      if (lane === 'موثق') return st.includes('موثق') || st.includes('active') || st.includes('approved');
      if (lane === 'مرفوض') return st.includes('مرفوض') || st.includes('rejected');
      if (lane === 'قيد التجديد') return st.includes('تجديد') || st.includes('renewal');
      return false;
    });
  };

  return (
    <div>
      {/* Top Toolbar */}
      <div className="cc-toolbar">
        <div className="cc-toolbar-right">
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
            إدارة اعتمادات وحالات المستشارين
          </h3>
        </div>

        <div className="cc-toolbar-left">
          <div className="cc-view-toggle">
            <button
              className={`cc-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              title="كانبان (4 أعمدة)"
              onClick={() => setViewMode('kanban')}
            >
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="4" height="13" rx="1" /></svg>
            </button>
            <button
              className={`cc-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              title="بطاقات"
              onClick={() => setViewMode('cards')}
            >
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
            <button
              className={`cc-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="قائمة"
              onClick={() => setViewMode('list')}
            >
              <svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div style={{ background: '#e6f4ea', color: '#137333', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: 700 }}>
          {actionMessage}
        </div>
      )}

      {loading ? (
        <div className="cc-content-box">
          جاري استرجاع اعتمادات ووثائق المستشارين من قاعدة البيانات...
        </div>
      ) : (
        <>
          {viewMode === 'kanban' && (
            <div className="cc-kanban-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {kanbanLanes.map((lane) => {
                const laneItems = getConsultantsForLane(lane);

                return (
                  <div key={lane} className="cc-kanban-lane">
                    <div className="cc-lane-header">
                      <h4>{lane}</h4>
                      <span className="cc-lane-count">{laneItems.length}</span>
                    </div>

                    {laneItems.length === 0 ? (
                      <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                        لا توجد طلبات في هذا العمود.
                      </div>
                    ) : (
                      laneItems.map((item) => (
                        <div
                          className="cc-entity-card"
                          key={item.id}
                          style={{ marginBottom: '10px' }}
                          onClick={() => setSelectedConsultant(item)}
                        >
                          <div className="cc-card-top">
                            <div>
                              <div className="cc-card-title">{item.name || item.full_name || 'مستشار ضريبي'}</div>
                              <div className="cc-card-sub">{item.email || item.phone}</div>
                            </div>
                            <span className="cc-status pending">{lane}</span>
                          </div>

                          <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                            <button
                              className="cc-btn-primary"
                              style={{ height: '28px', fontSize: '11px', flex: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(item);
                              }}
                            >
                              اعتماد
                            </button>
                            <button
                              className="cc-btn-ghost"
                              style={{ height: '28px', fontSize: '11px', flex: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectingConsultant(item);
                              }}
                            >
                              رفض / استكمال
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'cards' && (
            <div className="cc-cards-grid">
              {consultants.map((item) => (
                <div
                  className="cc-entity-card"
                  key={item.id}
                  onClick={() => setSelectedConsultant(item)}
                >
                  <div className="cc-card-top">
                    <div>
                      <div className="cc-card-title">{item.name || item.full_name || 'مستشار ضريبي'}</div>
                      <div className="cc-card-sub">{item.email}</div>
                    </div>
                    <span className="cc-status pending">قيد التوثيق</span>
                  </div>

                  <div className="cc-card-meta">
                    <div>
                      <span>الترخيص</span>
                      <b>{item.license_number || 'متوفر'}</b>
                    </div>
                    <div>
                      <span>الخبرة</span>
                      <b>{item.years_of_experience || 5} سنوات</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>المستشار</th>
                    <th>الترخيص</th>
                    <th>الخبرة</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {consultants.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong className="cc-link" onClick={() => setSelectedConsultant(item)}>
                          {item.name || item.full_name}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.email}</div>
                      </td>
                      <td>{item.license_number || '—'}</td>
                      <td>{item.years_of_experience || 5} سنوات</td>
                      <td><span className="cc-status pending">قيد التوثيق</span></td>
                      <td>
                        <button className="cc-btn-primary" style={{ height: '28px', fontSize: '11px' }} onClick={() => setSelectedConsultant(item)}>
                          عرض الملف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedConsultant && (
        <ConsultantCredentialModal
          consultant={selectedConsultant}
          onClose={() => setSelectedConsultant(null)}
          onApprove={handleApprove}
          onReject={(c) => {
            setSelectedConsultant(null);
            setRejectingConsultant(c);
          }}
        />
      )}

      {rejectingConsultant && (
        <RejectConsultantModal
          consultant={rejectingConsultant}
          onClose={() => setRejectingConsultant(null)}
          onConfirm={handleConfirmReject}
        />
      )}
    </div>
  );
}
