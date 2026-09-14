import React from 'react';
import { IconSearch } from '../../components/AdminIcons';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';

export default function ConsultantSessionsTab({
  sessions,
  loadingSessions,
  sessionSearch,
  setSessionSearch,
  sessionStatusFilter,
  setSessionStatusFilter
}) {
  const filteredSessions = sessions.filter((s) => {
    const q = sessionSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      (s.client_name && s.client_name.toLowerCase().includes(q)) ||
      (s.consultant_name && s.consultant_name.toLowerCase().includes(q)) ||
      (s.appointment_id && s.appointment_id.toString().toLowerCase().includes(q));

    const matchStatus = sessionStatusFilter === 'all' || s.status === sessionStatusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Sessions KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        <div
          className="admin-card clickable-card"
          onClick={() => setSessionStatusFilter('all')}
          style={{
            cursor: 'pointer',
            border: sessionStatusFilter === 'all' ? '2px solid #0e3b5e' : '1px solid #E2E8F0',
            background: sessionStatusFilter === 'all' ? '#F0F7FF' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">إجمالي الجلسات</span>
            {sessionStatusFilter === 'all' && (
              <span style={{ fontSize: '11px', color: '#0e3b5e', fontWeight: '800' }}>الكل ✓</span>
            )}
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">{sessions.length}</span>
          </div>
        </div>

        <div
          className="admin-card clickable-card"
          onClick={() => setSessionStatusFilter(sessionStatusFilter === 'completed' ? 'all' : 'completed')}
          style={{
            cursor: 'pointer',
            border: sessionStatusFilter === 'completed' ? '2px solid #059669' : '1px solid #E2E8F0',
            background: sessionStatusFilter === 'completed' ? '#ECFDF5' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">جلسات مكتملة</span>
            {sessionStatusFilter === 'completed' && (
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>محدد ✓</span>
            )}
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">
              {sessions.filter((s) => s.status === 'completed').length}
            </span>
          </div>
        </div>

        <div
          className="admin-card clickable-card"
          onClick={() => setSessionStatusFilter(sessionStatusFilter === 'confirmed' ? 'all' : 'confirmed')}
          style={{
            cursor: 'pointer',
            border: sessionStatusFilter === 'confirmed' ? '2px solid #0e3b5e' : '1px solid #E2E8F0',
            background: sessionStatusFilter === 'confirmed' ? '#F0F7FF' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">مؤكدة / جارية</span>
            {sessionStatusFilter === 'confirmed' && (
              <span style={{ fontSize: '11px', color: '#0e3b5e', fontWeight: '800' }}>محدد ✓</span>
            )}
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">
              {sessions.filter((s) => s.status === 'confirmed' || s.status === 'in_progress').length}
            </span>
          </div>
        </div>

        <div
          className="admin-card clickable-card"
          onClick={() => setSessionStatusFilter(sessionStatusFilter === 'pending' ? 'all' : 'pending')}
          style={{
            cursor: 'pointer',
            border: sessionStatusFilter === 'pending' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
            background: sessionStatusFilter === 'pending' ? '#FFFBEB' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">معلقة / بانتظار</span>
            {sessionStatusFilter === 'pending' && (
              <span style={{ fontSize: '11px', color: '#D97706', fontWeight: '800' }}>محدد ✓</span>
            )}
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">
              {sessions.filter((s) => s.status === 'pending' || s.status === 'cancelled').length}
            </span>
          </div>
        </div>
      </div>

      {/* Sessions Search & Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        <div className="admin-search-wrapper" style={{ flex: 1 }}>
          <IconSearch size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="بحث باسم العميل، اسم المستشار، رمز الجلسة..."
            value={sessionSearch}
            onChange={(e) => setSessionSearch(e.target.value)}
          />
        </div>

        <div style={{ width: '200px' }}>
          <ModernSelect
            options={[
              { value: 'all', label: `كل الحالات (${sessions.length})` },
              { value: 'completed', label: `مكتملة (${sessions.filter((s) => s.status === 'completed').length})` },
              { value: 'confirmed', label: `مؤكدة (${sessions.filter((s) => s.status === 'confirmed').length})` },
              { value: 'pending', label: `معلقة (${sessions.filter((s) => s.status === 'pending').length})` },
              { value: 'cancelled', label: `ملغاة (${sessions.filter((s) => s.status === 'cancelled').length})` }
            ]}
            value={sessionStatusFilter}
            onChange={setSessionStatusFilter}
            placeholder="كل الحالات"
          />
        </div>
        <FilterResetButton
          onClick={() => {
            setSessionSearch('');
            setSessionStatusFilter('all');
          }}
          size={38}
        />
      </div>

      {/* Sessions Table Card */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
            تفاصيل جلسات الاستشارات من قاعدة البيانات ({filteredSessions.length})
          </h3>
          {loadingSessions && <span style={{ fontSize: '12px', color: '#64748B' }}>جاري التحميل...</span>}
        </div>

        <div className="admin-table-container">
          <table className="admin-table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>رمز الجلسة</th>
                <th>العميل</th>
                <th>المستشار</th>
                <th>الموعد والتاريخ</th>
                <th>المدة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((s, idx) => {
                  let statusBadge = { text: 'مؤكدة', bg: '#EFF6FF', color: '#0284C7', border: '#BAE6FD' };
                  if (s.status === 'completed')
                    statusBadge = { text: 'مكتملة', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
                  else if (s.status === 'pending')
                    statusBadge = { text: 'معلقة', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
                  else if (s.status === 'cancelled')
                    statusBadge = { text: 'ملغاة', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
                  else if (s.status === 'in_progress')
                    statusBadge = { text: 'جارية الآن', bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD' };

                  const rawId = s.appointment_id
                    ? `SES-${String(s.appointment_id).substring(0, 8).toUpperCase()}`
                    : `SES-${1000 + idx}`;
                  const formattedDate = s.scheduled_at
                    ? new Date(s.scheduled_at).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' })
                    : '—';

                  return (
                    <tr key={s.appointment_id || idx}>
                      <td style={{ fontWeight: '700', color: '#64748B' }}>{idx + 1}</td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: '700',
                            color: '#0F172A',
                            background: '#F1F5F9',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          {rawId}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: '#0F172A' }}>{s.client_name || 'عميل المنصة'}</td>
                      <td style={{ fontWeight: '700', color: '#0e3b5e' }}>{s.consultant_name || 'مستشار المنصة'}</td>
                      <td style={{ color: '#475569' }}>{formattedDate}</td>
                      <td style={{ color: '#475569' }}>
                        {s.duration_minutes ? `${s.duration_minutes} دقيقة` : '45 دقيقة'}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            border: `1px solid ${statusBadge.border}`
                          }}
                        >
                          {statusBadge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    لا توجد جلسات تطابق البحث في قاعدة البيانات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
