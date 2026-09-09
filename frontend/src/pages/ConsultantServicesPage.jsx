import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';

export default function ConsultantServicesPage({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [expansions, setExpansions] = useState([]);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'active', 'inactive', 'expansions'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteModalService, setDeleteModalService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specialization_id: '',
    price: '',
    duration_minutes: 60,
    proof_document_url: ''
  });

  // Load all initial page data
  const loadPageData = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const [servicesData, profileData, specsData, expansionsData] = await Promise.all([
        consultantService.getMyServices(token).catch(() => []),
        consultantService.getMyProfile(token).catch(() => null),
        consultantService.getSpecializations(token).catch(() => []),
        consultantService.getMyExpansions(token).catch(() => [])
      ]);

      setServices(servicesData || []);
      setProfile(profileData);
      setSpecializations(specsData || []);
      setExpansions(expansionsData || []);
    } catch (err) {
      console.error('Error fetching consultant services page data:', err);
      showToast('حدث خطأ أثناء تحميل بيانات الخدمات', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [token]);

  // Is the currently selected specialization in the modal outside the consultant's main specialization?
  const isOutOfSpecialization = useMemo(() => {
    if (!profile || !formData.specialization_id) return false;
    const currentSpecId = Number(formData.specialization_id);
    const consultantMainSpecId = profile.specialization_id ? Number(profile.specialization_id) : null;
    return consultantMainSpecId !== null && currentSpecId !== consultantMainSpecId;
  }, [profile, formData.specialization_id]);

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      // Tab filter
      if (selectedTab === 'active' && !svc.is_active) return false;
      if (selectedTab === 'inactive' && svc.is_active) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = svc.name?.toLowerCase().includes(query);
        const matchDesc = svc.description?.toLowerCase().includes(query);
        return matchName || matchDesc;
      }
      return true;
    });
  }, [services, selectedTab, searchQuery]);

  // Open Add Service Modal
  const handleOpenAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      specialization_id: profile?.specialization_id ? String(profile.specialization_id) : '',
      price: '',
      duration_minutes: 60,
      proof_document_url: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Service Modal
  const handleOpenEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      specialization_id: service.specialization_id ? String(service.specialization_id) : (profile?.specialization_id ? String(profile.specialization_id) : ''),
      price: service.price ? String(service.price) : '',
      duration_minutes: service.duration_minutes || 60,
      proof_document_url: ''
    });
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setIsSubmitting(false);
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('يرجى إدخال اسم الخدمة', 'error');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      showToast('يرجى إدخال سعر صحيح للخدمة', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingService) {
        // Edit existing service
        await consultantService.updateService(editingService.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: Number(formData.price),
          duration_minutes: Number(formData.duration_minutes)
        }, token);

        showToast('تم تحديث بيانات الخدمة بنجاح', 'success');
        handleCloseModal();
        loadPageData(true);
      } else {
        // Adding new service
        if (isOutOfSpecialization) {
          // Requires Admin Approval via Service Expansion Request
          await consultantService.submitExpansionRequest({
            requested_specialization_id: Number(formData.specialization_id),
            service_name: formData.name.trim(),
            service_description: formData.description.trim() || `خدمة استشارية جديدة: ${formData.name.trim()} (المدة: ${formData.duration_minutes} دقيقة، السعر: ${formData.price} ر.س)`,
            proof_document_url: formData.proof_document_url.trim() || 'https://diwan-consult.com/documents/pending-proof'
          }, token);

          showToast('تم إرسال طلب اعتماد الخدمة بنجاح إلى إدارة المنصة للموافقة', 'success');
          handleCloseModal();
          setSelectedTab('expansions');
          loadPageData(true);
        } else {
          // In-Specialization -> Add directly to DB
          await consultantService.addService({
            specialization_id: formData.specialization_id ? Number(formData.specialization_id) : null,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            price: Number(formData.price),
            duration_minutes: Number(formData.duration_minutes),
            is_out_of_specialization: false
          }, token);

          showToast('تمت إضافة الخدمة ونشرها بنجاح', 'success');
          handleCloseModal();
          loadPageData(true);
        }
      }
    } catch (err) {
      console.error('Error saving service:', err);
      const errMsg = err?.message || 'حدث خطأ أثناء حفظ الخدمة';
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Service Active/Inactive
  const handleToggleService = async (serviceId, currentStatus) => {
    setToggleLoadingId(serviceId);
    try {
      await consultantService.toggleService(serviceId, token);
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, is_active: !currentStatus } : s))
      );
      showToast(!currentStatus ? 'تم تفعيل الخدمة بنجاح' : 'تم إيقاف تفعيل الخدمة', 'success');
    } catch (err) {
      console.error('Error toggling service status:', err);
      showToast('حدث خطأ أثناء تعديل حالة الخدمة', 'error');
      loadPageData(true);
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Delete Service
  const handleConfirmDelete = async () => {
    if (!deleteModalService) return;
    setIsDeleting(true);
    try {
      await consultantService.deleteService(deleteModalService.id, token);
      setServices((prev) => prev.filter((s) => s.id !== deleteModalService.id));
      showToast('تم حذف الخدمة بنجاح', 'success');
      setDeleteModalService(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      showToast('حدث خطأ أثناء حذف الخدمة', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Link to Share Service / Profile
  const handleCopyLink = (service) => {
    const url = `${window.location.origin}/consultants/${profile?.id || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('تم نسخ رابط ملفك وخدماتك لمشاركتها', 'success');
    } else {
      showToast(`رابط المشاركة: ${url}`, 'info');
    }
  };

  // Helper: Find Specialization Name
  const getSpecializationName = (specId) => {
    if (!specId) return 'عام / تخصص المنصة';
    const found = specializations.find((s) => Number(s.id) === Number(specId));
    return found ? found.name : 'استشارات متخصصة';
  };

  return (
    <div
      className="portal-content-container"
      style={{
        padding: '28px',
        maxWidth: '1440px',
        margin: '0 auto',
        fontFamily: 'Tajawal, sans-serif',
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
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.1)'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
              إدارة الخدمات
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
              أنشئ خدماتك الاستشارية، وحدد أسعارها وباقاتها وتفاصيلها لجذب المزيد من العملاء.
            </p>
          </div>
        </div>

        {/* Primary Action Button: + إضافة خدمة */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0D3C5C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(13, 60, 92, 0.25)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#092C44';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0D3C5C';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          إضافة خدمة
        </button>
      </div>

      {/* ── 2. Main White Container with Filters & Content ───────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 14px rgba(13, 60, 92, 0.04)',
          overflow: 'hidden'
        }}
      >
        {/* Toolbar: Tabs + Search + View Switch */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedTab('all')}
              style={{
                border: 'none',
                background: selectedTab === 'all' ? '#005D9C' : '#F1F5F9',
                color: selectedTab === 'all' ? '#FFFFFF' : '#475569',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              جميع الخدمات ({services.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('active')}
              style={{
                border: 'none',
                background: selectedTab === 'active' ? '#059669' : '#F1F5F9',
                color: selectedTab === 'active' ? '#FFFFFF' : '#475569',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              النشطة ({services.filter((s) => s.is_active).length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('inactive')}
              style={{
                border: 'none',
                background: selectedTab === 'inactive' ? '#64748B' : '#F1F5F9',
                color: selectedTab === 'inactive' ? '#FFFFFF' : '#475569',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              غير النشطة ({services.filter((s) => !s.is_active).length})
            </button>

            {/* Expansions / Pending Approval Tab */}
            <button
              type="button"
              onClick={() => setSelectedTab('expansions')}
              style={{
                border: selectedTab === 'expansions' ? 'none' : '1px solid #FDE68A',
                background: selectedTab === 'expansions' ? '#D97706' : '#FFFBEB',
                color: selectedTab === 'expansions' ? '#FFFFFF' : '#B45309',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>طلبات الاعتماد</span>
              {expansions.filter((e) => e.status === 'pending').length > 0 && (
                <span
                  style={{
                    backgroundColor: selectedTab === 'expansions' ? '#FFFFFF' : '#D97706',
                    color: selectedTab === 'expansions' ? '#D97706' : '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}
                >
                  {expansions.filter((e) => e.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* Search Box + Grid/List Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <input
                type="text"
                placeholder="بحث في الخدمات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Grid / List View Toggle */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="عرض شبكي"
                style={{
                  border: 'none',
                  background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'grid' ? '#0D3C5C' : '#64748B',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="عرض قائمة"
                style={{
                  border: 'none',
                  background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'list' ? '#0D3C5C' : '#64748B',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. Content Body ────────────────────────────────────────── */}
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid #E2E8F0',
                  borderTopColor: '#005D9C',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ fontWeight: '600', fontSize: '15px' }}>جاري تحميل الخدمات...</p>
            </div>
          ) : selectedTab === 'expansions' ? (
            /* Expansions Tab: Pending & Reviewed Expansion Requests */
            <div>
              {expansions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFBEB',
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0D3C5C', marginBottom: '8px' }}>
                    لا توجد طلبات اعتماد خدمات حالياً
                  </h3>
                  <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px', lineHeight: '1.6' }}>
                    عند قيامك بإضافة خدمة تقع خارج تخصصك الأساسي، ستظهر هنا لمتابعة حالة اعتمادها من قبل إدارة المنصة.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    style={{
                      backgroundColor: '#0D3C5C',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    + إضافة خدمة خارج التخصص
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {expansions.map((req) => {
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';
                    const isRejected = req.status === 'rejected';

                    return (
                      <div
                        key={req.id}
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '12px',
                          border: `1px solid ${isPending ? '#FDE68A' : isApproved ? '#86EFAC' : '#FECACA'}`,
                          padding: '18px 22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              backgroundColor: isPending ? '#FEF3C7' : isApproved ? '#DCFCE7' : '#FEE2E2',
                              color: isPending ? '#D97706' : isApproved ? '#16A34A' : '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {isPending ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            ) : isApproved ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0D3C5C' }}>
                                {req.service_name}
                              </h4>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: isPending ? '#FEF3C7' : isApproved ? '#DCFCE7' : '#FEE2E2',
                                  color: isPending ? '#B45309' : isApproved ? '#15803D' : '#991B1B'
                                }}
                              >
                                {isPending ? 'قيد المراجعة والاعتماد' : isApproved ? 'تمت الموافقة والاعتماد' : 'تم الرفض'}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                              {req.service_description || 'طلب تقديم خدمة استشارية خارج التخصص الأساسي'}
                            </p>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>
                              <span>التخصص المطلوب: <strong style={{ color: '#475569' }}>{getSpecializationName(req.requested_specialization_id)}</strong></span>
                              <span>تاريخ التقديم: <strong style={{ color: '#475569' }}>{new Date(req.created_at).toLocaleDateString('ar-SA')}</strong></span>
                            </div>
                            {isRejected && req.rejection_reason && (
                              <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#FEF2F2', borderRadius: '6px', fontSize: '12px', color: '#991B1B' }}>
                                <strong>سبب الرفض: </strong> {req.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : filteredServices.length === 0 ? (
            /* Empty State for Services */
            <div style={{ textAlign: 'center', padding: '56px 20px', color: '#64748B' }}>
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
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', marginBottom: '8px' }}>
                {searchQuery ? 'لم يتم العثور على خدمات مطابقة للبحث' : 'لم تقم بإضافة أي خدمات بعد'}
              </h3>
              <p style={{ fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px', lineHeight: '1.6' }}>
                {searchQuery
                  ? 'جرب البحث بكلمات أخرى أو مسح نص البحث.'
                  : 'ابدأ بإضافة باقات وخدمات استشاراتك لتظهر في بروفايلك ويتمكن العملاء من حجز الجلسات مباشرة.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  style={{
                    backgroundColor: '#0D3C5C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '11px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  + إضافة أول خدمة لك الآن
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ── Grid View of Cards (Matches Screenshot) ─────────────── */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
              }}
            >
              {filteredServices.map((service) => {
                const isToggling = toggleLoadingId === service.id;

                return (
                  <div
                    key={service.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      border: '1px solid #E2E8F0',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: '0 2px 8px rgba(13, 60, 92, 0.04)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 60, 92, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 60, 92, 0.04)';
                    }}
                  >
                    <div>
                      {/* Top Row: Toggle Switch on Left, Icon + Title on Right */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '14px'
                        }}
                      >
                        {/* Toggle Switch */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleService(service.id, service.is_active)}
                            title={service.is_active ? 'إيقاف التفعيل' : 'تفعيل الخدمة'}
                            style={{
                              width: '42px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: service.is_active ? '#0D3C5C' : '#CBD5E1',
                              border: 'none',
                              cursor: isToggling ? 'not-allowed' : 'pointer',
                              position: 'relative',
                              transition: 'all 0.25s',
                              padding: 0,
                              outline: 'none',
                              opacity: isToggling ? 0.6 : 1
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
                                transition: 'all 0.25s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                              }}
                            />
                          </button>
                        </div>

                        {/* Title & Gold Icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'right' }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', lineHeight: '1.3' }}>
                            {service.name}
                          </span>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#FEF3C7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#D97706',
                              flexShrink: 0
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <rect x="2" y="7" width="20" height="14" rx="2" />
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#64748B',
                          lineHeight: '1.6',
                          minHeight: '42px',
                          margin: '0 0 16px 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {service.description || 'جلسة استشارية متخصصة ومباشرة لمناقشة كافة التفاصيل.'}
                      </p>

                      {/* Duration & Price Box */}
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px',
                          border: '1px solid #F1F5F9'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>المدة: <strong>{service.duration_minutes || 60} دقيقة</strong></span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#005D9C' }}>
                          {Number(service.price).toLocaleString('ar-SA')} <span style={{ fontSize: '12px', fontWeight: '600' }}>ر.س</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Status Badge + Action Icons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid #F1F5F9'
                      }}
                    >
                      {/* Status Badge */}
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: service.is_active ? '#ECFDF5' : '#F1F5F9',
                          color: service.is_active ? '#059669' : '#64748B'
                        }}
                      >
                        {service.is_active ? 'نشط' : 'غير نشط'}
                      </span>

                      {/* Action Icons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(service)}
                          title="تعديل الخدمة"
                          style={{
                            border: 'none',
                            background: '#F1F5F9',
                            color: '#475569',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#E2E8F0';
                            e.currentTarget.style.color = '#005D9C';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F1F5F9';
                            e.currentTarget.style.color = '#475569';
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Copy / Share Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(service)}
                          title="مشاركة رابط الخدمة"
                          style={{
                            border: 'none',
                            background: '#F1F5F9',
                            color: '#475569',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#E2E8F0';
                            e.currentTarget.style.color = '#005D9C';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F1F5F9';
                            e.currentTarget.style.color = '#475569';
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteModalService(service)}
                          title="حذف الخدمة"
                          style={{
                            border: 'none',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#FEE2E2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FEF2F2';
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            /* ── List View ────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#FEF3C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#D97706',
                        flexShrink: 0
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#0D3C5C' }}>
                        {service.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                        {service.description || 'جلسة استشارية متخصصة ومباشرة.'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'left', minWidth: '110px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#005D9C' }}>
                        {Number(service.price).toLocaleString('ar-SA')} ر.س
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        المدة: {service.duration_minutes || 60} دقيقة
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: service.is_active ? '#ECFDF5' : '#F1F5F9',
                        color: service.is_active ? '#059669' : '#64748B'
                      }}
                    >
                      {service.is_active ? 'نشط' : 'غير نشط'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleService(service.id, service.is_active)}
                        style={{
                          border: 'none',
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {service.is_active ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(service)}
                        style={{
                          border: 'none',
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModalService(service)}
                        style={{
                          border: 'none',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Modal: Add / Edit Service (Matches Modal Screenshot) ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
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
              maxWidth: '560px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              animation: 'modalPop 0.25s ease-out'
            }}
          >
            <style>{`@keyframes modalPop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0D3C5C' }}>
                {editingService ? 'تعديل الخدمة الاستشارية' : 'إضافة خدمة جديدة'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '20px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Field 1: Service Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    عنوان الخدمة <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: استشارة ضريبية عاجلة / مراجعة الإقرار"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Field 2: Specialization (Only when creating new service) */}
                {!editingService && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      مجال / تخصص الخدمة <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={formData.specialization_id}
                      onChange={(e) => setFormData({ ...formData, specialization_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    >
                      {specializations.map((spec) => {
                        const isMain = profile && Number(profile.specialization_id) === Number(spec.id);
                        return (
                          <option key={spec.id} value={spec.id}>
                            {spec.name} {isMain ? '(تخصصك الأساسي المعتمد)' : '(يتطلب موافقة الإدارة)'}
                          </option>
                        );
                      })}
                    </select>

                    {/* Alert Banner when Out-of-Specialization is chosen */}
                    {isOutOfSpecialization && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '12px 14px',
                          backgroundColor: '#FFFBEB',
                          borderRadius: '8px',
                          border: '1px solid #FDE68A',
                          color: '#92400E',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
                        <div>
                          <strong>تنبيه موافقة الإدارة:</strong> هذا التخصص يقع خارج تخصصك المعتمد حالياً. سيتم إرسال طلب اعتماد الخدمة إلى إدارة المنصة ليتم مراجعته والموافقة عليه قبل طرحه للعملاء.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Out-of-Specialization Proof Link / Document */}
                {!editingService && isOutOfSpecialization && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      رابط وثيقة / شهادة إثبات الخبرة (اختياري)
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... أو رابط السيرة الذاتية والشهادة"
                      value={formData.proof_document_url}
                      onChange={(e) => setFormData({ ...formData, proof_document_url: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                {/* Field 3: Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    وصف الخدمة
                  </label>
                  <textarea
                    rows={3}
                    placeholder="اشرح ما تتضمنه هذه الاستشارة وما سيحصل عليه العميل بالتفصيل..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Field 4 & 5: Duration & Price Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Duration Chips */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      مدة الجلسة (بالدقائق)
                    </label>
                    <select
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value={30}>30 دقيقة (نصف ساعة)</option>
                      <option value={45}>45 دقيقة</option>
                      <option value={60}>60 دقيقة (ساعة كاملة)</option>
                      <option value={90}>90 دقيقة (ساعة ونصف)</option>
                      <option value={120}>120 دقيقة (ساعتان)</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      السعر (ر.س) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      placeholder="مثال: 350"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '28px',
                  paddingTop: '16px',
                  borderTop: '1px solid #F1F5F9'
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '11px 20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: isOutOfSpecialization && !editingService ? '#D97706' : '#0D3C5C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '11px 24px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
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
                  {editingService
                    ? 'حفظ التعديلات'
                    : isOutOfSpecialization
                    ? 'إرسال للاعتماد من الإدارة'
                    : 'إضافة الخدمة ونشرها'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. Modal: Delete Confirmation ───────────────────────────── */}
      {deleteModalService && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 8px' }}>
              تأكيد حذف الخدمة
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: '0 0 24px' }}>
              هل أنت متأكد من رغبتك في حذف خدمة <strong>"{deleteModalService.name}"</strong>؟ لن يتمكن العملاء من حجز هذه الخدمة بعد حذفها.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
