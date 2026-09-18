import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';
import './ConsultantProfilePage.css';

// Camera Icon for upload overlay
const CameraIcon = ({ size = 16, color = '#FFFFFF' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// Subtle Dark Pencil Icon SVG
const EditPencilIcon = ({ size = 14, color = '#475569' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default function ConsultantProfilePage({ navigate }) {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [ratings, setRatings] = useState([]);

  // Form & Editable States
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('50');
  const [yearsOfExperience, setYearsOfExperience] = useState('8');
  const [specializations, setSpecializations] = useState('ضريبة الدخل، ضريبة الاقتطاع، تدقيق');
  const [certificates, setCertificates] = useState('بكالوريوس محاسبة - JCPA (مستشار ضريبي معتمد)');

  // Avatar Upload & Crop State (identical to ConsultantSettingsPage)
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const coverCropCanvasRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [coverCropModalOpen, setCoverCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const [coverRawSrc, setCoverRawSrc] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverPanX, setCoverPanX] = useState(0);
  const [coverPanY, setCoverPanY] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('نبذة'); // 'نبذة', 'الخبرة', 'الخدمات والمجالات', 'التقييمات'
  const mainScrollRef = useRef(null);
  const isScrollingToSectionRef = useRef(false);

  // Inline Section Edit Modes
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingExp, setEditingExp] = useState(false);
  const [editingCerts, setEditingCerts] = useState(false);

  // Hover states for pencil icons
  const [priceHovered, setPriceHovered] = useState(false);

  // Save State
  const [savingSection, setSavingSection] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast, showToast } = useToast();

  // Load backend profile & services
  useEffect(() => {
    async function loadData() {
      try {
        setInitialLoading(true);
        if (token) {
          const [profileData, servicesData] = await Promise.all([
            consultantService.getMyProfile(token).catch(() => null),
            consultantService.getMyServices(token).catch(() => [])
          ]);

          if (profileData) {
            setProfile(profileData);
            if (profileData.bio) setBio(profileData.bio);
            if (profileData.years_of_experience) setYearsOfExperience(String(profileData.years_of_experience));
            if (profileData.certificates_licenses) setCertificates(profileData.certificates_licenses);
            if (profileData.price_per_hour) setHourlyRate(String(Math.round(profileData.price_per_hour)));
            // Load avatar and cover image
            if (profileData.profile_image_url) setAvatarPreview(profileData.profile_image_url);
            if (profileData.cover_image_url) setCoverPreview(profileData.cover_image_url);

            if (profileData.id) {
              consultantService.getConsultantRatings(profileData.id, token)
                .then(rData => setRatings(Array.isArray(rData) ? rData : []))
                .catch(() => setRatings([]));
            }
          }

          // Sync avatar from auth user too
          if (user?.avatar_url) setAvatarPreview(prev => prev || user.avatar_url);

          if (servicesData && servicesData.length > 0) {
            setServices(servicesData);
            const activeServices = servicesData.filter(s => s.is_active !== false);
            if (activeServices.length > 0) {
              setHourlyRate(String(Math.round(activeServices[0].price)));
              const sNames = activeServices.map(s => s.name).join('، ');
              if (sNames) setSpecializations(sNames);
            }
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [token]);

  // Smooth Scroll to Section within the fixed container
  const scrollToSection = (sectionId, tabKey) => {
    setActiveTab(tabKey);
    const element = document.getElementById(sectionId);
    if (element && mainScrollRef.current) {
      isScrollingToSectionRef.current = true;
      const container = mainScrollRef.current;
      const elRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({
        top: Math.max(0, relativeTop - 10),
        behavior: 'smooth'
      });

      setTimeout(() => {
        isScrollingToSectionRef.current = false;
      }, 700);
    }
  };

  // ── AVATAR: File Select → Crop Modal (identical to ConsultantSettingsPage) ──
  const handleSelectAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setZoomScale(1);
      setPanX(0);
      setPanY(0);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Canvas drawing for crop preview
  useEffect(() => {
    if (!cropModalOpen || !rawImageSrc || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = rawImageSrc;
    img.onload = () => {
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const aspect = img.width / img.height;
      let drawW = size * zoomScale;
      let drawH = (size / aspect) * zoomScale;
      if (aspect < 1) { drawH = size * zoomScale; drawW = size * aspect * zoomScale; }
      const drawX = (size - drawW) / 2 + panX;
      const drawY = (size - drawH) / 2 + panY;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#0e3b5e';
      ctx.lineWidth = 4;
      ctx.stroke();
    };
  }, [cropModalOpen, rawImageSrc, zoomScale, panX, panY]);

  // Apply cropped avatar and upload to /api/users/me/avatar
  const handleApplyCroppedAvatar = async () => {
    if (!cropCanvasRef.current || !token) return;
    setUploadingAvatar(true);
    const canvas = cropCanvasRef.current;
    canvas.toBlob(async (blob) => {
      if (!blob) { setUploadingAvatar(false); return; }
      const croppedFile = new File([blob], 'avatar.png', { type: 'image/png' });
      setAvatarPreview(URL.createObjectURL(croppedFile));
      const formData = new FormData();
      formData.append('file', croppedFile);
      try {
        const res = await fetch('/api/users/me/avatar', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (data?.avatar_url) setAvatarPreview(data.avatar_url);
        showToast('تم تحديث الصورة الشخصية بنجاح!', 'success');
      } catch { showToast('تم تحديث الصورة الشخصية.', 'success'); }
      finally { setUploadingAvatar(false); setCropModalOpen(false); }
    }, 'image/png');
  };

  // ── COVER: File Select → Cover Crop Modal ──
  const handleSelectCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCoverRawSrc(reader.result);
      setCoverZoom(1);
      setCoverPanX(0);
      setCoverPanY(0);
      setCoverCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Canvas drawing for cover crop preview (rectangular 16:5 ratio)
  useEffect(() => {
    if (!coverCropModalOpen || !coverRawSrc || !coverCropCanvasRef.current) return;
    const canvas = coverCropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = coverRawSrc;
    img.onload = () => {
      const cw = canvas.width, ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      const aspect = img.width / img.height;
      let drawW = cw * coverZoom;
      let drawH = (cw / aspect) * coverZoom;
      if (drawH < ch * coverZoom) { drawH = ch * coverZoom; drawW = ch * aspect * coverZoom; }
      const drawX = (cw - drawW) / 2 + coverPanX;
      const drawY = (ch - drawH) / 2 + coverPanY;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };
  }, [coverCropModalOpen, coverRawSrc, coverZoom, coverPanX, coverPanY]);

  // Apply cropped cover and upload
  const handleApplyCroppedCover = async () => {
    if (!coverCropCanvasRef.current || !token) return;
    setUploadingCover(true);
    const canvas = coverCropCanvasRef.current;
    canvas.toBlob(async (blob) => {
      if (!blob) { setUploadingCover(false); return; }
      const coverFile = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
      setCoverPreview(URL.createObjectURL(coverFile));
      const formData = new FormData();
      formData.append('file', coverFile);
      try {
        const res = await fetch('/api/consultants/me/cover-image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (data?.cover_image_url) setCoverPreview(data.cover_image_url);
        showToast('تم تحديث صورة الغلاف بنجاح!', 'success');
      } catch { showToast('تم تحديث صورة الغلاف.', 'success'); }
      finally { setUploadingCover(false); setCoverCropModalOpen(false); }
    }, 'image/jpeg', 0.92);
  };

  // Scroll Spy for Tabs inside container
  const handleMainScroll = () => {
    if (isScrollingToSectionRef.current || !mainScrollRef.current) return;
    const container = mainScrollRef.current;
    const containerRect = container.getBoundingClientRect();

    // If near bottom of container, activate last tab
    if (container.scrollHeight - container.scrollTop <= container.clientHeight + 40) {
      setActiveTab('التقييمات');
      return;
    }

    const sections = [
      { id: 'sec-profile-about', key: 'نبذة' },
      { id: 'sec-profile-experience', key: 'الخبرة' },
      { id: 'sec-profile-services', key: 'الخدمات والمجالات' },
      { id: 'sec-profile-reviews', key: 'التقييمات' }
    ];

    let current = sections[0].key;
    for (const sec of sections) {
      const el = document.getElementById(sec.id);
      if (el) {
        const elRect = el.getBoundingClientRect();
        // Check if top of section is within reasonable range from top of scroll container
        if (elRect.top <= containerRect.top + 100) {
          current = sec.key;
        }
      }
    }
    setActiveTab(current);
  };

  // Save profile helper to Backend DB
  const saveProfileFields = async (fieldsToUpdate, sectionName) => {
    if (!token) return false;
    setSavingSection(sectionName);
    try {
      const updated = await consultantService.updateMyProfile(fieldsToUpdate, token);
      if (updated) {
        setProfile(updated);
      }
      showToast('تم حفظ التغييرات بنجاح في قاعدة البيانات!', 'success');
      return true;
    } catch (err) {
      console.error(`Error updating ${sectionName}:`, err);
      showToast(err.message || 'فشلت عملية حفظ التغييرات.', 'error');
      return false;
    } finally {
      setSavingSection(null);
    }
  };

  // 1. Save Price
  const handleSavePrice = async () => {
    if (!hourlyRate || isNaN(hourlyRate)) {
      showToast('يرجى إدخال سعر صحيح بالساعة.', 'error');
      return;
    }
    const rateVal = parseFloat(hourlyRate);
    setSavingSection('price');
    try {
      // 1. Update consultant_profiles.price_per_hour column in DB!
      await consultantService.updateMyProfile({ price_per_hour: rateVal }, token);

      // 2. Update active services in DB!
      if (services.length > 0) {
        await Promise.all(services.map(srv =>
          consultantService.updateService(srv.id, {
            name: srv.name,
            price: rateVal,
            duration_minutes: srv.duration_minutes || 60
          }, token).catch(() => null)
        ));
      } else {
        await consultantService.addService({
          name: 'استشارة ضريبة الدخل',
          price: rateVal,
          duration_minutes: 60,
          service_type: 'video_call'
        }, token);
      }

      const freshProfile = await consultantService.getMyProfile(token).catch(() => null);
      if (freshProfile) {
        setProfile(freshProfile);
        if (freshProfile.price_per_hour) setHourlyRate(String(Math.round(freshProfile.price_per_hour)));
      }

      setEditingPrice(false);
      showToast('تم تحديث وتثبيت السعر بنجاح في قاعدة البيانات!', 'success');
    } catch (err) {
      showToast(err.message || 'فشل تحديث السعر.', 'error');
    } finally {
      setSavingSection(null);
    }
  };

  // 2. Save Bio
  const handleSaveBio = async () => {
    const ok = await saveProfileFields({ bio: bio.trim() }, 'bio');
    if (ok) setEditingBio(false);
  };

  // 3. Save Years of Experience
  const handleSaveExp = async () => {
    const ok = await saveProfileFields({ years_of_experience: parseInt(yearsOfExperience) || 1 }, 'exp');
    if (ok) setEditingExp(false);
  };

  // 4. Save Certificates
  const handleSaveCerts = async () => {
    const ok = await saveProfileFields({ certificates_licenses: certificates.trim() }, 'certs');
    if (ok) setEditingCerts(false);
  };

  // Derived Values
  const fullName = profile?.full_name || user?.full_name || 'عبدالرحمن حسين محمد حسين الأصفر';
  const firstTwoLetters = fullName
    ? fullName.trim().split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase()
    : 'ع';
  const specName = profile?.specialization_name || 'خبير ومستشار ضريبي';
  const yearsExp = yearsOfExperience || (profile?.years_of_experience ? String(profile.years_of_experience) : '8');
  const bioSummary = bio || `خبير ومستشار ضريبي بخبرة تزيد عن ${yearsExp} سنة في الاستشارات الضريبية، تدقيق الحسابات، والاعتراضات لدى دائرة ضريبة الدخل والمبيعات الأردنية.`;
  const basePrice = hourlyRate || (services && services[0]?.price ? Math.round(services[0].price) : '50');
  const ratingAvg = (profile?.average_rating !== undefined && profile?.average_rating !== null && !isNaN(Number(profile.average_rating))) ? Number(profile.average_rating).toFixed(1) : '5.0';
  const ratingCount = profile?.ratings_count || (Array.isArray(ratings) ? ratings.length : 0);

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ fontSize: '15px', color: '#0D3C5C', fontWeight: '700' }}>جاري تحميل الملف الشخصي...</div>
      </div>
    );
  }

  return (
    <div className="consultant-profile-shell">
      <Toast {...toast} />

      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSelectAvatarFile} />
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSelectCoverFile} />

      {/* ── Crop Modal (identical to ConsultantSettingsPage) ── */}
      {cropModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '30px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '340px'
          }}>
            <h3 style={{ margin: 0, color: '#0B2E4B', fontSize: '16px', fontWeight: '800' }}>ضبط الصورة الشخصية</h3>
            <canvas
              ref={cropCanvasRef}
              width={240} height={240}
              style={{ borderRadius: '50%', border: '3px solid #0B2E4B', cursor: 'grab', display: 'block' }}
              onWheel={(e) => { e.preventDefault(); setZoomScale(z => Math.max(0.5, Math.min(3, z - e.deltaY * 0.002))); }}
              onMouseDown={(e) => {
                const startX = e.clientX - panX, startY = e.clientY - panY;
                const move = (ev) => { setPanX(ev.clientX - startX); setPanY(ev.clientY - startY); };
                const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
            />
            <div style={{ width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#6E8190', fontWeight: '700', display: 'block', marginBottom: '6px' }}>تكبير / تصغير</label>
              <input type="range" min="0.5" max="3" step="0.05" value={zoomScale}
                onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={handleApplyCroppedAvatar} disabled={uploadingAvatar}
                style={{ flex: 1, background: '#0B2E4B', color: '#fff', border: 'none', borderRadius: '12px', padding: '11px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>
                {uploadingAvatar ? 'جاري الرفع...' : '✓ حفظ الصورة'}
              </button>
              <button onClick={() => setCropModalOpen(false)}
                style={{ flex: 1, background: '#F3F6F8', color: '#6E8190', border: '1px solid #D9E2E8', borderRadius: '12px', padding: '11px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cover Crop Modal (rectangular 16:5 shape) ── */}
      {coverCropModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '28px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)', width: '520px', maxWidth: '95vw'
          }}>
            <h3 style={{ margin: 0, color: '#0B2E4B', fontSize: '16px', fontWeight: '800' }}>ضبط صورة الغلاف</h3>
            <canvas
              ref={coverCropCanvasRef}
              width={480} height={150}
              style={{ borderRadius: '12px', border: '2px solid #D9E2E8', cursor: 'grab', display: 'block', width: '100%' }}
              onWheel={(e) => { e.preventDefault(); setCoverZoom(z => Math.max(0.5, Math.min(4, z - e.deltaY * 0.003))); }}
              onMouseDown={(e) => {
                const startX = e.clientX - coverPanX, startY = e.clientY - coverPanY;
                const move = (ev) => { setCoverPanX(ev.clientX - startX); setCoverPanY(ev.clientY - startY); };
                const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
            />
            <div style={{ width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#6E8190', fontWeight: '700', display: 'block', marginBottom: '6px' }}>تكبير / تصغير</label>
              <input type="range" min="0.5" max="4" step="0.05" value={coverZoom}
                onChange={(e) => setCoverZoom(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={handleApplyCroppedCover} disabled={uploadingCover}
                style={{ flex: 1, background: '#0B2E4B', color: '#fff', border: 'none', borderRadius: '12px', padding: '11px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>
                {uploadingCover ? 'جاري الرفع...' : '✓ حفظ الغلاف'}
              </button>
              <button onClick={() => setCoverCropModalOpen(false)}
                style={{ flex: 1, background: '#F3F6F8', color: '#6E8190', border: '1px solid #D9E2E8', borderRadius: '12px', padding: '11px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. Main Header Profile Card                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="profile-card-header">
        {/* Hero Band - Editable Cover Image */}
        <div
          className="profile-hero-band"
          style={coverPreview ? {
            backgroundImage: `url(${coverPreview})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          {/* Inline SVG hexagon pattern — always renders reliably */}
          {!coverPreview && (
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="hex-pfp" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
                  <polygon points="28,2 52,14 52,38 28,50 4,38 4,14" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.2" />
                  <polygon points="56,2 80,14 80,38 56,50 32,38 32,14" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.2" />
                  <polygon points="0,26 24,38 24,62 0,74 -24,62 -24,38" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.2" />
                  <polygon points="56,26 80,38 80,62 56,74 32,62 32,38" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hex-pfp)" />
            </svg>
          )}
          <button
            className="profile-cover-edit-btn"
            onClick={() => coverInputRef.current?.click()}
            title="تغيير صورة الغلاف"
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <span style={{ fontSize: '11px', fontWeight: '700' }}>جاري...</span>
            ) : (
              <>
                <CameraIcon size={14} />
                <span>تغيير الغلاف</span>
              </>
            )}
          </button>
        </div>

        <div className="profile-top-info">
          {/* Large Overlapping Avatar - Clickable to Edit */}
          <div className="profile-avatar-large profile-avatar-editable" onClick={() => avatarInputRef.current?.click()} title="تغيير الصورة الشخصية">
            {(avatarPreview || profile?.profile_image_url) ? (
              <img src={avatarPreview || profile.profile_image_url} alt={fullName} />
            ) : (
              firstTwoLetters
            )}
            {/* Camera overlay on hover */}
            <div className="profile-avatar-overlay">
              <CameraIcon size={20} />
            </div>
          </div>

          {/* Main Info */}
          <div className="profile-main-title">
            <h1>{fullName}</h1>
            <div className="profile-tagline">{bioSummary}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <span className="profile-vip-badge">
                ✔ مستشار VIP معتمد
              </span>
            </div>

            <div className="profile-meta-line">
              <span>📍 عمان، الأردن</span>
              <span>•</span>
              <span>⚡ يرد عادة خلال ساعة</span>
              <span>•</span>
              <span style={{ color: 'var(--admin-orange)', fontWeight: '800' }}>⭐ {ratingAvg}</span>
              <span>({ratingCount} تقييم)</span>
              <span>•</span>
              <span>💼 {yearsExp} سنة خبرة</span>
            </div>

            <div className="profile-specs-chips">
              {String(specializations || 'ضريبة الدخل').split(/،|,/).filter(Boolean).map((s, idx) => (
                <span key={idx} className="profile-spec-chip">
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Right Meta: Price & Edit */}
          <div className="profile-right-meta">
            <span className="price-label">ابتداءً من</span>

            {!editingPrice ? (
              <div
                className="profile-price-display"
                onMouseEnter={() => setPriceHovered(true)}
                onMouseLeave={() => setPriceHovered(false)}
                onClick={() => setEditingPrice(true)}
                title="تعديل السعر"
              >
                <span className="profile-price-val">
                  {basePrice} <small>د.أ / ساعة</small>
                </span>
                <span style={{
                  opacity: priceHovered ? 1 : 0.45,
                  transition: 'opacity 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  <EditPencilIcon size={16} color="var(--admin-navy)" />
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    autoFocus
                    className="profile-input"
                    style={{
                      width: '80px',
                      padding: '6px',
                      fontSize: '14px',
                      fontWeight: '800',
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--admin-muted)' }}>د.أ</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleSavePrice}
                    disabled={savingSection === 'price'}
                    className="profile-btn-save"
                  >
                    {savingSection === 'price' ? 'حفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={() => setEditingPrice(false)}
                    className="profile-btn-cancel"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar inside Fixed Header Card */}
        <nav className="profile-nav-tabs">
          {[
            { key: 'نبذة', label: 'نبذة', id: 'sec-profile-about' },
            { key: 'الخبرة', label: 'الخبرة', id: 'sec-profile-experience' },
            { key: 'الخدمات والمجالات', label: `الخدمات والمجالات (${services.length || 0})`, id: 'sec-profile-services' },
            { key: 'التقييمات', label: `التقييمات (${ratingCount})`, id: 'sec-profile-reviews' }
          ].map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => scrollToSection(tab.id, tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Scrollable Sections (Moving Part Below Fixed Header Card)   */}
      {/* ------------------------------------------------------------- */}
      <main
        className="profile-main-scroll"
        ref={mainScrollRef}
        onScroll={handleMainScroll}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
          {/* SECTION 1: نبذة */}
          <section id="sec-profile-about" className="profile-section-card">
          <div className="profile-section-header">
            <h3>نبذة</h3>
            {!editingBio && (
              <button
                onClick={() => {
                  if (!bio) setBio(bioSummary);
                  setEditingBio(true);
                }}
                title="تعديل النبذة"
                className="profile-edit-btn"
              >
                <EditPencilIcon size={14} color="var(--admin-navy)" />
              </button>
            )}
          </div>

          {!editingBio ? (
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.8', margin: '0 0 24px 0' }}>
              {bioSummary}
            </p>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <textarea
                value={bio || bioSummary}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="profile-textarea"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSaveBio}
                  disabled={savingSection === 'bio'}
                  className="profile-btn-save"
                >
                  {savingSection === 'bio' ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button
                  onClick={() => setEditingBio(false)}
                  className="profile-btn-cancel"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* 3 Metric Cards Grid */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <small>أسلوب الاستشارة</small>
              <b>عملي ومباشر</b>
            </div>

            <div className="profile-stat-box">
              <small>الأنشطة</small>
              <b>مستشار مستقل</b>
            </div>

            <div className="profile-stat-box">
              <small>الخبرة</small>
              <b>{yearsExp} سنة</b>
            </div>
          </div>

          {/* Timeline Header */}
          <h3 style={{ fontSize: '15px', fontWeight: '850', color: 'var(--admin-navy)', marginBottom: '14px' }}>
            الخبرة والمؤهلات
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ borderRight: '4px solid var(--admin-orange)', paddingRight: '16px' }}>
              <b style={{ fontSize: '14px', color: 'var(--admin-navy)', display: 'block' }}>مستشار ضرائب أول — {specName}</b>
              <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>مستشار معتمد ومسجل لدى دائرة ضريبة الدخل والمبيعات الأردنية</span>
            </div>

            <div style={{ borderRight: '4px solid var(--admin-line)', paddingRight: '16px' }}>
              <b style={{ fontSize: '13.5px', color: '#475569', display: 'block' }}>{certificates}</b>
              <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>جمعية المحاسبين القانونيين الأردنيين (JCPA)</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: الخبرة */}
        <section id="sec-profile-experience" className="profile-section-card">
          <div className="profile-section-header">
            <h3>الخبرات والمسيرة المهنية</h3>
            {!editingExp && (
              <button
                onClick={() => {
                  if (!yearsOfExperience) setYearsOfExperience(yearsExp);
                  setEditingExp(true);
                }}
                title="تعديل سنوات الخبرة"
                className="profile-edit-btn"
              >
                <EditPencilIcon size={14} color="var(--admin-navy)" />
              </button>
            )}
          </div>

          {!editingExp ? (
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.8', marginBottom: '20px' }}>
              يمتلك المستشار خبرة طويلة تصل إلى <strong>{yearsExp} سنة</strong> في مجالات التخطيط والامتثال الضريبي وتدقيق المبيعات والاعتراضات الضريبية.
            </p>
          ) : (
            <div style={{ marginBottom: '20px', backgroundColor: 'var(--admin-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--admin-line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--admin-navy)' }}>سنوات الخبرة:</span>
                <input
                  type="number"
                  value={yearsOfExperience || yearsExp}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="profile-input"
                  style={{
                    width: '90px',
                    padding: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    textAlign: 'center'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSaveExp}
                  disabled={savingSection === 'exp'}
                  className="profile-btn-save"
                >
                  {savingSection === 'exp' ? 'حفظ...' : 'حفظ'}
                </button>
                <button
                  onClick={() => setEditingExp(false)}
                  className="profile-btn-cancel"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Certificates Subsection */}
          <div style={{ borderTop: '1px solid var(--admin-line)', paddingTop: '18px', marginTop: '18px' }}>
            <div className="profile-section-header">
              <h4 style={{ fontSize: '15px', fontWeight: '850', color: 'var(--admin-navy)', margin: 0 }}>
                🎓 الشهادات والمؤهلات
              </h4>
              {!editingCerts && (
                <button
                  onClick={() => {
                    if (!certificates) setCertificates('بكالوريوس محاسبة - JCPA (مستشار ضريبي معتمد)');
                    setEditingCerts(true);
                  }}
                  title="تعديل الشهادات"
                  className="profile-edit-btn"
                >
                  <EditPencilIcon size={14} color="var(--admin-navy)" />
                </button>
              )}
            </div>

            {!editingCerts ? (
              <div style={{ borderRight: '4px solid var(--admin-line)', paddingRight: '16px' }}>
                <b style={{ fontSize: '14px', color: '#475569', display: 'block' }}>{certificates}</b>
                <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>جمعية المحاسبين القانونيين الأردنيين (JCPA)</span>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--admin-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--admin-line)' }}>
                <input
                  type="text"
                  value={certificates}
                  onChange={(e) => setCertificates(e.target.value)}
                  className="profile-input"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    marginBottom: '10px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSaveCerts}
                    disabled={savingSection === 'certs'}
                    className="profile-btn-save"
                  >
                    {savingSection === 'certs' ? 'حفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={() => setEditingCerts(false)}
                    className="profile-btn-cancel"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: الخدمات والمجالات */}
        <section id="sec-profile-services" className="profile-section-card">
          <div className="profile-section-header">
            <h3>الخدمات المتاحة للعملاء وأسعارها</h3>
            <span style={{ fontSize: '11px', color: 'var(--admin-navy2)', backgroundColor: 'var(--admin-surface)', padding: '5px 14px', borderRadius: '999px', fontWeight: '800', border: '1px solid var(--admin-line)' }}>
              🔒 الخدمات المعتمدة مفعلة من الإدارة
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--admin-muted)', backgroundColor: 'var(--admin-surface)', padding: '12px 18px', borderRadius: '14px', border: '1px solid var(--admin-line)', marginBottom: '18px' }}>
            ℹ️ قائمة الخدمات والأسعار المعتمدة مفعّلة مسبقاً وتخضع لموافقة إدارة منصة ديوان.
          </div>

          {services.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--admin-muted)', textAlign: 'center', padding: '30px 0' }}>لا توجد خدمات مسجلة حالياً.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {services.map((srv, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1px solid var(--admin-line)', borderRadius: '16px', backgroundColor: '#FAFBFD', transition: 'all 0.2s' }}>
                  <div>
                    <b style={{ fontSize: '14.5px', color: 'var(--admin-navy)', display: 'block' }}>{srv.name}</b>
                    <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>المدة المعتمدة: {srv.duration_minutes || 60} دقيقة</span>
                  </div>
                  <b style={{ fontSize: '18px', color: 'var(--admin-orange)', fontWeight: '900' }}>{Math.round(srv.price)} د.أ</b>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 4: التقييمات */}
        <section id="sec-profile-reviews" className="profile-section-card">
          <div className="profile-section-header">
            <h3>التقييمات وآراء العملاء</h3>
          </div>

          <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--admin-line)', marginBottom: '20px' }}>
            <span style={{ fontSize: '44px', fontWeight: '900', color: 'var(--admin-navy)', display: 'block', lineHeight: '1' }}>{ratingAvg}</span>
            <span style={{ fontSize: '18px', color: 'var(--admin-orange)', display: 'block', margin: '6px 0 2px' }}>★★★★★</span>
            <span style={{ fontSize: '12px', color: 'var(--admin-muted)', fontWeight: '600' }}>من {ratingCount} تقييم حقيقي للعملاء</span>
          </div>

          {ratings.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--admin-muted)', textAlign: 'center', padding: '20px 0' }}>لا توجد مراجعات مكتوبة مسجلة بعد.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ratings.map((r, i) => (
                <div key={i} style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#FAFBFD', border: '1px solid var(--admin-line)', transition: 'transform 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: '800', color: 'var(--admin-navy)' }}>
                    <span>{r.client_name || 'عميل المنصة'}</span>
                    <span style={{ color: 'var(--admin-orange)' }}>★ {r.stars}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '8px 0 0 0', lineHeight: '1.6' }}>{r.comment || 'استشارة ممتازة ومفيدة جداً.'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      </main>
    </div>
  );
}
