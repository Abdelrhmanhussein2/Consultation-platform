import React, { useState, useEffect } from 'react';
import { getPendingConsultants, handleConsultantAction, getPendingExpansions, reviewExpansionRequest } from '../services/adminApi';
import FilterResetButton from '../../components/FilterResetButton';

export default function AdminConsultantApplicationsPage({ navigate }) {
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'specializations'
  const [applications, setApplications] = useState([]);
  const [specializationRequests, setSpecializationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Modals state
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null); // { type: 'consultant' | 'specialization', data: ... }
  const [rejectionReason, setRejectionReason] = useState('يرجى استكمال وإرفاق الوثائق والمؤهلات المهنية المعتمدة لإعادة التقييم.');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [appsData, specsData] = await Promise.all([
        getPendingConsultants().catch(() => []),
        getPendingExpansions().catch(() => [])
      ]);
      setApplications(Array.isArray(appsData) ? appsData : []);
      setSpecializationRequests(Array.isArray(specsData) ? specsData : []);
    } catch (err) {
      console.warn('Error loading pending consultant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const handleSync = () => loadAllData();
    window.addEventListener('admin_data_updated', handleSync);

    // Auto-refresh polling every 10 seconds for real-time live registration & specialization detection
    const pollInterval = setInterval(() => {
      loadAllData();
    }, 10000);

    return () => {
      window.removeEventListener('admin_data_updated', handleSync);
      clearInterval(pollInterval);
    };
  }, []);

  const handleApproveConsultant = async (app) => {
    const userId = app.user_id || app.user?.id || app.id;
    if (!userId) return;

    setActionLoadingId(userId);
    try {
      await handleConsultantAction(userId, 'approve');
      showToast(`تم اعتماد وتفعيل حساب المستشار (${app.user?.full_name || app.full_name || 'الجديد'}) بنجاح.`);
      loadAllData();
    } catch (err) {
      alert(`حدث خطأ أثناء الاعتماد: ${err.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveSpecialization = async (req) => {
    setActionLoadingId(req.id);
    try {
      await reviewExpansionRequest(req.id, { action: 'approve' });
      showToast(`تم اعتماد التخصص (${req.specialization_name || req.service_name}) للمستشار بنجاح.`);
      loadAllData();
    } catch (err) {
      alert(`حدث خطأ أثناء اعتماد التخصص: ${err.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;

    const { type, data } = rejectingItem;
    setActionLoadingId(type === 'consultant' ? (data.user_id || data.user?.id || data.id) : data.id);

    try {
      if (type === 'consultant') {
        const userId = data.user_id || data.user?.id || data.id;
        await handleConsultantAction(userId, 'reject', rejectionReason);
        showToast(`تم رفض طلب الانضمام وإرسال الملاحظات للمستشار بنجاح.`);
      } else {
        await reviewExpansionRequest(data.id, { action: 'reject', rejection_reason: rejectionReason });
        showToast(`تم رفض طلب التخصص وإرسال السبب للمستشار بنجاح.`);
      }
      setRejectingItem(null);
      loadAllData();
    } catch (err) {
      alert(`حدث خطأ أثناء الرفض: ${err.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Search filter
  const filteredApplications = applications.filter((app) => {
    const name = app.user?.full_name || app.full_name || '';
    const email = app.user?.email || app.email || '';
    const phone = app.user?.phone || app.phone || '';
    const spec = app.specialization?.name || app.activity_type || '';
    const term = searchTerm.toLowerCase();

    return (
      name.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      phone.toLowerCase().includes(term) ||
      spec.toLowerCase().includes(term)
    );
  });

  const filteredSpecializationRequests = specializationRequests.filter((req) => {
    const name = req.consultant_name || '';
    const email = req.consultant_email || '';
    const serviceName = req.service_name || '';
    const specName = req.specialization_name || '';
    const desc = req.service_description || '';
    const term = searchTerm.toLowerCase();

    return (
      name.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      serviceName.toLowerCase().includes(term) ||
      specName.toLowerCase().includes(term) ||
      desc.toLowerCase().includes(term)
    );
  });


  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif" }}>
      {/* ══════════════════════════════════════════════════════════════════
          HERO HEADER
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#0A3C64', letterSpacing: '-0.3px' }}>
              طلبات ومراجعات المستشارين
            </h1>
            <span style={{
              background: '#EBF3FA',
              color: '#0A3C64',
              border: '1px solid #BFDBFE',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '800'
            }}>
              {applications.length + specializationRequests.length} إجمالي الطلبات المعلقة
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748B' }}>
            مراجعة واعتماد طلبات تسجيل المستشارين الجدد، وطلبات تغيير أو إضافة التخصصات المهنية والوثائق الداعمة.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            title="تحديث البيانات مباشرة"
            onClick={() => { loadAllData(); showToast('تم تحديث قائمة الطلبات والتخصصات مباشرة من قاعدة البيانات.'); }}
            style={{
              background: '#FFFFFF',
              color: '#0A3C64',
              border: '1px solid #CBD5E1',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0A3C64'; e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FFFFFF'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          NAVIGATION TABS
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          style={{
            background: activeTab === 'applications' ? '#0A3C64' : '#F1F5F9',
            color: activeTab === 'applications' ? '#FFFFFF' : '#475569',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <span>طلبات انضمام المستشارين الجدد</span>
          <span style={{
            background: activeTab === 'applications' ? 'rgba(255,255,255,0.22)' : '#CBD5E1',
            color: activeTab === 'applications' ? '#FFFFFF' : '#0F172A',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '900'
          }}>
            {applications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('specializations')}
          style={{
            background: activeTab === 'specializations' ? '#0A3C64' : '#F1F5F9',
            color: activeTab === 'specializations' ? '#FFFFFF' : '#475569',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <span>طلبات إضافة وتعديل التخصصات</span>
          <span style={{
            background: activeTab === 'specializations' ? 'rgba(255,255,255,0.22)' : '#CBD5E1',
            color: activeTab === 'specializations' ? '#FFFFFF' : '#0F172A',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '900'
          }}>
            {specializationRequests.length}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SEARCH & FILTER TOOLBAR
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '12px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 14px', borderRadius: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={activeTab === 'applications' ? "ابحث باسم المستشار، التخصص، البريد أو الهاتف..." : "ابحث باسم المستشار، التخصص المطلوب، البريد أو تفاصيل الطلب..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '13.5px',
              color: '#0F172A',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {searchTerm && (
          <FilterResetButton onClick={() => setSearchTerm('')} size={36} />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: NEW CONSULTANT APPLICATIONS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'applications' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0A3C64', marginBottom: '8px' }}>
              جاري استرجاع طلبات انضمام المستشارين من قاعدة البيانات...
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>يرجى الانتظار لحظات</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#F0FDF4',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0A3C64', margin: '0 0 6px 0' }}>
              {searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد طلبات انضمام معلقة حالياً'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0 }}>
              {searchTerm ? 'جرب البحث بكلمة أخرى أو إعادة ضبط الفلتر.' : 'تمت مراجعة واعتماد جميع طلبات تسجيل المستشارين في المنصة.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '22px' }}>
            {filteredApplications.map((app) => {
              const user = app.user || {};
              const displayName = user.full_name || app.full_name || user.email || 'مستشار جديد';
              const initial = displayName.charAt(0).toUpperCase();
              const specName = app.specialization?.name || app.activity_type || user.title || 'استشارات ضريبية ومالية';
              const expYears = app.years_of_experience ?? 5;
              const hourlyRate = app.price_per_hour ?? 45;
              const regDate = app.created_at || user.created_at;

              return (
                <div
                  key={app.id || app.user_id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '22px',
                    boxShadow: '0 4px 14px rgba(11,46,75,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    {/* Top Profile Strip */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: '#EBF3FA',
                          color: '#0A3C64',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: '900',
                          flexShrink: 0
                        }}>
                          {initial}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0A3C64' }}>
                            {displayName}
                          </h4>
                          <span style={{ fontSize: '12.5px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                            {user.email || '—'}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        background: '#F1F5F9',
                        color: '#0A3C64',
                        border: '1px solid #CBD5E1',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        whiteSpace: 'nowrap'
                      }}>
                        قيد المراجعة
                      </span>

                    </div>

                    {/* Summary Details Grid */}
                    <div style={{
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      fontSize: '12.5px'
                    }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11.5px' }}>التخصص الرئيسي:</span>
                        <b style={{ color: '#0A3C64' }}>{specName}</b>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11.5px' }}>سنوات الخبرة:</span>
                        <b style={{ color: '#0A3C64' }}>{expYears} سنوات</b>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11.5px' }}>رقم الهاتف:</span>
                        <b style={{ color: '#0A3C64', direction: 'ltr', display: 'inline-block' }}>{user.phone || '—'}</b>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '11.5px' }}>سعر الاستشارة:</span>
                        <b style={{ color: '#0A3C64' }}>{hourlyRate} د.أ / ساعة</b>
                      </div>
                    </div>

                    {/* Bio Preview */}
                    {app.bio && (
                      <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.5', marginBottom: '14px', background: '#FFFFFF', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '10px 12px' }}>
                        <span style={{ fontWeight: '800', color: '#0A3C64', display: 'block', marginBottom: '2px', fontSize: '11.5px' }}>النبذة والمؤهلات:</span>
                        {app.bio.length > 130 ? `${app.bio.slice(0, 130)}...` : app.bio}
                      </div>
                    )}

                    {/* Certificates / Licenses Preview */}
                    {app.certificates_licenses && (
                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                        <strong style={{ color: '#0A3C64' }}>الشهادات والتراخيص:</strong> {app.certificates_licenses}
                      </div>
                    )}

                    {/* Registration Date */}
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>
                      تاريخ التقديم: <b style={{ color: '#64748B' }}>{regDate ? new Date(regDate).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'مؤخراً'}</b>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '14px', marginTop: '6px' }}>
                    <button
                      type="button"
                      disabled={actionLoadingId === (app.user_id || user.id || app.id)}
                      onClick={() => handleApproveConsultant(app)}
                      style={{
                        background: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(22,163,74,0.18)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      اعتماد وتفعيل
                    </button>

                    <button
                      type="button"
                      disabled={actionLoadingId === (app.user_id || user.id || app.id)}
                      onClick={() => setRejectingItem({ type: 'consultant', data: app })}
                      style={{
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      رفض الطلب
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: SPECIALIZATION CHANGE & ADDITION REQUESTS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'specializations' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0A3C64', marginBottom: '8px' }}>
              جاري استرجاع طلبات التخصصات من قاعدة البيانات...
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>يرجى الانتظار لحظات</p>
          </div>
        ) : filteredSpecializationRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#F0FDF4',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0A3C64', margin: '0 0 6px 0' }}>
              {searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد طلبات تخصصات معلقة حالياً'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0 }}>
              {searchTerm ? 'جرب البحث بكلمة أخرى أو إعادة ضبط الفلتر.' : 'تمت مراجعة واعتماد كافة طلبات إضافة وتعديل التخصصات للمستشارين.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '22px' }}>
            {filteredSpecializationRequests.map((req) => {
              const isChange = (req.service_name || '').includes('تغيير') || (req.service_name || '').includes('تعديل');
              const specDisplay = req.specialization_name || req.service_name;
              const consultantName = req.consultant_name || 'مستشار معتمد';
              const initial = consultantName.charAt(0).toUpperCase();
              const reqDate = req.created_at;

              return (
                <div
                  key={req.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '22px',
                    boxShadow: '0 4px 14px rgba(11,46,75,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    {/* Top Strip */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: isChange ? '#EFF6FF' : '#F0FDF4',
                          color: isChange ? '#2563EB' : '#16A34A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: '900',
                          flexShrink: 0
                        }}>
                          {initial}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0A3C64' }}>
                            {consultantName}
                          </h4>
                          <span style={{ fontSize: '12.5px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                            {req.consultant_email || '—'}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        background: isChange ? '#EFF6FF' : '#ECFDF5',
                        color: isChange ? '#1D4ED8' : '#047857',
                        border: isChange ? '1px solid #BFDBFE' : '1px solid #A7F3D0',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        whiteSpace: 'nowrap'
                      }}>
                        {isChange ? 'طلب تغيير تخصص رئيسي' : 'طلب إضافة تخصص جديد'}
                      </span>
                    </div>

                    {/* Specialization Details Card */}
                    <div style={{
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '14px',
                      border: '1px solid #EEF2F6'
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#64748B', fontSize: '12px', display: 'block', marginBottom: '2px' }}>التخصص المطلوب اعتماده:</span>
                        <b style={{ color: '#0A3C64', fontSize: '15px' }}>{specDisplay}</b>
                      </div>

                      {req.service_description && (
                        <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#334155', lineHeight: '1.5' }}>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '2px' }}>مبررات / خبرة المستشار بالتخصص:</span>
                          <p style={{ margin: 0, background: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            {req.service_description}
                          </p>
                        </div>
                      )}

                      {/* Proof Document URL */}
                      {req.proof_document_url && (
                        <div style={{ marginTop: '12px' }}>
                          <a
                            href={req.proof_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              color: '#0A3C64',
                              fontSize: '12px',
                              fontWeight: '800',
                              textDecoration: 'none'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                            معاينة الوثيقة / الشهادة الداعمة
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>
                      تاريخ تقديم الطلب: <b style={{ color: '#64748B' }}>{reqDate ? new Date(reqDate).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'مؤخراً'}</b>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '14px', marginTop: '6px' }}>
                    <button
                      type="button"
                      disabled={actionLoadingId === req.id}
                      onClick={() => handleApproveSpecialization(req)}
                      style={{
                        background: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(22,163,74,0.18)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      اعتماد التخصص
                    </button>

                    <button
                      type="button"
                      disabled={actionLoadingId === req.id}
                      onClick={() => setRejectingItem({ type: 'specialization', data: req })}
                      style={{
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      رفض الطلب
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════════════════
          REJECTION MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {rejectingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#DC2626' }}>
              {rejectingItem.type === 'consultant' ? 'رفض طلب انضمام المستشار' : 'رفض طلب اعتماد التخصص'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
              {rejectingItem.type === 'consultant' 
                ? `سيتم إشعار المستشار (${rejectingItem.data.user?.full_name || rejectingItem.data.full_name || 'المتقدم'}) بسبب الرفض ليتمكن من تصحيح البيانات.`
                : `سيتم إشعار المستشار (${rejectingItem.data.consultant_name || 'المتقدم'}) بسبب رفض اعتماد التخصص (${rejectingItem.data.specialization_name || rejectingItem.data.service_name}).`
              }
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                  سبب الرفض والملاحظات الإدارية *
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  placeholder="أدخل سبب الرفض بوضوح ليظهر للمستشار في حسابه..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  تأكيد الرفض والإشعار
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TOAST NOTIFICATION
          ══════════════════════════════════════════════════════════════════ */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0A3C64',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '10px',
          fontSize: '13.5px',
          fontWeight: '700',
          boxShadow: '0 8px 24px rgba(10,60,100,0.25)',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}

