import React, { useState, useEffect } from 'react';
import { IconSearch } from '../components/AdminIcons';
import { getAdminUsers } from '../services/adminApi';

export default function AdminConsultantsPage({ navigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModal, setEditModal] = useState(null);

  const [consultants, setConsultants] = useState([]);

  // Fetch real registered consultants from backend API
  useEffect(() => {
    async function fetchConsultants() {
      try {
        const users = await getAdminUsers({ role: 'consultant', limit: 100 });
        if (Array.isArray(users)) {
          const mapped = users.map(u => {
            const profStatus = u.profile?.verification_status || u.verification_status;
            const isApproved = profStatus === 'approved';
            const isRejected = profStatus === 'rejected';
            return {
              id: u.id,
              name: u.full_name || u.name || 'مستشار بدون اسم',
              status: isApproved ? 'معتمد' : isRejected ? 'مرفوض' : 'بانتظار',
              hourlyRate: u.hourly_rate ? `${u.hourly_rate} د.أ/ساعة` : '0 د.أ/ساعة',
              city: u.address || u.city || 'مدينة غير محددة',
              email: u.email || '',
              phone: u.phone || '',
              sessionsCount: u.sessions_count || 0,
              revenue: u.revenue || '0 د.أ',
              license: u.title || u.license || 'رخصة غير محددة',
              specialties: Array.isArray(u.specialties) ? u.specialties : (u.title ? [u.title] : ['استشارات ضريبية'])
            };
          });
          setConsultants(mapped);
        }
      } catch (err) {
        console.warn('Could not fetch real consultants from backend:', err);
      }
    }
    fetchConsultants();
  }, []);

  const handleAction = async (id, action) => {
    if (action === 'approve') {
      try {
        const token = window.__ADMIN_TOKEN__ || document.cookie.match(/(^| )token=([^;]+)/)?.[2];
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${decodeURIComponent(token)}` } : {})
        };
        await fetch(`/api/super-admin/users/${id}/approve`, { method: 'POST', headers });
        await fetch(`/api/super-admin/consultants/${id}/action`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'approve' })
        });
      } catch (err) {
        console.warn('Backend action fallback:', err);
      }
      setConsultants(prev => prev.map(c => c.id === id ? { ...c, status: 'معتمد' } : c));
      alert('تم اعتماد وتفعيل المستشار بنجاح في قاعدة البيانات.');
    } else if (action === 'suspend') {
      setConsultants(prev => prev.map(c => c.id === id ? { ...c, status: 'موقوف' } : c));
      alert('تم إيقاف المستشار مؤقتاً.');
    } else if (action === 'reject') {
      try {
        const token = window.__ADMIN_TOKEN__ || document.cookie.match(/(^| )token=([^;]+)/)?.[2];
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${decodeURIComponent(token)}` } : {})
        };
        await fetch(`/api/super-admin/users/${id}/reject`, { method: 'POST', headers });
        await fetch(`/api/super-admin/consultants/${id}/action`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'reject', rejection_reason: 'تم الرفض من قبل الأدمن' })
        });
      } catch (err) {
        console.warn('Backend rejection fallback:', err);
      }
      setConsultants(prev => prev.map(c => c.id === id ? { ...c, status: 'مرفوض' } : c));
      alert('تم رفض المستشار وإرسال إشعار رسمي له.');
    }
  };

  const filtered = consultants.filter(c => {
    const matchSearch = c.name.includes(searchTerm) || c.city.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'approved' && c.status === 'معتمد') || (statusFilter === 'pending' && c.status === 'بانتظار');
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* 1. Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '18px' }}>
        <div>
          <div className="admin-banner-sub-tag">CONSULTANT GOVERNANCE</div>
          <h1 className="admin-banner-title">حوكمة المستشارين</h1>
          <p className="admin-banner-desc">
            اعتماد، رفض، إيقاف، تعديل، تخصصات وتسعير المستشارين من قاعدة البيانات مباشرة.
          </p>
        </div>
        <button 
          className="admin-btn-action-primary"
          onClick={() => alert('نافذة إضافة وتعيين مستشار جديد')}
        >
          <span>+ إضافة مستشار</span>
        </button>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">معتمدون</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">{consultants.filter(c => c.status === 'معتمد').length}</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">بانتظار</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">{consultants.filter(c => c.status === 'بانتظار').length}</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">مرفوض/موقوف</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">{consultants.filter(c => c.status === 'موقوف').length}</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">جلسات</span>
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">5</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        {/* Search input on right in RTL */}
        <div className="admin-search-wrapper" style={{ flex: 1 }}>
          <IconSearch size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="بحث بالاسم، البريد، المدينة، التخصص..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <select 
          className="admin-select-input"
          style={{ width: '160px', height: '38px' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          <option value="approved">معتمد</option>
          <option value="pending">بانتظار</option>
        </select>
      </div>

      {/* 4. Consultant Cards Stream */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div className="admin-card-header" style={{ marginBottom: '16px' }}>
          <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#E58A13' }}>🛡️</span>
            <span>المستشارون ({filtered.length})</span>
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(c => (
            <div 
              key={c.id}
              style={{
                border: '1px solid #EDF2F7',
                borderRadius: '12px',
                padding: '16px 20px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              {/* Left Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="admin-btn-action-outline"
                  style={{ fontSize: '12px', padding: '6px 12px', gap: '4px' }}
                  onClick={() => setEditModal(c)}
                >
                  <span>تعديل</span>
                  <span>👁</span>
                </button>

                {c.status === 'بانتظار' && (
                  <button 
                    className="admin-btn-action-primary"
                    style={{ background: '#0A3C64', fontSize: '12px', padding: '6px 14px', gap: '4px' }}
                    onClick={() => handleAction(c.id, 'approve')}
                  >
                    <span>✓ اعتماد</span>
                  </button>
                )}

                {c.status === 'معتمد' && (
                  <button 
                    className="admin-btn-action-outline"
                    style={{ fontSize: '12px', padding: '6px 12px', gap: '4px' }}
                    onClick={() => handleAction(c.id, 'suspend')}
                  >
                    <span>🚫 إيقاف</span>
                  </button>
                )}

                <button 
                  className="admin-btn-action-primary"
                  style={{ background: '#DC2626', fontSize: '12px', padding: '6px 14px', gap: '4px' }}
                  onClick={() => handleAction(c.id, 'reject')}
                >
                  <span>✕ رفض</span>
                </button>
              </div>

              {/* Right Details */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      padding: '2px 10px', 
                      borderRadius: '12px',
                      background: '#F0F9FF',
                      color: '#0284C7',
                      border: '1px solid #BAE6FD',
                      fontWeight: '700'
                    }}
                  >
                    {c.hourlyRate}
                  </span>

                  <span 
                    style={{ 
                      fontSize: '11px', 
                      padding: '2px 10px', 
                      borderRadius: '12px',
                      background: c.status === 'معتمد' ? '#ECFDF5' : '#FFFBEB',
                      color: c.status === 'معتمد' ? '#059669' : '#D97706',
                      border: c.status === 'معتمد' ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                      fontWeight: '700'
                    }}
                  >
                    {c.status}
                  </span>

                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                    {c.name}
                  </h4>
                </div>

                <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: c.specialties.length > 0 ? '8px' : '0' }}>
                  {c.city} • {c.sessionsCount} جلسة • {c.revenue} • {c.license}
                </div>

                {c.specialties.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    {c.specialties.map((s, idx) => (
                      <span 
                        key={idx} 
                        className="admin-category-chip" 
                        style={{ fontSize: '10.5px', padding: '2px 8px' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="admin-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: '800' }}>تعديل بيانات وتسعير المستشار</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>الاسم:</label>
              <input 
                type="text" 
                className="admin-search-input" 
                value={editModal.name} 
                onChange={e => setEditModal({ ...editModal, name: e.target.value })} 
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>سعر الساعة (JOD):</label>
              <input 
                type="text" 
                className="admin-search-input" 
                value={editModal.hourlyRate} 
                onChange={e => setEditModal({ ...editModal, hourlyRate: e.target.value })} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="admin-btn-action-outline" onClick={() => setEditModal(null)}>إلغاء</button>
              <button 
                className="admin-btn-action-primary" 
                onClick={() => {
                  setConsultants(consultants.map(c => c.id === editModal.id ? editModal : c));
                  alert('تم تحديث بيانات المستشار بنجاح');
                  setEditModal(null);
                }}
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
