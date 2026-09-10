import React, { useState, useEffect } from 'react';
import { IconSearch } from '../components/AdminIcons';
import { getAdminUsers, createAdminUser, toggleUserActive, updateUserProfile, handleConsultantAction, getAdminSessions } from '../services/adminApi';
import ModernSelect from '../../components/ModernSelect';

export default function AdminConsultantsPage({ navigate }) {
  const [activeTab, setActiveTab] = useState('consultants'); // 'consultants' | 'sessions'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModal, setEditModal] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Sessions state (100% Real from PostgreSQL Database)
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('all');

  // New Consultant Form State
  const [newConsultant, setNewConsultant] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    city: 'عمّان',
    hourlyRate: '45',
    specializationId: '1',
    title: 'مستشار ضريبي معتمد JCPA',
    bio: 'مستشار معتمد متخصص في التشريعات الضريبية والامتثال المالي.'
  });
  const [successModal, setSuccessModal] = useState(null);

  const [consultants, setConsultants] = useState([]);

  // Password validation helper
  const isPasswordValid = (pwd) => {
    if (!pwd || pwd.length < 8) return false;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:',.<>?~`]/.test(pwd);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const loadConsultants = async () => {
    try {
      const users = await getAdminUsers({ role: 'consultant', limit: 100 });
      if (Array.isArray(users)) {
        const mapped = users.map(u => {
          const profStatus = u.verification_status || u.profile?.verification_status;
          const isApproved = profStatus === 'approved';
          const isRejected = profStatus === 'rejected';
          const isSuspended = u.is_active === false;

          let statusLabel = 'بانتظار';
          if (isSuspended) {
            statusLabel = 'موقوف';
          } else if (isApproved) {
            statusLabel = 'معتمد';
          } else if (isRejected) {
            statusLabel = 'مرفوض';
          }

          const rawPrice = u.price_per_hour ?? u.hourly_rate ?? 40;
          return {
            id: u.id,
            name: u.full_name || u.name || 'مستشار بدون اسم',
            status: statusLabel,
            rawStatus: profStatus,
            isActive: u.is_active !== false,
            hourlyRate: `${rawPrice} د.أ/ساعة`,
            rawRate: rawPrice,
            city: u.address || u.city || 'عمّان',
            email: u.email || '—',
            phone: u.phone || '—',
            sessionsCount: Number(u.sessions_count || 0),
            revenue: u.revenue ? `${u.revenue} د.أ` : '0 د.أ',
            license: u.title || 'مستشار ضريبي معتمد',
            specialties: Array.isArray(u.specialties) && u.specialties.length > 0
              ? u.specialties 
              : (u.title ? [u.title] : ['استشارات ضريبية'])
          };
        });
        setConsultants(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch real consultants from backend:', err);
    }
  };

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await getAdminSessions();
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err) {
      console.warn('Could not fetch real sessions from backend:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch real registered consultants, sessions, and specializations from backend API
  useEffect(() => {
    loadConsultants();
    loadSessions();
    fetch('/api/specializations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSpecializations(data);
          setNewConsultant(prev => ({ ...prev, specializationId: data[0].id.toString() }));
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      loadConsultants();
      loadSessions();
    }, 10000);

    const onDataUpdated = () => {
      loadConsultants();
      loadSessions();
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
        const target = consultants.find(c => c.id === id);
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
    } else if (action === 'reject') {
      const reason = window.prompt('يرجى كتابة سبب رفض المستشار:', 'عدم استيفاء متطلبات الاعتماد المهني');
      if (reason === null) return;
      try {
        await handleConsultantAction(id, 'reject', reason);
        alert('تم رفض المستشار بنجاح وتحديث حالته.');
        await loadConsultants();
        window.dispatchEvent(new Event('admin_data_updated'));
      } catch (err) {
        alert(err.message || 'حدث خطأ أثناء رفض المستشار');
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
        main_specialization_id: parseInt(newConsultant.specializationId) || 1,
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
          specializationId: specializations[0]?.id?.toString() || '1',
          title: 'مستشار ضريبي معتمد JCPA',
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

  const filtered = consultants.filter(c => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q || 
      c.name.toLowerCase().includes(q) || 
      c.city.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) || 
      (c.license && c.license.toLowerCase().includes(q)) || 
      (Array.isArray(c.specialties) && c.specialties.some(s => s.toLowerCase().includes(q)));

    const matchStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'approved' && c.status === 'معتمد') || 
      (statusFilter === 'pending' && c.status === 'بانتظار') ||
      (statusFilter === 'suspended' && (c.status === 'موقوف' || c.status === 'مرفوض'));

    return matchSearch && matchStatus;
  });

  const filteredSessions = sessions.filter(s => {
    const q = sessionSearch.trim().toLowerCase();
    const matchSearch = !q || 
      (s.client_name && s.client_name.toLowerCase().includes(q)) || 
      (s.consultant_name && s.consultant_name.toLowerCase().includes(q)) || 
      (s.appointment_id && s.appointment_id.toString().toLowerCase().includes(q));

    const matchStatus = 
      sessionStatusFilter === 'all' || 
      s.status === sessionStatusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div dir="rtl">
      {/* 1. Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="admin-banner-sub-tag">CONSULTANT GOVERNANCE</div>
          <h1 className="admin-banner-title">حوكمة المستشارين</h1>
          <p className="admin-banner-desc">
            إضافة واعتماد وتعديل بيانات وتسعير المستشارين وتفاصيل جلساتهم المحجوزة من قاعدة البيانات مباشرة.
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

      {/* Navigation Tabs: Consultants vs Sessions Details */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('consultants')}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            border: activeTab === 'consultants' ? '2px solid #0284C7' : '1px solid #CBD5E1',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'consultants' ? '#0284C7' : '#FFFFFF',
            color: activeTab === 'consultants' ? '#FFFFFF' : '#334155',
            boxShadow: activeTab === 'consultants' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span>المستشارون المعتمدون</span>
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: '999px', 
            fontSize: '12px',
            background: activeTab === 'consultants' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
            color: activeTab === 'consultants' ? '#FFFFFF' : '#0F172A',
            fontWeight: '800'
          }}>
            {consultants.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            border: activeTab === 'sessions' ? '2px solid #0284C7' : '1px solid #CBD5E1',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'sessions' ? '#0284C7' : '#FFFFFF',
            color: activeTab === 'sessions' ? '#FFFFFF' : '#334155',
            boxShadow: activeTab === 'sessions' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span>سجل وتفاصيل الجلسات</span>
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: '999px', 
            fontSize: '12px',
            background: activeTab === 'sessions' ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
            color: activeTab === 'sessions' ? '#FFFFFF' : '#0F172A',
            fontWeight: '800'
          }}>
            {sessions.length || consultants.reduce((sum, c) => sum + (c.sessionsCount || 0), 0)}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: CONSULTANTS GOVERNANCE (DEFAULT)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'consultants' && (
        <>
          {/* Top 4 Metric KPI Cards - Clickable Interactive Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
            <div 
              className="admin-card clickable-card" 
              onClick={() => setStatusFilter('all')}
              style={{ 
                cursor: 'pointer', 
                border: statusFilter === 'all' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                background: statusFilter === 'all' ? '#F0F9FF' : '#FFFFFF',
                transition: 'all 0.15s ease'
              }}
            >
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">إجمالي المستشارين</span>
                {statusFilter === 'all' && <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: '800' }}>الكل ✓</span>}
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
                <span className="admin-kpi-value">{consultants.filter(c => c.status === 'معتمد').length}</span>
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
                <span className="admin-kpi-value">{consultants.filter(c => c.status === 'بانتظار').length}</span>
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
                <span className="admin-kpi-title">مرفوض/موقوف</span>
                {statusFilter === 'suspended' && <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '800' }}>محدد ✓</span>}
              </div>
              <div className="admin-kpi-value-row">
                <span className="admin-kpi-value">{consultants.filter(c => c.status === 'موقوف' || c.status === 'مرفوض').length}</span>
              </div>
            </div>
          </div>

          {/* Quick link banner to sessions details */}
          <div 
            onClick={() => setActiveTab('sessions')}
            style={{
              cursor: 'pointer',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 18px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#0369A1' }}>
              <span style={{ fontSize: '16px' }}>📅</span>
              <span>إجمالي الجلسات المحجوزة للمستشارين في قاعدة البيانات: <strong>{sessions.length || consultants.reduce((sum, c) => sum + (c.sessionsCount || 0), 0)} جلسة</strong></span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284C7', display: 'flex', alignItems: 'center', gap: '4px' }}>
              عرض تفاصيل وسجل الجلسات كاملة ←
            </span>
          </div>

          {/* Search & Filter Bar for Consultants */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div className="admin-search-wrapper" style={{ flex: 1 }}>
              <IconSearch size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="بحث بالاسم، البريد، المدينة، التخصص، رقم الترخيص..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ width: '200px' }}>
              <ModernSelect
                options={[
                  { value: 'all', label: `كل الحالات (${consultants.length})` },
                  { value: 'approved', label: `معتمد (${consultants.filter(c => c.status === 'معتمد').length})` },
                  { value: 'pending', label: `بانتظار (${consultants.filter(c => c.status === 'بانتظار').length})` },
                  { value: 'suspended', label: `مرفوض/موقوف (${consultants.filter(c => c.status === 'موقوف' || c.status === 'مرفوض').length})` }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="كل الحالات"
              />
            </div>
          </div>

      {/* 4. Consultant Cards List */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
            المستشارون ({filtered.length})
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(c => (
            <div 
              key={c.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '16px', 
                border: '1px solid #E2E8F0', 
                borderRadius: '12px',
                background: '#FFFFFF'
              }}
            >
              {/* Consultant Info (Right Side in RTL) */}
              <div style={{ textAlign: 'right', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                    {c.name}
                  </h4>

                  <span 
                    style={{ 
                      fontSize: '11px', 
                      padding: '2px 10px', 
                      borderRadius: '12px',
                      background: c.status === 'معتمد' ? '#ECFDF5' : (c.status === 'موقوف' || c.status === 'مرفوض' ? '#FEF2F2' : '#FFFBEB'),
                      color: c.status === 'معتمد' ? '#059669' : (c.status === 'موقوف' || c.status === 'مرفوض' ? '#DC2626' : '#D97706'),
                      border: c.status === 'معتمد' ? '1px solid #A7F3D0' : (c.status === 'موقوف' || c.status === 'مرفوض' ? '1px solid #FECACA' : '1px solid #FDE68A'),
                      fontWeight: '700'
                    }}
                  >
                    {c.status}
                  </span>

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
                </div>

                <div style={{ fontSize: '11.5px', color: '#64748B', marginBottom: c.specialties.length > 0 ? '8px' : '0' }}>
                  {c.email && <span>{c.email} • </span>}
                  {c.city} • {c.sessionsCount} جلسة • {c.license}
                </div>

                {c.specialties.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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

              {/* Action Buttons (Left Side in RTL) */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className="admin-btn-action-outline" 
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                  onClick={() => setEditModal(c)}
                >
                  تعديل
                </button>
                {c.isActive ? (
                  <button 
                    className="admin-btn-action-outline" 
                    style={{ fontSize: '12px', padding: '6px 14px', color: '#DC2626', borderColor: '#FCA5A5' }}
                    onClick={() => handleAction(c.id, 'suspend')}
                  >
                    إيقاف
                  </button>
                ) : (
                  <button 
                    className="admin-btn-action-outline" 
                    style={{ fontSize: '12px', padding: '6px 14px', color: '#059669', borderColor: '#A7F3D0' }}
                    onClick={() => handleAction(c.id, 'activate')}
                  >
                    تفعيل
                  </button>
                )}
                {c.status === 'بانتظار' && (
                  <button 
                    className="admin-btn-action-primary" 
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => handleAction(c.id, 'approve')}
                  >
                    اعتماد
                  </button>
                )}
                {c.status !== 'مرفوض' && (
                  <button 
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 14px', 
                      background: '#EF4444', 
                      color: '#FFFFFF', 
                      border: 'none', 
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                    onClick={() => handleAction(c.id, 'reject')}
                  >
                    رفض
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: SESSIONS DETAILS (100% REAL FROM DATABASE)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sessions' && (
        <div>
          {/* Sessions KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
            <div 
              className="admin-card clickable-card" 
              onClick={() => setSessionStatusFilter('all')}
              style={{ 
                cursor: 'pointer', 
                border: sessionStatusFilter === 'all' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                background: sessionStatusFilter === 'all' ? '#F0F9FF' : '#FFFFFF',
                transition: 'all 0.15s ease'
              }}
            >
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">إجمالي الجلسات</span>
                {sessionStatusFilter === 'all' && <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: '800' }}>الكل ✓</span>}
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
                {sessionStatusFilter === 'completed' && <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800' }}>محدد ✓</span>}
              </div>
              <div className="admin-kpi-value-row">
                <span className="admin-kpi-value">{sessions.filter(s => s.status === 'completed').length}</span>
              </div>
            </div>

            <div 
              className="admin-card clickable-card" 
              onClick={() => setSessionStatusFilter(sessionStatusFilter === 'confirmed' ? 'all' : 'confirmed')}
              style={{ 
                cursor: 'pointer', 
                border: sessionStatusFilter === 'confirmed' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                background: sessionStatusFilter === 'confirmed' ? '#F0F9FF' : '#FFFFFF',
                transition: 'all 0.15s ease'
              }}
            >
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">مؤكدة / جارية</span>
                {sessionStatusFilter === 'confirmed' && <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: '800' }}>محدد ✓</span>}
              </div>
              <div className="admin-kpi-value-row">
                <span className="admin-kpi-value">{sessions.filter(s => s.status === 'confirmed' || s.status === 'in_progress').length}</span>
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
                {sessionStatusFilter === 'pending' && <span style={{ fontSize: '11px', color: '#D97706', fontWeight: '800' }}>محدد ✓</span>}
              </div>
              <div className="admin-kpi-value-row">
                <span className="admin-kpi-value">{sessions.filter(s => s.status === 'pending' || s.status === 'cancelled').length}</span>
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
                onChange={e => setSessionSearch(e.target.value)}
              />
            </div>

            <div style={{ width: '200px' }}>
              <ModernSelect
                options={[
                  { value: 'all', label: `كل الحالات (${sessions.length})` },
                  { value: 'completed', label: `مكتملة (${sessions.filter(s => s.status === 'completed').length})` },
                  { value: 'confirmed', label: `مؤكدة (${sessions.filter(s => s.status === 'confirmed').length})` },
                  { value: 'pending', label: `معلقة (${sessions.filter(s => s.status === 'pending').length})` },
                  { value: 'cancelled', label: `ملغاة (${sessions.filter(s => s.status === 'cancelled').length})` }
                ]}
                value={sessionStatusFilter}
                onChange={setSessionStatusFilter}
                placeholder="كل الحالات"
              />
            </div>
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
                      if (s.status === 'completed') statusBadge = { text: 'مكتملة', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
                      else if (s.status === 'pending') statusBadge = { text: 'معلقة', bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
                      else if (s.status === 'cancelled') statusBadge = { text: 'ملغاة', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
                      else if (s.status === 'in_progress') statusBadge = { text: 'جارية الآن', bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD' };

                      const rawId = s.appointment_id ? `SES-${String(s.appointment_id).substring(0, 8).toUpperCase()}` : `SES-${1000 + idx}`;
                      const formattedDate = s.scheduled_at ? new Date(s.scheduled_at).toLocaleString('ar-JO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

                      return (
                        <tr key={s.appointment_id || idx}>
                          <td style={{ fontWeight: '700', color: '#64748B' }}>{idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0F172A', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>
                              {rawId}
                            </span>
                          </td>
                          <td style={{ fontWeight: '700', color: '#0F172A' }}>
                            {s.client_name || 'عميل المنصة'}
                          </td>
                          <td style={{ fontWeight: '700', color: '#0369A1' }}>
                            {s.consultant_name || 'مستشار المنصة'}
                          </td>
                          <td style={{ color: '#475569' }}>
                            {formattedDate}
                          </td>
                          <td style={{ color: '#475569' }}>
                            {s.duration_minutes ? `${s.duration_minutes} دقيقة` : '45 دقيقة'}
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: statusBadge.bg,
                              color: statusBadge.color,
                              border: `1px solid ${statusBadge.border}`
                            }}>
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
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ADD CONSULTANT MODAL (DIRECT DB REGISTRATION)
          ══════════════════════════════════════════════════════════════════ */}
      {addModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '19px', fontWeight: '900', color: '#0e3b5e' }}>
              + إضافة وتعيين مستشار معتمد جديد
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 20px 0' }}>
              سيتم إنشاء الحساب واعتماده مباشرة في قاعدة البيانات، وتفعيل بروفايل المستشار وتسعيرته ليتمكن من الدخول فوراً.
            </p>

            <form onSubmit={handleCreateConsultantSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>الاسم الكامل للمستشار *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: د. إبراهيم المجالي"
                    value={newConsultant.fullName}
                    onChange={e => setNewConsultant({ ...newConsultant, fullName: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>البريد الإلكتروني (لتسجيل الدخول) *</label>
                  <input
                    type="email"
                    required
                    placeholder="consultant@example.com"
                    value={newConsultant.email}
                    onChange={e => setNewConsultant({ ...newConsultant, email: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>كلمة المرور الابتدائية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Test@123456"
                    value={newConsultant.password}
                    onChange={e => setNewConsultant({ ...newConsultant, password: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
                  />
                  <small style={{ fontSize: '10.5px', color: isPasswordValid(newConsultant.password) ? '#10B981' : '#64748B' }}>
                    {isPasswordValid(newConsultant.password) ? '✓ كلمة مرور قوية ومقبولة' : '8 أحرف + حرف كبير + صغير + رقم + رمز'}
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>رقم الهاتف / الموبايل</label>
                  <input
                    type="text"
                    placeholder="+962 7 9000 0000"
                    value={newConsultant.phone}
                    onChange={e => setNewConsultant({ ...newConsultant, phone: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>المدينة / المحافظة</label>
                  <input
                    type="text"
                    value={newConsultant.city}
                    onChange={e => setNewConsultant({ ...newConsultant, city: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>سعر الاستشارة بالساعة (د.أ)</label>
                  <input
                    type="number"
                    value={newConsultant.hourlyRate}
                    onChange={e => setNewConsultant({ ...newConsultant, hourlyRate: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>التخصص الرئيسي المعتمد</label>
                  <select
                    value={newConsultant.specializationId}
                    onChange={e => setNewConsultant({ ...newConsultant, specializationId: e.target.value })}
                    className="admin-select-input"
                    style={{ width: '100%' }}
                  >
                    {specializations.length > 0 ? specializations.map(spec => (
                      <option key={spec.id} value={spec.id}>{spec.name}</option>
                    )) : (
                      <option value="1">استشارات ضريبة الدخل والمبيعات</option>
                    )}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>اللقب المهني ورقم ترخيص JCPA</label>
                  <input
                    type="text"
                    value={newConsultant.title}
                    onChange={e => setNewConsultant({ ...newConsultant, title: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>النبذة التعريفية والخبرات</label>
                  <textarea
                    rows="2"
                    value={newConsultant.bio}
                    onChange={e => setNewConsultant({ ...newConsultant, bio: e.target.value })}
                    className="admin-search-input"
                    style={{ width: '100%', height: 'auto', padding: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="submit"
                  disabled={loadingAdd}
                  className="admin-btn-action-primary"
                  style={{ padding: '10px 24px', fontWeight: '800', cursor: 'pointer' }}
                >
                  {loadingAdd ? 'جاري الحفظ في الداتابيز...' : 'حفظ واعتماد المستشار فوراً'}
                </button>
                <button 
                  type="button" 
                  className="admin-btn-action-outline" 
                  onClick={() => setAddModalOpen(false)}
                  style={{ padding: '10px 18px', fontWeight: '800', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                disabled={savingEdit}
                onClick={handleSaveEdit}
              >
                {savingEdit ? 'جاري الحفظ في الداتابيز...' : 'حفظ التعديلات في قاعدة البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Luxury Success Popup Modal */}
      {successModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px 28px',
            width: '90%',
            maxWidth: '460px',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
            textAlign: 'center',
            direction: 'rtl'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ECFDF5',
              border: '2px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#059669'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', marginBottom: '8px' }}>
              {successModal.title || 'تمت العملية بنجاح!'}
            </h3>
            
            <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.6', marginBottom: '20px' }}>
              تم تسجيل وتفعيل حساب <strong style={{ color: '#0F172A' }}>[{successModal.name}]</strong> في قاعدة البيانات مباشرة.
            </p>

            {successModal.email && (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '24px',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', marginBottom: '4px' }}>البريد الإلكتروني لتسجيل الدخول:</div>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#005D9C', direction: 'ltr', textAlign: 'left', wordBreak: 'break-all' }}>
                  {successModal.email}
                </div>
              </div>
            )}

            <button
              onClick={() => setSuccessModal(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #E58A13 0%, #D47700 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(229, 138, 19, 0.3)'
              }}
            >
              تم، موافق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
