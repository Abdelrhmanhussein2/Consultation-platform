import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';
import { parseServiceMeta, cleanServiceDescription, getServiceCleanDescription } from '../utils/serviceUtils';

// Helper to determine service type based on name or description or metadata
const getServiceTypeInfo = (service) => {
  const { meta } = parseServiceMeta(service);
  const type = meta?.type || service.service_type || '';
  const name = (service.name || '').toLowerCase();
  const desc = (service.description || '').toLowerCase();

  if (type === 'report' || name.includes('تقرير') || desc.includes('تقرير') || desc.includes('مكتوب')) {
    return {
      type: 'report',
      label: 'تقرير مكتوب',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    };
  }

  if (type === 'chat' || name.includes('محادثة') || name.includes('اعتراض') || desc.includes('محادثة') || desc.includes('شات') || desc.includes('اعتراض')) {
    return {
      type: 'chat',
      label: 'جلسة محادثة',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    };
  }

  // Default: Video session
  return {
    type: 'video',
    label: 'جلسة فيديو',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2.5" ry="2.5" />
      </svg>
    )
  };
};

// Parse pricing pills / tiers
const getPricingTiers = (service) => {
  const { meta } = parseServiceMeta(service);
  if (meta && Array.isArray(meta.tiers) && meta.tiers.length > 0) {
    return meta.tiers.map((t) => ({
      duration: t.duration,
      price: t.price,
      text: t.duration > 0 ? `${t.duration} دقيقة – ${t.price} د.أ` : `${t.price} د.أ`
    }));
  }

  if (service.tiers && Array.isArray(service.tiers) && service.tiers.length > 0) {
    return service.tiers;
  }

  const name = (service.name || '').toLowerCase();
  const desc = (service.description || '').toLowerCase();
  const dur = Number(service.duration_minutes) || 60;
  const pr = Number(service.price) || 80;

  if (dur === 0 || name.includes('تقرير') || desc.includes('تقرير')) {
    return [{ duration: 0, price: pr, text: `${pr} د.أ` }];
  }

  return [{ duration: dur, price: pr, text: `${dur} دقيقة – ${pr} د.أ` }];
};

// Initial default services
const DEFAULT_DEMO_SERVICES = [
  {
    id: 'demo-1',
    name: 'استشارة ضريبية شاملة',
    service_type: 'video',
    description: 'مراجعة كاملة للوضع الضريبي وتحديد الإلتزامات والمخاطر',
    price: 80,
    duration_minutes: 60,
    is_active: true,
    tiers: [
      { duration: 30, price: 45, text: '30 دقيقة • 45 د.أ' },
      { duration: 60, price: 80, text: '60 دقيقة • 80 د.أ' },
      { duration: 90, price: 120, text: '90 دقيقة • 120 د.أ' }
    ]
  },
  {
    id: 'demo-2',
    name: 'مراجعة الاعتراض الضريبي',
    service_type: 'chat',
    description: 'تحليل قرار ربط الضريبة وإعداد مذكرة اعتراض',
    price: 80,
    duration_minutes: 60,
    is_active: true,
    tiers: [
      { duration: 60, price: 80, text: '60 دقيقة • 80 د.أ' }
    ]
  },
  {
    id: 'demo-3',
    name: 'تقرير تحليل المخاطر الضريبية',
    service_type: 'report',
    description: 'تقرير مكتوب مفصل لتحليل المخاطر الضريبية للشركات',
    price: 200,
    duration_minutes: 0,
    is_active: true,
    tiers: [
      { duration: 0, price: 200, text: '200 د.أ' }
    ]
  },
  {
    id: 'demo-4',
    name: 'مراجعة الاعتراض الضريبي',
    service_type: 'chat',
    description: 'تحليل قرار ربط الضريبة وإعداد مذكرة اعتراض',
    price: 80,
    duration_minutes: 60,
    is_active: false,
    tiers: [
      { duration: 60, price: 80, text: '60 دقيقة • 80 د.أ' }
    ]
  }
];

export default function ConsultantServicesPage({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [expansions, setExpansions] = useState([]);

  // View state: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [viewingService, setViewingService] = useState(null);
  const [deleteModalService, setDeleteModalService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'video', // 'video', 'chat', 'report'
    description: '',
    tiers: [
      { duration: '', price: '' }
    ],
    single_price: ''
  });

  // Load Initial Page Data from Backend API / Database
  const loadPageData = async (silent = false) => {
    if (!token) {
      setServices(DEFAULT_DEMO_SERVICES);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const [servicesData, profileData, specsData, expansionsData] = await Promise.all([
        consultantService.getMyServices(token).catch((err) => {
          console.warn('Could not fetch consultant services from backend:', err);
          return [];
        }),
        consultantService.getMyProfile(token).catch(() => null),
        consultantService.getSpecializations(token).catch(() => []),
        consultantService.getMyExpansions(token).catch(() => [])
      ]);

      if (servicesData && Array.isArray(servicesData) && servicesData.length > 0) {
        setServices(servicesData);
      } else {
        setServices(DEFAULT_DEMO_SERVICES);
      }
      setProfile(profileData);
      setSpecializations(specsData || []);
      setExpansions(expansionsData || []);
    } catch (err) {
      console.error('Error fetching consultant services page data:', err);
      setServices(DEFAULT_DEMO_SERVICES);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [token]);

  // Open Add Service Modal
  const handleOpenAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      service_type: 'video',
      description: '',
      tiers: [
        { duration: '', price: '' }
      ],
      single_price: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Service Modal with actual database values
  const handleOpenEditModal = (service) => {
    const { meta, cleanDesc } = parseServiceMeta(service);
    const typeInfo = getServiceTypeInfo(service);
    const existingTiers = getPricingTiers(service);
    setEditingService(service);

    const dur = Number(service.duration_minutes) || 60;
    const pr = Number(service.price) || 80;

    let initialTiers = [];
    if (meta && Array.isArray(meta.tiers) && meta.tiers.length > 0) {
      initialTiers = meta.tiers;
    } else if (existingTiers && existingTiers.length > 0) {
      initialTiers = existingTiers
        .filter((t) => t.duration > 0)
        .map((t) => ({ duration: t.duration, price: t.price }));
    } else if (dur > 0) {
      initialTiers = [{ duration: dur, price: pr }];
    } else {
      initialTiers = [{ duration: 60, price: pr }];
    }

    setFormData({
      name: service.name || '',
      service_type: meta?.type || service.service_type || typeInfo.type,
      description: cleanDesc,
      tiers: initialTiers.length > 0 ? initialTiers : [{ duration: 60, price: 80 }],
      single_price: pr || 200
    });
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setIsSubmitting(false);
  };

  // Tier helpers
  const handleAddTier = () => {
    setFormData((prev) => ({
      ...prev,
      tiers: [...prev.tiers, { duration: '', price: '' }]
    }));
  };

  const handleRemoveTier = (idx) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateTier = (idx, field, val) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t, i) => (i === idx ? { ...t, [field]: val === '' ? '' : (Number(val) || val) } : t))
    }));
  };

  // Submit Add or Edit Form with Full Backend & Database Persistence
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('يرجى إدخال عنوان الخدمة', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const isReport = formData.service_type === 'report';
      const primaryPrice = isReport
        ? (Number(formData.single_price) || 200)
        : (formData.tiers && formData.tiers[0]?.price ? Number(formData.tiers[0].price) : 80);
      const primaryDuration = isReport
        ? 0
        : (formData.tiers && formData.tiers[0]?.duration ? Number(formData.tiers[0].duration) : 60);

      const generatedTiers = isReport
        ? [{ duration: 0, price: primaryPrice, text: `${primaryPrice} د.أ` }]
        : formData.tiers.map((t) => ({
            duration: Number(t.duration) || 60,
            price: Number(t.price) || 80,
            text: `${t.duration} دقيقة • ${t.price} د.أ`
          }));

      const meta = {
        type: formData.service_type,
        tiers: generatedTiers.map((t) => ({ duration: t.duration, price: t.price }))
      };
      const cleanDescText = formData.description ? formData.description.trim() : '';
      const fullDescription = `${cleanDescText}\n<!--meta:${JSON.stringify(meta)}-->`;

      if (editingService) {
        const isDemo = String(editingService.id).startsWith('demo-') || String(editingService.id).startsWith('svc-');
        
        if (isDemo) {
          // If demo, persist as a new record in database
          await consultantService.addService({
            name: formData.name.trim(),
            description: fullDescription,
            price: primaryPrice,
            duration_minutes: primaryDuration,
            is_out_of_specialization: false
          }, token);
          showToast('تم حفظ الخدمة في قاعدة البيانات بنجاح', 'success');
        } else {
          // Real service in DB, update it
          await consultantService.updateService(editingService.id, {
            name: formData.name.trim(),
            description: fullDescription,
            price: primaryPrice,
            duration_minutes: primaryDuration
          }, token);
          showToast('تم حفظ التعديلات في قاعدة البيانات بنجاح', 'success');
        }

        await loadPageData(true);
        handleCloseModal();
      } else {
        // Adding a brand new service to DB
        await consultantService.addService({
          name: formData.name.trim(),
          description: fullDescription,
          price: primaryPrice,
          duration_minutes: primaryDuration,
          is_out_of_specialization: false
        }, token);

        showToast('تمت إضافة الخدمة وحفظها في قاعدة البيانات بنجاح', 'success');
        await loadPageData(true);
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error saving service to DB:', err);
      let errMsg = err?.message || 'حدث خطأ أثناء حفظ الخدمة في قاعدة البيانات';
      try {
        const parsed = JSON.parse(errMsg);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].msg) {
          errMsg = parsed[0].msg;
        } else if (parsed.detail) {
          errMsg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
        }
      } catch {}
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Service Active/Inactive in Database
  const handleToggleService = async (serviceId, currentStatus) => {
    setToggleLoadingId(serviceId);
    try {
      const isDemo = String(serviceId).startsWith('demo-') || String(serviceId).startsWith('svc-');
      if (isDemo) {
        const target = services.find((s) => s.id === serviceId);
        if (target) {
          await consultantService.addService({
            name: target.name,
            description: target.description || null,
            price: target.price || 80,
            duration_minutes: target.duration_minutes || 60,
            is_out_of_specialization: false
          }, token);
        }
      } else {
        await consultantService.toggleService(serviceId, token);
      }
      await loadPageData(true);
      showToast(!currentStatus ? 'تم تفعيل الخدمة في قاعدة البيانات بنجاح' : 'تم إيقاف تفعيل الخدمة', 'success');
    } catch (err) {
      console.error('Error toggling service status:', err);
      showToast(err?.message || 'حدث خطأ أثناء تعديل حالة الخدمة', 'error');
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Delete Service from Database
  const handleConfirmDelete = async () => {
    if (!deleteModalService) return;
    setIsDeleting(true);
    try {
      const isDemo = String(deleteModalService.id).startsWith('demo-') || String(deleteModalService.id).startsWith('svc-');
      if (!isDemo) {
        await consultantService.deleteService(deleteModalService.id, token);
      }
      await loadPageData(true);
      showToast('تم حذف الخدمة من قاعدة البيانات بنجاح', 'success');
      setDeleteModalService(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      showToast(err?.message || 'حدث خطأ أثناء حذف الخدمة من قاعدة البيانات', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Public Booking Link
  const handleCopyLink = (service) => {
    const url = `${window.location.origin}/consultants/${profile?.id || user?.id || 'profile'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('تم نسخ رابط ملفك وخدمتك للمشاركة مع العملاء', 'success');
    } else {
      showToast(`رابط الخدمة: ${url}`, 'info');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Tajawal', sans-serif",
        direction: 'rtl',
        color: '#1E293B'
      }}
    >
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* ── 1. Top Header Banner ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px'
        }}
      >
        {/* Child 1 (RIGHT in RTL): Title & Subtitle + Orange Calendar Icon */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            {/* Orange Calendar with Clock Icon (Far Right in RTL) */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              {/* Calendar Body Outline */}
              <rect x="6" y="8" width="28" height="28" rx="6" stroke="#F9A530" strokeWidth="2.6" fill="none" />
              {/* Horizontal divider bar */}
              <line x1="6" y1="15" x2="34" y2="15" stroke="#F9A530" strokeWidth="2.4" />
              {/* Left Loop */}
              <rect x="11" y="3.5" width="4" height="9" rx="2" stroke="#F9A530" strokeWidth="2.4" fill="#FFFFFF" />
              {/* Right Loop */}
              <rect x="25" y="3.5" width="4" height="9" rx="2" stroke="#F9A530" strokeWidth="2.4" fill="#FFFFFF" />
              {/* Clock Circle at bottom-right corner */}
              <circle cx="28" cy="28" r="9" fill="#FFFFFF" stroke="#F9A530" strokeWidth="2.6" />
              {/* Clock Hands (L-shape: 12 to 3) */}
              <path d="M28 23.5V28H32.5" stroke="#F9A530" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Title (to the left of icon in RTL) */}
            <h1
              style={{
                fontFamily: "'Tajawal', sans-serif",
                fontSize: '32px',
                fontWeight: '800',
                color: '#0A3254',
                margin: 0,
                letterSpacing: '-0.3px',
                lineHeight: 1.2
              }}
            >
              إدارة الخدمات
            </h1>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: '#64748B',
              marginTop: '6px',
              marginBottom: 0,
              lineHeight: 1.5
            }}
          >
            أطلق خدماتك الاستشارية، وكن جاهزاً لاستقبال الحجوزات، وقدم خبراتك لمن يبحث عنها.
          </p>
        </div>

        {/* Child 2 (LEFT in RTL): Primary Action Button: + إضافة خدمة */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0A3254',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '11px 22px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(10, 50, 84, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#07243D';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0A3254';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: '800', lineHeight: 1 }}>+</span>
          <span>إضافة خدمة</span>
        </button>
      </div>

      {/* ── 2. Main White Container ───────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(10, 50, 84, 0.04)',
          padding: '24px 28px 36px',
          minHeight: '480px'
        }}
      >
        {/* Top-Right View Mode Switcher (Joined Segmented Control) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '6px',
              border: '1.5px solid #CBD5E1',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            {/* Grid Icon Button (Far Right in RTL) */}
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="عرض شبكي"
              style={{
                width: '36px',
                height: '32px',
                border: 'none',
                borderLeft: '1.5px solid #CBD5E1',
                backgroundColor: viewMode === 'grid' ? '#0A3254' : '#FFFFFF',
                color: viewMode === 'grid' ? '#FFFFFF' : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="3.5" height="3.5" rx="0.5" />
                <rect x="6.25" y="1" width="3.5" height="3.5" rx="0.5" />
                <rect x="11.5" y="1" width="3.5" height="3.5" rx="0.5" />
                <rect x="1" y="6.25" width="3.5" height="3.5" rx="0.5" />
                <rect x="6.25" y="6.25" width="3.5" height="3.5" rx="0.5" />
                <rect x="11.5" y="6.25" width="3.5" height="3.5" rx="0.5" />
                <rect x="1" y="11.5" width="3.5" height="3.5" rx="0.5" />
                <rect x="6.25" y="11.5" width="3.5" height="3.5" rx="0.5" />
                <rect x="11.5" y="11.5" width="3.5" height="3.5" rx="0.5" />
              </svg>
            </button>

            {/* List Icon Button (Left in RTL) */}
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="عرض قائمة"
              style={{
                width: '36px',
                height: '32px',
                border: 'none',
                backgroundColor: viewMode === 'list' ? '#0A3254' : '#FFFFFF',
                color: viewMode === 'list' ? '#FFFFFF' : '#F59E0B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="2.5" cy="3.5" r="1.2" />
                <rect x="5.5" y="2.5" width="9" height="2" rx="1" />
                <circle cx="2.5" cy="8" r="1.2" />
                <rect x="5.5" y="7" width="9" height="2" rx="1" />
                <circle cx="2.5" cy="12.5" r="1.2" />
                <rect x="5.5" y="11.5" width="9" height="2" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748B' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                border: '3px solid #E2E8F0',
                borderTopColor: '#0A3254',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ fontWeight: '600', fontSize: '15px' }}>جاري تحميل الخدمات...</p>
          </div>
        ) : services.length === 0 ? (
          /* Empty State */
          <div style={{ textAlign: 'center', padding: '64px 20px', color: '#64748B' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#F1F5F9',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0A3254', marginBottom: '8px' }}>
              لم تقم بإضافة أي خدمات بعد
            </h3>
            <p style={{ fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px', lineHeight: '1.6' }}>
              ابدأ بإضافة باقات وخدمات استشاراتك لتظهر في ملفك الشخصي ويتمكن العملاء من حجز الجلسات مباشرة.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: '#0A3254',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '11px 24px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              + إضافة أول خدمة لك الآن
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── 3. Grid View (Matches Screenshot Exactly: 4 Cards in 1 Row) ─── */
          <>
            <style>{`
              .consultant-services-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 14px;
              }
              @media (max-width: 960px) {
                .consultant-services-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
              }
              @media (max-width: 540px) {
                .consultant-services-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
            <div className="consultant-services-grid">
              {services.map((service) => {
                const typeInfo = getServiceTypeInfo(service);
                const pricingTiers = getPricingTiers(service);
                const isToggling = toggleLoadingId === service.id;

                return (
                  <div
                    key={service.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      padding: '14px 12px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '210px',
                      boxShadow: '0 1px 3px rgba(10, 50, 84, 0.04)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 50, 84, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(10, 50, 84, 0.04)';
                    }}
                  >
                    <div>
                      {/* Top Row: Title + Icon Group on Right, Toggle Switch on Left (in RTL) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginBottom: '8px'
                        }}
                      >
                        {/* Child 1 (RIGHT in RTL): Service Icon + Title & Type Pill */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            minWidth: 0,
                            flex: 1
                          }}
                        >
                          {/* Amber / Orange Circular Badge (Far Right in RTL) */}
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#F5A52A',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {typeInfo.icon}
                          </div>

                          {/* Title & Type Pill Column */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: '3px',
                              minWidth: 0,
                              flex: 1
                            }}
                          >
                            <h3
                              style={{
                                fontSize: '13px',
                                fontWeight: '800',
                                color: '#0A3254',
                                margin: 0,
                                lineHeight: 1.3,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%'
                              }}
                              title={service.name}
                            >
                              {service.name}
                            </h3>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1px 8px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '999px',
                                fontSize: '10px',
                                color: '#64748B',
                                fontWeight: '600'
                              }}
                            >
                              {typeInfo.label}
                            </div>
                          </div>
                        </div>

                        {/* Child 2 (LEFT in RTL): iOS-Style Pill Switch */}
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleToggleService(service.id, service.is_active)}
                          title={service.is_active ? 'إيقاف التفعيل' : 'تفعيل الخدمة'}
                          style={{
                            width: '34px',
                            height: '18px',
                            borderRadius: '9px',
                            backgroundColor: service.is_active ? '#0A3254' : '#CBD5E1',
                            border: 'none',
                            cursor: isToggling ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            padding: 0,
                            outline: 'none',
                            opacity: isToggling ? 0.6 : 1,
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          <span
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: '#FFFFFF',
                              position: 'absolute',
                              top: '2px',
                              left: service.is_active ? '2px' : '18px',
                              transition: 'left 0.2s ease',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                          />
                        </button>
                      </div>

                      {/* Middle: Description */}
                      <p
                        style={{
                          fontSize: '11px',
                          color: '#64748B',
                          lineHeight: '1.45',
                          height: '32px',
                          margin: '6px 0 8px 0',
                          textAlign: 'right',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {getServiceCleanDescription(service)}
                      </p>
                    </div>

                    {/* Pricing & Duration Pills (Aligned to the RIGHT in RTL, at exact same vertical position) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        flexWrap: 'nowrap',
                        gap: '4px',
                        marginTop: 'auto',
                        marginBottom: '10px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {pricingTiers.map((tier, idx) => {
                        const isMulti = pricingTiers.length > 2;
                        return (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '999px',
                              padding: isMulti ? '2px 4px' : '3px 10px',
                              fontSize: isMulti ? '9px' : '10.5px',
                              letterSpacing: isMulti ? '-0.2px' : 'normal',
                              fontWeight: '600',
                              color: '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              whiteSpace: 'nowrap',
                              flex: isMulti ? '1 1 0' : '0 0 auto',
                              minWidth: 0,
                              textAlign: 'center'
                            }}
                          >
                            {tier.text}
                          </div>
                        );
                      })}
                    </div>

                    {/* Card Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid #F1F5F9'
                      }}
                    >
                      {/* Child 1 (RIGHT in RTL): Action Icons (View, Pencil, Trash) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {/* View / Preview Icon (Eye) - Far Right in RTL */}
                        <button
                          type="button"
                          onClick={() => setViewingService(service)}
                          title="معاينة تفاصيل الخدمة"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#0A3254',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        {/* Edit Icon (Pencil) - Middle */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(service)}
                          title="تعديل الخدمة"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#0A3254',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Delete Icon (Trash) - Left in RTL */}
                        <button
                          type="button"
                          onClick={() => setDeleteModalService(service)}
                          title="حذف الخدمة"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#DC2626',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>

                      {/* Child 2 (LEFT in RTL): Status Pill Badge */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          backgroundColor: service.is_active ? '#DCFCE7' : '#F1F5F9',
                          color: service.is_active ? '#166534' : '#64748B',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {service.is_active ? 'مفعّلة' : 'معطّلة'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ── 4. List View (Matches Exact Table Screenshot) ───────── */
          <div style={{ width: '100%', overflowX: 'auto' }}>
            {/* Table Header Bar */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                padding: '14px 24px',
                display: 'grid',
                gridTemplateColumns: 'minmax(240px, 3fr) minmax(130px, 1.4fr) minmax(320px, 3.2fr) minmax(90px, 0.9fr) minmax(180px, 1.8fr)',
                alignItems: 'center',
                marginBottom: '10px',
                fontWeight: '800',
                fontSize: '14px',
                color: '#0A3254',
                textAlign: 'right'
              }}
            >
              <div>الخدمة</div>
              <div>نوع الجلسة</div>
              <div>المدد والأسعار</div>
              <div style={{ textAlign: 'center' }}>الحالة</div>
              <div style={{ textAlign: 'left', direction: 'ltr', paddingLeft: '4px' }}>الإجراءات</div>
            </div>

            {/* Table Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {services.map((service) => {
                const typeInfo = getServiceTypeInfo(service);
                const pricingTiers = getPricingTiers(service);
                const isToggling = toggleLoadingId === service.id;

                // Format pricing text for list view (e.g., "30 دقيقة • 45 د.أ | 60 دقيقة • 80 د.أ | 90 دقيقة • 120 د.أ")
                const pricingText = pricingTiers
                  .map((t) => (t.duration > 0 ? `${t.duration} دقيقة • ${t.price} د.أ` : `${t.price} د.أ`))
                  .join(' | ');

                return (
                  <div
                    key={service.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      borderBottom: '1px solid #F1F5F9',
                      padding: '16px 24px',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(240px, 3fr) minmax(130px, 1.4fr) minmax(320px, 3.2fr) minmax(90px, 0.9fr) minmax(180px, 1.8fr)',
                      alignItems: 'center',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FBFDFF')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                  >
                    {/* Col 1 (Right): الخدمة */}
                    <div style={{ textAlign: 'right' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#0A3254' }}>
                        {service.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                        {getServiceCleanDescription(service)}
                      </p>
                    </div>

                    {/* Col 2: نوع الجلسة */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#0A3254', fontWeight: '600' }}>
                      <span>{typeInfo.label}</span>
                      <span style={{ display: 'flex', alignItems: 'center', color: '#64748B' }}>
                        {typeInfo.type === 'video' ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                        ) : typeInfo.type === 'chat' ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        )}
                      </span>
                    </div>

                    {/* Col 3: المدد والأسعار */}
                    <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600', direction: 'rtl', textAlign: 'right' }}>
                      {pricingText}
                    </div>

                    {/* Col 4: الحالة */}
                    <div style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: '4px 14px',
                          borderRadius: '12px',
                          backgroundColor: service.is_active ? '#EAF8F1' : '#F1F5F9',
                          color: service.is_active ? '#10B981' : '#64748B',
                          display: 'inline-block'
                        }}
                      >
                        {service.is_active ? 'مفعلة' : 'معطلة'}
                      </span>
                    </div>

                    {/* Col 5 (Left): الإجراءات (Toggle on far left, then Red Trash, Edit, Eye in square bordered boxes) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '8px',
                        direction: 'ltr'
                      }}
                    >
                      {/* Toggle Switch */}
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleService(service.id, service.is_active)}
                        title={service.is_active ? 'إيقاف التفعيل' : 'تفعيل الخدمة'}
                        style={{
                          width: '42px',
                          height: '24px',
                          borderRadius: '12px',
                          backgroundColor: service.is_active ? '#0A3254' : '#CBD5E1',
                          border: 'none',
                          cursor: isToggling ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          transition: 'background-color 0.25s ease',
                          padding: 0,
                          outline: 'none',
                          opacity: isToggling ? 0.6 : 1,
                          flexShrink: 0
                        }}
                      >
                        <span
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            position: 'absolute',
                            top: '3px',
                            left: service.is_active ? '4px' : '20px',
                            transition: 'left 0.25s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }}
                        />
                      </button>

                      {/* Delete Icon (Trash) in square box */}
                      <button
                        type="button"
                        onClick={() => setDeleteModalService(service)}
                        title="حذف الخدمة"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#FECACA';
                          e.currentTarget.style.backgroundColor = '#FEF2F2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E2E8F0';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>

                      {/* Edit Icon (Pencil) in square box */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(service)}
                        title="تعديل الخدمة"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          color: '#0A3254',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.backgroundColor = '#F8FAFC';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E2E8F0';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>

                      {/* View / Preview Icon (Eye) in square box */}
                      <button
                        type="button"
                        onClick={() => setViewingService(service)}
                        title="معاينة تفاصيل الخدمة"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          color: '#0A3254',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.backgroundColor = '#F8FAFC';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E2E8F0';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Modal: Service Details Preview (Eye Icon Click) ────── */}
      {viewingService && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            fontFamily: "'Tajawal', sans-serif"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingService(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative',
              fontFamily: "'Tajawal', sans-serif"
            }}
          >
            {/* Modal Header: Title on Right, Close ✕ on Left */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}
            >
              {/* Child 1 (RIGHT in RTL): Title */}
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#0A3254',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                تفاصيل الخدمة
              </h2>

              {/* Child 2 (LEFT in RTL): Close ✕ button */}
              <button
                type="button"
                onClick={() => setViewingService(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#0A3254',
                  cursor: 'pointer',
                  fontSize: '20px',
                  fontWeight: '400',
                  lineHeight: 1,
                  padding: '4px',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                ✕
              </button>
            </div>

            {/* Box 1: الخدمة */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '10px 16px',
                marginBottom: '12px',
                textAlign: 'right'
              }}
            >
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#94A3B8',
                  fontWeight: '600',
                  marginBottom: '4px',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                الخدمة
              </div>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: '800',
                  color: '#0A3254',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                {viewingService.name}
              </div>
            </div>

            {/* Box 2: الوصف */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '10px 16px',
                marginBottom: '12px',
                textAlign: 'right',
                minHeight: '68px'
              }}
            >
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#94A3B8',
                  fontWeight: '600',
                  marginBottom: '4px',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                الوصف
              </div>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: '700',
                  color: '#0A3254',
                  lineHeight: '1.6',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                {getServiceCleanDescription(viewingService)}
              </div>
            </div>

            {/* Box 3: النوع (Right) & الحالة (Left) */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '12px'
              }}
            >
              {/* Child 1 (RIGHT in RTL): النوع */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  padding: '10px 16px',
                  textAlign: 'right'
                }}
              >
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#94A3B8',
                    fontWeight: '600',
                    marginBottom: '4px',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                >
                  النوع
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#0A3254',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                >
                  {getServiceTypeInfo(viewingService).label}
                </div>
              </div>

              {/* Child 2 (LEFT in RTL): الحالة */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  padding: '10px 16px',
                  textAlign: 'right'
                }}
              >
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#94A3B8',
                    fontWeight: '600',
                    marginBottom: '4px',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                >
                  الحالة
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: '#0A3254',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                >
                  {viewingService.is_active ? 'مفعلة' : 'معطلة'}
                </div>
              </div>
            </div>

            {/* Box 4: المدد والأسعار */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '10px 16px',
                marginBottom: '24px',
                textAlign: 'right'
              }}
            >
              <div
                style={{
                  fontSize: '11.5px',
                  color: '#94A3B8',
                  fontWeight: '600',
                  marginBottom: '4px',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                المدد والأسعار
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '800',
                  color: '#0A3254',
                  fontFamily: "'Tajawal', sans-serif",
                  lineHeight: '1.6'
                }}
              >
                {(() => {
                  const tiers = getPricingTiers(viewingService);
                  if (tiers && Array.isArray(tiers) && tiers.length > 0) {
                    return tiers
                      .map((t) => (t.duration > 0 ? `${t.duration} دقيقة — ${t.price} د.أ` : `${t.price} د.أ`))
                      .join(' | ');
                  }
                  return `${viewingService.price || 80} د.أ`;
                })()}
              </div>
            </div>

            {/* Modal Footer: Single 'إغلاق' button on the LEFT */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start'
              }}
            >
              <button
                type="button"
                onClick={() => setViewingService(null)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0A3254',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '10px 32px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Tajawal', sans-serif"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Modal: Add / Edit Service (Exact Match to User Reference Design) ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            fontFamily: "'Tajawal', sans-serif",
            direction: 'rtl'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 24px 60px rgba(10, 50, 84, 0.2)',
              overflow: 'hidden',
              padding: '28px 24px 24px',
              animation: 'modalPop 0.22s ease-out',
              fontFamily: "'Tajawal', sans-serif",
              boxSizing: 'border-box'
            }}
          >
            <style>{`@keyframes modalPop { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

            {/* Modal Header: Title on Right, Close ✕ on Left */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}
            >
              {/* Right: Title */}
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>
                {editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
              </h2>

              {/* Left: Close button ✕ */}
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#0A3254',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: '800',
                  lineHeight: 1,
                  padding: '4px',
                  fontFamily: "'Tajawal', sans-serif"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} style={{ fontFamily: "'Tajawal', sans-serif" }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Field 1: عنوان الخدمة */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#0A3254',
                      marginBottom: '6px',
                      textAlign: 'right',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    عنوان الخدمة
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ادخل عنوان الخدمة المقدّمة"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      fontSize: '13.5px',
                      color: '#0A3254',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  />
                </div>

                {/* Field 2: الوصف */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#0A3254',
                      marginBottom: '6px',
                      textAlign: 'right',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    الوصف
                  </label>
                  <textarea
                    rows={3}
                    maxLength={100}
                    placeholder="وصف مختصر للخدمة"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      height: '75px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      fontSize: '13.5px',
                      color: '#0A3254',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontFamily: "'Tajawal', sans-serif",
                      lineHeight: '1.5'
                    }}
                  />
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94A3B8',
                      textAlign: 'left',
                      marginTop: '4px',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    100 / {formData.description ? formData.description.length : 0}
                  </div>
                </div>

                {/* Field 3: نوع الجلسة */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#0A3254',
                      marginBottom: '8px',
                      textAlign: 'right',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    نوع الجلسة
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px'
                    }}
                  >
                    {/* Option 1: جلسة فيديو */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, service_type: 'video' })}
                      style={{
                        backgroundColor: formData.service_type === 'video' ? '#FFFFFF' : '#F8FAFC',
                        color: '#0A3254',
                        border: formData.service_type === 'video' ? '1.5px solid #0A3254' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        height: '40px',
                        padding: '0 8px',
                        fontSize: '12.5px',
                        fontWeight: formData.service_type === 'video' ? '800' : '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#005D9C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="14" height="12" rx="2" />
                        <path d="M16 10l5-3v10l-5-3" />
                      </svg>
                      <span>جلسة فيديو</span>
                    </button>

                    {/* Option 2: جلسة محادثة */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, service_type: 'chat' })}
                      style={{
                        backgroundColor: formData.service_type === 'chat' ? '#FFFFFF' : '#F8FAFC',
                        color: '#0A3254',
                        border: formData.service_type === 'chat' ? '1.5px solid #0A3254' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        height: '40px',
                        padding: '0 8px',
                        fontSize: '12.5px',
                        fontWeight: formData.service_type === 'chat' ? '800' : '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>جلسة محادثة</span>
                    </button>

                    {/* Option 3: تقرير مكتوب */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, service_type: 'report' })}
                      style={{
                        backgroundColor: formData.service_type === 'report' ? '#FFFFFF' : '#F8FAFC',
                        color: '#0A3254',
                        border: formData.service_type === 'report' ? '1.5px solid #0A3254' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        height: '40px',
                        padding: '0 8px',
                        fontSize: '12.5px',
                        fontWeight: formData.service_type === 'report' ? '800' : '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <span>تقرير مكتوب</span>
                    </button>
                  </div>
                </div>

                {/* Field 4: Duration & Price */}
                {formData.service_type === 'report' ? (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: '#0A3254',
                        marginBottom: '6px',
                        textAlign: 'right',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      السعر (بالدينار)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="ادخل سعر الجلسة"
                      value={formData.single_price}
                      onChange={(e) => setFormData({ ...formData, single_price: e.target.value })}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        fontSize: '13.5px',
                        color: '#0A3254',
                        outline: 'none',
                        textAlign: 'right',
                        boxSizing: 'border-box',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {formData.tiers.map((tier, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                          {/* Right: المدة (بالدقائق) */}
                          <div>
                            {idx === 0 && (
                              <label
                                style={{
                                  display: 'block',
                                  fontSize: '13px',
                                  fontWeight: '800',
                                  color: '#0A3254',
                                  marginBottom: '6px',
                                  textAlign: 'right',
                                  fontFamily: "'Tajawal', sans-serif"
                                }}
                              >
                                المدة (بالدقائق)
                              </label>
                            )}
                            <input
                              type="number"
                              min="5"
                              required
                              placeholder="ادخل مدة الجلسة"
                              value={tier.duration}
                              onChange={(e) => handleUpdateTier(idx, 'duration', e.target.value)}
                              style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 14px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                fontSize: '13.5px',
                                color: '#0A3254',
                                outline: 'none',
                                boxSizing: 'border-box',
                                textAlign: 'right',
                                fontFamily: "'Tajawal', sans-serif"
                              }}
                            />
                          </div>

                          {/* Left: السعر (بالدينار) */}
                          <div>
                            {idx === 0 && (
                              <label
                                style={{
                                  display: 'block',
                                  fontSize: '13px',
                                  fontWeight: '800',
                                  color: '#0A3254',
                                  marginBottom: '6px',
                                  textAlign: 'right',
                                  fontFamily: "'Tajawal', sans-serif"
                                }}
                              >
                                السعر (بالدينار)
                              </label>
                            )}
                            <input
                              type="number"
                              min="1"
                              required
                              placeholder="ادخل سعر الجلسة"
                              value={tier.price}
                              onChange={(e) => handleUpdateTier(idx, 'price', e.target.value)}
                              style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 14px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                fontSize: '13.5px',
                                color: '#0A3254',
                                outline: 'none',
                                boxSizing: 'border-box',
                                textAlign: 'right',
                                fontFamily: "'Tajawal', sans-serif"
                              }}
                            />
                          </div>

                          {/* Remove button if multiple tiers */}
                          {formData.tiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTier(idx)}
                              style={{
                                height: '40px',
                                border: 'none',
                                background: 'transparent',
                                color: '#EF4444',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0 4px',
                                fontFamily: "'Tajawal', sans-serif"
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Plus Button to add tier */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={handleAddTier}
                        title="إضافة فترة أخرى"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#0A3254',
                          cursor: 'pointer',
                          fontSize: '20px',
                          fontWeight: '800',
                          lineHeight: 1,
                          padding: '4px 6px',
                          fontFamily: "'Tajawal', sans-serif"
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '22px'
                }}
              >
                {/* Right: إضافة الخدمة */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    backgroundColor: '#0A3254',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    height: '42px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#07243D')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0A3254')}
                >
                  {isSubmitting && (
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #FFFFFF',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    />
                  )}
                  {editingService ? 'حفظ التعديلات' : 'إضافة الخدمة'}
                </button>

                {/* Left: إلغاء */}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    color: '#0A3254',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    height: '42px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                    fontFamily: "'Tajawal', sans-serif"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Modal: Delete Confirmation ───────────────────────────── */}
      {deleteModalService && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 50, 84, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteModalService(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0A3254', margin: '0 0 8px' }}>
              تأكيد حذف الخدمة
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: '0 0 24px' }}>
              هل أنت متأكد من رغبتك في حذف خدمة <strong>"{deleteModalService.name}"</strong>؟ لن يتمكن العملاء من حجز هذه الخدمة بعد حذفها.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف الخدمة'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalService(null)}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
