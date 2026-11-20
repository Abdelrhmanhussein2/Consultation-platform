import React, { useState, useEffect } from 'react';
import './AdminConsultantsPage.css';
import { IconSearch } from '../components/AdminIcons';
import {
  getAdminUsers,
  createAdminUser,
  toggleUserActive,
  updateUserProfile,
  handleConsultantAction,
  deleteAdminUser
} from '../services/adminApi';
import ModernSelect from '../../components/ModernSelect';
import FilterResetButton from '../../components/FilterResetButton';
import {
  AddConsultantModal,
  EditConsultantModal,
  SuccessPopupModal,
  isPasswordValid
} from './consultants/ConsultantModals';

export default function AdminConsultantsPage({ navigate }) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModal, setEditModal] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // New Consultant Form State
  const [newConsultant, setNewConsultant] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    city: 'عمّان',
    hourlyRate: '45',
    specializationId: '9',
    title: 'أ.',
    activityType: 'مستشار ضريبي',
    jcpaNumber: '',
    bio: 'مستشار معتمد متخصص في التشريعات الضريبية والامتثال المالي.'
  });
  const [successModal, setSuccessModal] = useState(null);

  const [consultants, setConsultants] = useState([]);

  const loadConsultants = async () => {
    try {
      const users = await getAdminUsers({ role: 'consultant', limit: 100 });
      if (Array.isArray(users)) {
        const mapped = users.map((u) => {
          const profStatus = u.verification_status || u.profile?.verification_status;
          const isApproved = profStatus === 'approved';
          const isSuspended = u.is_active === false;

          let statusLabel = 'بانتظار';
          if (isSuspended) {
            statusLabel = 'موقوف';
          } else if (isApproved) {
            statusLabel = 'معتمد';
          }

          const rawPrice = (u.price_per_hour != null && u.price_per_hour !== '')
            ? Number(u.price_per_hour)
            : (u.hourly_rate != null && u.hourly_rate !== '')
            ? Number(u.hourly_rate)
            : null;
          return {
            id: u.id,
            name: u.full_name || u.name || 'مستشار بدون اسم',
            title: u.title || '',
            activityType: u.activity_type || '',
            jcpaNumber: u.jcpa_number || '',
            specializationId: u.main_specialization_id ? String(u.main_specialization_id) : '',
            status: statusLabel,
            rawStatus: profStatus,
            isActive: u.is_active !== false,
            hourlyRate: rawPrice != null ? `${rawPrice} د.أ/ساعة` : 'لم يحدد بعد',
            rawRate: rawPrice,
            city: u.address || u.city || 'عمّان',
            email: u.email || '—',
            phone: u.phone || '—',
            avatar: u.avatar_url || u.avatar || null,
            sessionsCount: Number(u.sessions_count || 0),
            revenue: u.revenue ? `${u.revenue} د.أ` : '0 د.أ',
            license: u.activity_type || u.title || 'مستشار معتمد',
            specialties:
              Array.isArray(u.specialties) && u.specialties.length > 0
                ? u.specialties
                : [u.specialization || 'ضريبة الدخل والمبيعات']
          };
        });
        setConsultants(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch real consultants from backend:', err);
    }
  };

  useEffect(() => {
    loadConsultants();
    fetch('/api/specializations')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSpecializations(data);
          setNewConsultant((prev) => ({ ...prev, specializationId: data[0].id.toString() }));
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      loadConsultants();
    }, 10000);

    const onDataUpdated = () => {
      loadConsultants();
    };

    window.addEventListener('focus', onDataUpdated);
    window.addEventListener('admin_data_updated', onDataUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onDataUpdated);
      window.removeEventListener('admin_data_updated', onDataUpdated);
    };
  }, []);

  const handleAction = async (id, action) => {
    if (action === 'approve') {
      try {
        await handleConsultantAction(id, 'approve');
        const target = consultants.find((c) => c.id === id);
        setSuccessModal({
          title: 'تم اعتماد وتفعيل المستشار بنجاح!',
          name: target?.name || 'المستشار',
          email: target?.email || '',
          role: 'مستشار معتمد'
        });
        await loadConsultants();
        window.dispatchEvent(new Event('admin_data_updated'));
      } catch (err) {
        alert(err.message || 'حدث خطأ أثناء اعتماد المستشار');
      }
    } else if (action === 'suspend' || action === 'activate') {
      try {
        await toggleUserActive(id);
        await loadConsultants();
        window.dispatchEvent(new Event('admin_data_updated'));
      } catch (err) {
        alert(err.message || 'حدث خطأ أثناء تعديل حالة الحساب');
      }
    } else if (action === 'delete') {
      const target = consultants.find((c) => c.id === id);
      const confirmed = window.confirm(`هل أنت متأكد من رغبتك في حذف حساب المستشار (${target?.name || ''}) نهائياً من المنصة؟`);
      if (!confirmed) return;
      try {
        await deleteAdminUser(id);
        await loadConsultants();
        window.dispatchEvent(new Event('admin_data_updated'));
      } catch (err) {
        alert(err.message || 'حدث خطأ أثناء حذف المستشار');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSavingEdit(true);
    try {
      const cleanNum = parseFloat(String(editModal.hourlyRate).replace(/[^\d.]/g, '')) || 40.0;
      await updateUserProfile(editModal.id, {
        full_name: editModal.name.trim(),
        title: editModal.title || 'أ.',
        activity_type: editModal.activityType || 'مستشار ضريبي',
        jcpa_number: editModal.jcpaNumber || '',
        main_specialization_id: editModal.specializationId ? parseInt(editModal.specializationId) : undefined,
        price_per_hour: cleanNum
      });
      alert('تم تحديث بيانات وتسعير المستشار بنجاح في قاعدة البيانات.');
      setEditModal(null);
      await loadConsultants();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateConsultantSubmit = async (e) => {
    e.preventDefault();
    if (!newConsultant.fullName.trim() || !newConsultant.email.trim() || !newConsultant.password) {
      alert('يرجى ملء الاسم الكامل، البريد الإلكتروني، وكلمة المرور.');
      return;
    }

    if (!isPasswordValid(newConsultant.password)) {
      alert('كلمة المرور يجب أن تكون قوية وتحتوي على 8 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص (مثل: !@#$).');
      return;
    }

    setLoadingAdd(true);
    try {
      const payload = {
        full_name: newConsultant.fullName.trim(),
        email: newConsultant.email.trim().toLowerCase(),
        password: newConsultant.password,
        phone: newConsultant.phone.trim() || undefined,
        role: 'consultant',
        city: newConsultant.city.trim(),
        title: newConsultant.title.trim(),
        main_specialization_id: parseInt(newConsultant.specializationId) || 9,
        price_per_hour: parseFloat(newConsultant.hourlyRate) || 40.0,
        bio: newConsultant.bio.trim()
      };

      const res = await createAdminUser(payload);
      if (res && (res.id || res.email)) {
        setSuccessModal({
          title: 'تمت إضافة واعتماد المستشار بنجاح!',
          name: payload.full_name,
          email: payload.email,
          role: 'مستشار ضريبي معتمد'
        });
        setAddModalOpen(false);
        setNewConsultant({
          fullName: '',
          email: '',
          password: '',
          phone: '',
          city: 'عمّان',
          hourlyRate: '45',
          specializationId: specializations[0]?.id?.toString() || '9',
          title: 'أ.',
          activityType: 'مستشار ضريبي',
          jcpaNumber: '',
          bio: 'مستشار معتمد متخصص في التشريعات الضريبية والامتثال المالي.'
        });
        loadConsultants();
      } else {
        alert(res?.detail || 'حدث خطأ أثناء إضافة المستشار');
      }
    } catch (err) {
      alert(err.message || 'خطأ في الاتصال بالخادم أثناء إضافة المستشار.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const filtered = consultants.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.license && c.license.toLowerCase().includes(q)) ||
      (Array.isArray(c.specialties) && c.specialties.some((s) => s.toLowerCase().includes(q)));

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && c.status === 'معتمد') ||
      (statusFilter === 'pending' && c.status === 'بانتظار') ||
      (statusFilter === 'suspended' && c.status === 'موقوف');

    return matchSearch && matchStatus;
  });

  return (
    <div dir="rtl">
      {/* 1. Header Banner */}
      <div
        className="admin-command-banner"
        style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <div className="admin-banner-sub-tag">CONSULTANT GOVERNANCE</div>
          <h1 className="admin-banner-title">حوكمة المستشارين</h1>
          <p className="admin-banner-desc">
            إضافة واعتماد وتعديل بيانات وتسعير المستشارين وإدارة حالتهم التشغيلية من قاعدة البيانات مباشرة.
          </p>
        </div>
        <button
          className="admin-btn-action-primary"
          onClick={() => setAddModalOpen(true)}
          style={{ cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px' }}
        >
          <span>+ إضافة مستشار</span>
        </button>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <div
          className="admin-card clickable-card"
          onClick={() => setStatusFilter('all')}
          style={{
            cursor: 'pointer',
            border: statusFilter === 'all' ? '2px solid #0e3b5e' : '1px solid #E2E8F0',
            background: statusFilter === 'all' ? '#F0F7FF' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">إجمالي المستشارين</span>
            {statusFilter === 'all' && <span style={{ fontSize: '11px', color: '#0e3b5e', fontWeight: '800' }}>الكل ✓</span>}
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">{consultants.length}</span>
          </div>
        </div>

        <div
          className="admin-card clickable-card"
          onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
          style={{
            cursor: 'pointer',
            border: statusFilter === 'approved' ? '2px solid #059669' : '1px solid #E2E8F0',
            background: statusFilter === 'approved' ? '#ECFDF5' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">معتمدون</span>
            {statusFilter === 'approved' && <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>محدد ✓</span>}
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">{consultants.filter((c) => c.status === 'معتمد').length}</span>
          </div>
        </div>

        <div
          className="admin-card clickable-card"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          style={{
            cursor: 'pointer',
            border: statusFilter === 'pending' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
            background: statusFilter === 'pending' ? '#FFFBEB' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">بانتظار</span>
            {statusFilter === 'pending' && <span style={{ fontSize: '11px', color: '#D97706', fontWeight: '800' }}>محدد ✓</span>}
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">{consultants.filter((c) => c.status === 'بانتظار').length}</span>
          </div>
        </div>

        <div
          className="admin-card clickable-card"
          onClick={() => setStatusFilter(statusFilter === 'suspended' ? 'all' : 'suspended')}
          style={{
            cursor: 'pointer',
            border: statusFilter === 'suspended' ? '2px solid #EF4444' : '1px solid #E2E8F0',
            background: statusFilter === 'suspended' ? '#FEF2F2' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">موقوف</span>
            {statusFilter === 'suspended' && <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '800' }}>محدد ✓</span>}
          </div>
          <div className="admin-kpi-value-row">
            <span className="admin-kpi-value">
              {consultants.filter((c) => c.status === 'موقوف').length}
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filter Bar, and View Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div className="admin-search-wrapper" style={{ flex: 1, minWidth: '260px' }}>
          <IconSearch size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="بحث بالاسم، البريد، المدينة، التخصص، الترخيص..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ width: '190px' }}>
          <ModernSelect
            options={[
              { value: 'all', label: `كل الحالات (${consultants.length})` },
              { value: 'approved', label: `معتمد (${consultants.filter((c) => c.status === 'معتمد').length})` },
              { value: 'pending', label: `بانتظار (${consultants.filter((c) => c.status === 'بانتظار').length})` },
              {
                value: 'suspended',
                label: `موقوف (${consultants.filter((c) => c.status === 'موقوف').length})`
              }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="كل الحالات"
          />
        </div>

        <FilterResetButton
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}
          size={38}
        />

        {/* View Switcher: Table View vs Cards View (Icon-only) */}
        <div className="consultants-view-switcher">
          <button
            type="button"
            className={`consultants-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="عرض جدول تفصيلي"
            aria-label="عرض جدول تفصيلي"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3z" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
            </svg>
          </button>

          <button
            type="button"
            className={`consultants-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="عرض بطاقات شبكية"
            aria-label="عرض بطاقات شبكية"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          VIEW MODE: TABLE VIEW OR CARDS VIEW
          ══════════════════════════════════════════════════════════════ */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
            المستشارون المعتمدون ({filtered.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            طريقة العرض: {viewMode === 'table' ? 'جدول بيانات تفصيلي' : 'بطاقات شبكية'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
            لا يوجد مستشارون يطابقون خيارات البحث أو التصفية
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="admin-table-container">
            <table className="consultants-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>المستشار والترخيص</th>
                  <th>التخصص ومجال الاستشارة</th>
                  <th>المدينة والاتصال</th>
                  <th>سعر الاستشارة</th>
                  <th>الجلسات</th>
                  <th>حالة الحساب</th>
                  <th style={{ textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const avatarLetters = c.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('');

                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '700', color: '#64748B' }}>{idx + 1}</td>
                      <td>
                        <div className="consultant-avatar-cell">
                          {c.avatar ? (
                            <img
                              src={c.avatar}
                              alt={c.name}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid #CBD5E1',
                                flexShrink: 0
                              }}
                            />
                          ) : (
                            <div className="consultant-avatar">{avatarLetters || 'م'}</div>
                          )}
                          <div>
                            <div className="consultant-name">
                              {c.title ? `${c.title} ` : ''}{c.name}
                            </div>
                            <div className="consultant-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{c.activityType || c.license || 'مستشار ضريبي'}</span>
                              {c.jcpaNumber && (
                                <span style={{ fontSize: '10.5px', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '1px 6px', borderRadius: '4px', color: '#475569' }}>
                                  JCPA: {c.jcpaNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                          {c.specialties.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="admin-category-chip"
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #E2E8F0',
                                fontWeight: '700'
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: '700',
                            color: '#1E293B',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={c.city}
                        >
                          {c.city}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#64748B',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            direction: 'ltr',
                            textAlign: 'right'
                          }}
                          title={c.email}
                        >
                          {c.email}
                        </div>
                        {c.phone && c.phone !== '—' && (
                          <div style={{ fontSize: '10.5px', color: '#94A3B8', direction: 'ltr', textAlign: 'right' }}>
                            {c.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`consultant-rate-badge ${c.rawRate == null ? 'unspecified' : ''}`}>{c.hourlyRate}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: '800',
                            color: '#0e3b5e',
                            background: '#F1F5F9',
                            padding: '3px 9px',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        >
                          {c.sessionsCount ?? 0}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`consultant-status-badge ${
                            c.status === 'معتمد'
                              ? 'approved'
                              : c.status === 'موقوف'
                              ? 'suspended'
                              : 'pending'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="admin-btn-action-outline"
                            style={{ fontSize: '11.5px', padding: '5px 10px' }}
                            onClick={() => setEditModal(c)}
                          >
                            تعديل
                          </button>

                          {c.isActive ? (
                            <button
                              className="admin-btn-action-outline"
                              style={{
                                fontSize: '11.5px',
                                padding: '5px 10px',
                                color: '#D97706',
                                borderColor: '#FCD34D',
                                background: '#FFFBEB'
                              }}
                              onClick={() => handleAction(c.id, 'suspend')}
                              title="إيقاف حساب المستشار"
                            >
                              إيقاف
                            </button>
                          ) : (
                            <button
                              className="admin-btn-action-outline"
                              style={{
                                fontSize: '11.5px',
                                padding: '5px 10px',
                                color: '#059669',
                                borderColor: '#A7F3D0',
                                background: '#ECFDF5'
                              }}
                              onClick={() => handleAction(c.id, 'activate')}
                              title="تفعيل حساب المستشار"
                            >
                              تفعيل
                            </button>
                          )}

                          {c.status === 'بانتظار' && (
                            <button
                              className="admin-btn-action-primary"
                              style={{ fontSize: '11.5px', padding: '5px 10px' }}
                              onClick={() => handleAction(c.id, 'approve')}
                            >
                              اعتماد
                            </button>
                          )}

                          <button
                            type="button"
                            style={{
                              fontSize: '11.5px',
                              padding: '6px 8px',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onClick={() => handleAction(c.id, 'delete')}
                            title="حذف المستشار"
                            aria-label="حذف المستشار"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARDS VIEW */
          <div className="consultants-grid-cards">
            {filtered.map((c) => {
              const avatarLetters = c.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('');

              return (
                <div key={c.id} className="consultant-card-item">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.name}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid #CBD5E1',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div className="consultant-avatar">{avatarLetters || 'م'}</div>
                        )}
                        <div>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>{c.name}</h4>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>{c.license}</div>
                        </div>
                      </div>
                      <span
                        className={`consultant-status-badge ${
                          c.status === 'معتمد'
                            ? 'approved'
                            : c.status === 'موقوف'
                            ? 'suspended'
                            : 'pending'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '12px' }}>
                      <span className={`consultant-rate-badge ${c.rawRate == null ? 'unspecified' : ''}`}>{c.hourlyRate}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                        {c.city} • <strong>{c.sessionsCount ?? 0}</strong>
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '10px', wordBreak: 'break-all' }}>
                      {c.email}
                    </div>

                    {c.specialties.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {c.specialties.map((s, idx) => (
                          <span
                            key={idx}
                            className="admin-category-chip"
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              fontWeight: '700'
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons footer */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      className="admin-btn-action-outline"
                      style={{ fontSize: '11.5px', padding: '6px 12px', flex: 1 }}
                      onClick={() => setEditModal(c)}
                    >
                      تعديل
                    </button>
                    {c.isActive ? (
                      <button
                        className="admin-btn-action-outline"
                        style={{
                          fontSize: '11.5px',
                          padding: '6px 12px',
                          color: '#D97706',
                          borderColor: '#FCD34D',
                          background: '#FFFBEB'
                        }}
                        onClick={() => handleAction(c.id, 'suspend')}
                      >
                        إيقاف
                      </button>
                    ) : (
                      <button
                        className="admin-btn-action-outline"
                        style={{
                          fontSize: '11.5px',
                          padding: '6px 12px',
                          color: '#059669',
                          borderColor: '#A7F3D0',
                          background: '#ECFDF5'
                        }}
                        onClick={() => handleAction(c.id, 'activate')}
                      >
                        تفعيل
                      </button>
                    )}
                    {c.status === 'بانتظار' && (
                      <button
                        className="admin-btn-action-primary"
                        style={{ fontSize: '11.5px', padding: '6px 12px' }}
                        onClick={() => handleAction(c.id, 'approve')}
                      >
                        اعتماد
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        fontSize: '11.5px',
                        padding: '6px 10px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => handleAction(c.id, 'delete')}
                      title="حذف المستشار"
                      aria-label="حذف المستشار"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Consultant Modal */}
      <AddConsultantModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        newConsultant={newConsultant}
        setNewConsultant={setNewConsultant}
        specializations={specializations}
        loadingAdd={loadingAdd}
        onSubmit={handleCreateConsultantSubmit}
      />

      {/* Edit Consultant Modal */}
      <EditConsultantModal
        editModal={editModal}
        setEditModal={setEditModal}
        specializations={specializations}
        savingEdit={savingEdit}
        handleSaveEdit={handleSaveEdit}
      />

      {/* Success Popup Modal */}
      <SuccessPopupModal successModal={successModal} onClose={() => setSuccessModal(null)} />
    </div>
  );
}
