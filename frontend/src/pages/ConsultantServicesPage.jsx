import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';

// Helper to parse embedded JSON metadata (service_type, tiers) from description
const parseServiceMeta = (service) => {
  if (!service) return { meta: null, cleanDesc: '' };
  let rawDesc = service.description || '';
  let meta = null;

  // 1. Extract JSON from <!--meta:...--> or corrupted variations
  const match = rawDesc.match(/<!--meta:([\s\S]*?)-->/);
  if (match) {
    try {
      meta = JSON.parse(match[1]);
    } catch {}
  }

  // 2. Fallback JSON search
  if (!meta) {
    const jsonMatch = rawDesc.match(/meta:(\{[\s\S]*?\})/);
    if (jsonMatch) {
      try {
        meta = JSON.parse(jsonMatch[1]);
      } catch {}
    }
  }

  // 3. Strip ALL html comments and metadata patterns completely from cleanDesc
  let cleanDesc = rawDesc
    .replace(/<!--meta:[\s\S]*?-->/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/<--[\s\S]*?-->/gi, '')
    .replace(/meta:\{[\s\S]*?\}/gi, '')
    .replace(/meta:[\s\S]*?\}/gi, '')
    .replace(/<--[\s\S]*?\}/gi, '')
    .replace(/<--/gi, '')
    .replace(/-->/gi, '')
    .trim();

  return { meta, cleanDesc };
};

// Helper to get sanitized clean description for UI display
const getServiceCleanDescription = (service) => {
  if (!service) return 'مراجعة كاملة للوضع الضريبي وتحديد الالتزامات والمخاطر';
  const { cleanDesc } = parseServiceMeta(service);
  if (cleanDesc && cleanDesc.trim().length > 0) {
    return cleanDesc.trim();
  }
  return 'مراجعة كاملة للوضع الضريبي وتحديد الالتزامات والمخاطر';
};

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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
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
      text: t.duration > 0 ? `${t.duration} دقيقة • ${t.price} د.أ` : `${t.price} د.أ`
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

  return [{ duration: dur, price: pr, text: `${dur} دقيقة • ${pr} د.أ` }];
};

// Initial default services
const DEFAULT_DEMO_SERVICES = [
  {
    id: 'demo-1',
    name: 'استشارة ضريبية شاملة',
    service_type: 'video',
    description: 'مراجعة كاملة للوضع الضريبي وتحديد الالتزامات والمخاطر',
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
      { duration: 30, price: 45 },
      { duration: 60, price: 80 },
      { duration: 90, price: 120 }
    ],
    single_price: 200
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
        { duration: 30, price: 45 },
        { duration: 60, price: 80 },
        { duration: 90, price: 120 }
      ],
      single_price: 200
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
      tiers: [...prev.tiers, { duration: 60, price: 80 }]
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
      tiers: prev.tiers.map((t, i) => (i === idx ? { ...t, [field]: Number(val) || '' } : t))
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
      className="portal-content-container"
      style={{
        padding: '24px 32px',
        maxWidth: '1440px',
        margin: '0 auto',
        fontFamily: "'Tajawal', sans-serif",
        direction: 'rtl',
        color: '#1E293B',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh'
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
        {/* Child 1 (RIGHT in RTL): Title & Subtitle + Orange Square Icon */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            {/* Yellow/Orange Square Icon (Far Right) */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '2.5px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#F59E0B',
                  borderRadius: '2px'
                }}
              />
            </div>

            {/* Title (to the left of icon) */}
            <h1
              style={{
                fontSize: '28px',
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
        {/* Top-Left View Mode Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            direction: 'ltr',
            gap: '8px',
            marginBottom: '24px'
          }}
        >
          {/* Grid Icon Button (on the left) */}
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="عرض شبكي"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: viewMode === 'grid' ? 'none' : '1px solid #CBD5E1',
              backgroundColor: viewMode === 'grid' ? '#0A3254' : '#FFFFFF',
              color: viewMode === 'grid' ? '#FFFFFF' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>

          {/* List Icon Button (on the right) */}
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="عرض قائمة"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: viewMode === 'list' ? 'none' : '1px solid #CBD5E1',
              backgroundColor: viewMode === 'list' ? '#0A3254' : '#FFFFFF',
              color: viewMode === 'list' ? '#FFFFFF' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="9" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="9" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="9" y1="18" x2="21" y2="18" strokeLinecap="round" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>
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
          /* ── 3. Grid View (Matches Screenshot Exactly) ───────────────── */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {services.map((service) => {
              const typeInfo = getServiceTypeInfo(service);
              const pricingTiers = getPricingTiers(service);
              const isToggling = toggleLoadingId === service.id;

              return (
                <div
                  key={service.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    padding: '22px 20px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '270px',
                    boxShadow: '0 2px 8px rgba(10, 50, 84, 0.03)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(10, 50, 84, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 50, 84, 0.03)';
                  }}
                >
                  <div>
                    {/* Top Row: Title & Icon on Right, Toggle Switch on Left */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '12px'
                      }}
                    >
                      {/* Child 1 (RIGHT in RTL): Title Block + Golden Icon */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        {/* Title & Subtitle */}
                        <div style={{ textAlign: 'right' }}>
                          <h3
                            style={{
                              fontSize: '15.5px',
                              fontWeight: '800',
                              color: '#0A3254',
                              margin: '0 0 3px 0',
                              lineHeight: 1.25
                            }}
                          >
                            {service.name}
                          </h3>
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#94A3B8',
                              fontWeight: '500',
                              display: 'block'
                            }}
                          >
                            {typeInfo.label}
                          </span>
                        </div>

                        {/* Circular Golden / Amber Icon */}
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: '#F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)'
                          }}
                        >
                          {typeInfo.icon}
                        </div>
                      </div>

                      {/* Child 2 (LEFT in RTL): iOS-Style Pill Switch */}
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
                    </div>

                    {/* Middle: Description */}
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#64748B',
                        lineHeight: '1.6',
                        minHeight: '38px',
                        margin: '14px 0 16px 0',
                        textAlign: 'right',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {getServiceCleanDescription(service)}
                    </p>

                    {/* Pricing & Duration Pills (Right-aligned in RTL) */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '16px',
                        justifyContent: 'flex-start'
                      }}
                    >
                      {pricingTiers.map((tier, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#F1F5F9',
                            border: 'none',
                            borderRadius: '14px',
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            color: '#0A3254',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          {tier.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '14px',
                      borderTop: '1px solid #F1F5F9',
                      marginTop: 'auto'
                    }}
                  >
                    {/* Child 1 (RIGHT in RTL): Status Badge */}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '4px 14px',
                        borderRadius: '12px',
                        backgroundColor: service.is_active ? '#E6F7F0' : '#F1F5F9',
                        color: service.is_active ? '#10B981' : '#64748B'
                      }}
                    >
                      {service.is_active ? 'مفعلة' : 'معطلة'}
                    </span>

                    {/* Child 2 (LEFT in RTL): Action Icons in LTR order */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        direction: 'ltr'
                      }}
                    >
                      {/* View / Preview Icon (Eye) */}
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Edit Icon (Pencil) */}
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
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0A3254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>

                      {/* Delete Icon (Trash) */}
                      <button
                        type="button"
                        onClick={() => setDeleteModalService(service)}
                        title="حذف الخدمة"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#E11D48',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#E11D48')}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* ── 6. Modal: Add / Edit Service (Exact Match to User Reference Designs) ── */}
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
            fontFamily: "'Tajawal', sans-serif"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              animation: 'modalPop 0.22s ease-out',
              fontFamily: "'Tajawal', sans-serif"
            }}
          >
            <style>{`@keyframes modalPop { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

            {/* Modal Header: Title on Right, Close ✕ on Left */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {/* Child 1 (RIGHT in RTL): Title */}
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0A3254', fontFamily: "'Tajawal', sans-serif" }}>
                {editingService ? 'تعديل الخدمة' : 'إضافة خدمة'}
              </h2>

              {/* Child 2 (LEFT in RTL): Close button ✕ */}
              <button
                type="button"
                onClick={handleCloseModal}
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

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} style={{ padding: '24px', fontFamily: "'Tajawal', sans-serif" }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Field 1: عنوان الخدمة */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: '800',
                      color: '#0A3254',
                      marginBottom: '8px',
                      textAlign: 'right',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    عنوان الخدمة
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="استشارة ضريبية شاملة"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '14px',
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
                      fontSize: '13.5px',
                      fontWeight: '800',
                      color: '#0A3254',
                      marginBottom: '8px',
                      textAlign: 'right',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    الوصف
                  </label>
                  <textarea
                    rows={4}
                    placeholder="مراجعة كاملة للوضع الضريبي وتحديد الالتزامات والمخاطر"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '13.5px',
                      color: '#0A3254',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontFamily: "'Tajawal', sans-serif",
                      lineHeight: '1.6'
                    }}
                  />
                </div>

                {/* Field 3: نوع الجلسة (3 Buttons in a row: Right = Video, Middle = Chat, Left = Report) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
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
                      gap: '10px'
                    }}
                  >
                    {/* Option 1 (RIGHT in RTL): جلسة فيديو */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, service_type: 'video' })}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#0A3254',
                        border: formData.service_type === 'video' ? '2px solid #0A3254' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '12px 6px',
                        fontSize: '13px',
                        fontWeight: formData.service_type === 'video' ? '800' : '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      <span>جلسة فيديو</span>
                    </button>

                    {/* Option 2 (MIDDLE in RTL): جلسة محادثة */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, service_type: 'chat' })}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#0A3254',
                        border: formData.service_type === 'chat' ? '2px solid #0A3254' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '12px 6px',
                        fontSize: '13px',
                        fontWeight: formData.service_type === 'chat' ? '800' : '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>جلسة محادثة</span>
                    </button>

                    {/* Option 3 (LEFT in RTL): تقرير مكتوب */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, service_type: 'report' })}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#0A3254',
                        border: formData.service_type === 'report' ? '2px solid #0A3254' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '12px 6px',
                        fontSize: '13px',
                        fontWeight: formData.service_type === 'report' ? '800' : '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        fontFamily: "'Tajawal', sans-serif"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>تقرير مكتوب</span>
                    </button>
                  </div>
                </div>

                {/* Field 4: Duration & Price Tiers */}
                {formData.service_type === 'report' ? (
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', textAlign: 'right', fontWeight: '500', fontFamily: "'Tajawal', sans-serif" }}>
                      التقرير المكتوب لا يحتاج مدة زمنية؛ يتم تحديد السعر فقط.
                    </p>
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
                      السعر (د.أ)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="200"
                          value={formData.single_price}
                          onChange={(e) => setFormData({ ...formData, single_price: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1.5px solid #0A3254',
                            fontSize: '14px',
                            color: '#0A3254',
                            outline: 'none',
                            textAlign: 'right',
                            boxSizing: 'border-box',
                            fontFamily: "'Tajawal', sans-serif"
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, single_price: '' })}
                        style={{
                          width: '38px',
                          height: '42px',
                          borderRadius: '8px',
                          border: '1px solid #FECACA',
                          backgroundColor: '#FFFFFF',
                          color: '#EF4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          fontWeight: '600',
                          flexShrink: 0,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Rows of Duration (Right), Price (Middle), Delete ✕ (Left) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {formData.tiers.map((tier, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '10px'
                          }}
                        >
                          {/* Child 1 (RIGHT in RTL): المدة (بالدقائق) */}
                          <div style={{ flex: 1 }}>
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
                              placeholder="المدة"
                              value={tier.duration}
                              onChange={(e) => handleUpdateTier(idx, 'duration', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                fontSize: '14px',
                                color: '#0A3254',
                                outline: 'none',
                                boxSizing: 'border-box',
                                textAlign: 'right',
                                fontFamily: "'Tajawal', sans-serif"
                              }}
                            />
                          </div>

                          {/* Child 2 (MIDDLE in RTL): السعر (د.أ) */}
                          <div style={{ flex: 1 }}>
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
                                السعر (د.أ)
                              </label>
                            )}
                            <input
                              type="number"
                              min="1"
                              required
                              placeholder="السعر"
                              value={tier.price}
                              onChange={(e) => handleUpdateTier(idx, 'price', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                fontSize: '14px',
                                color: '#0A3254',
                                outline: 'none',
                                boxSizing: 'border-box',
                                textAlign: 'right',
                                fontFamily: "'Tajawal', sans-serif"
                              }}
                            />
                          </div>

                          {/* Child 3 (LEFT in RTL): Red Delete Button ✕ */}
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            disabled={formData.tiers.length <= 1}
                            style={{
                              width: '38px',
                              height: '42px',
                              borderRadius: '8px',
                              border: '1px solid #FECACA',
                              backgroundColor: '#FFFFFF',
                              color: '#EF4444',
                              cursor: formData.tiers.length <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '15px',
                              fontWeight: '600',
                              flexShrink: 0,
                              opacity: formData.tiers.length <= 1 ? 0.4 : 1,
                              transition: 'all 0.15s ease',
                              fontFamily: "'Tajawal', sans-serif"
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Plus Button to add tier on the left side */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={handleAddTier}
                        title="إضافة باقة زمنية أخرى"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#0A3254',
                          cursor: 'pointer',
                          fontSize: '26px',
                          fontWeight: '800',
                          lineHeight: 1,
                          padding: '4px 8px',
                          fontFamily: "'Tajawal', sans-serif"
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '28px',
                  paddingTop: '20px',
                  borderTop: '1px solid #F1F5F9'
                }}
              >
                {/* Child 1 (RIGHT in RTL): إلغاء */}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    color: '#0A3254',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '15px',
                    fontWeight: '800',
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

                {/* Child 2 (LEFT in RTL): حفظ التعديلات */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    backgroundColor: '#0A3254',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 4px 12px rgba(10, 50, 84, 0.2)',
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
