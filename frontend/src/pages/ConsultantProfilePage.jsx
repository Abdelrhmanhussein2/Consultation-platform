import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';

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

  // Tab State
  const [activeTab, setActiveTab] = useState('نبذة'); // 'نبذة', 'الخبرة', 'الخدمات والمجالات', 'التقييمات'

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

            if (profileData.id) {
              consultantService.getConsultantRatings(profileData.id, token)
                .then(rData => setRatings(Array.isArray(rData) ? rData : []))
                .catch(() => setRatings([]));
            }
          }

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
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '60px' }}>
      <Toast {...toast} />

      {/* ------------------------------------------------------------- */}
      {/* 1. Main Header Profile Card */}
      {/* ------------------------------------------------------------- */}
      <div style={{ marginBottom: '24px' }}>
        {/* Navy Blue Cover */}
        <div style={{
          height: '100px',
          backgroundColor: '#0E3B5E',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px'
        }} />

        {/* White Base Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
          border: '1px solid #E2E8F0',
          borderTop: 'none',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Right Side: Square Dark Avatar & Info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: '1 1 500px' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '20px',
              backgroundColor: '#0E3B5E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '800',
              color: '#FFFFFF',
              position: 'absolute',
              top: '-45px',
              right: '32px',
              boxShadow: '0 4px 14px rgba(14, 59, 94, 0.25)',
              border: '4px solid #FFFFFF'
            }}>
              {firstTwoLetters}
            </div>

            <div style={{ paddingRight: '110px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', margin: '0 0 6px 0' }}>
                {fullName}
              </h1>

              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                {bioSummary}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#10B981',
                  backgroundColor: '#ECFDF5',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  border: '1px solid #A7F3D0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ✔ مستشار VIP معتمد
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#64748B', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span>📍 عمان، الأردن</span>
                <span>•</span>
                <span>⚡ يرد عادة خلال ساعة</span>
                <span>•</span>
                <span style={{ color: '#F5A52A', fontWeight: '700' }}>⭐ {ratingAvg}</span>
                <span>({ratingCount} تقييم)</span>
                <span>•</span>
                <span>💼 {yearsExp} سنة خبرة</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {String(specializations || 'ضريبة الدخل').split(/،|,/).filter(Boolean).map((s, idx) => (
                  <span key={idx} style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    backgroundColor: '#0E3B5E',
                    padding: '4px 14px',
                    borderRadius: '16px'
                  }}>
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Left Side: Hoverable Price Block with Pure Pencil Icon */}
          <div style={{ textAlign: 'left', minWidth: '160px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
              ابتداءً من
            </span>

            {!editingPrice ? (
              <div
                onMouseEnter={() => setPriceHovered(true)}
                onMouseLeave={() => setPriceHovered(false)}
                onClick={() => setEditingPrice(true)}
                title="تعديل السعر"
                style={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  backgroundColor: priceHovered ? '#F1F5F9' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
              >
                <span style={{ fontSize: '26px', fontWeight: '800', color: '#0E3B5E', lineHeight: '1' }}>
                  {basePrice} <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748B' }}>د.أ / ساعة</span>
                </span>
                <span style={{
                  opacity: priceHovered ? 1 : 0.35,
                  transition: 'opacity 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  <EditPencilIcon size={16} color="#0E3B5E" />
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
                    style={{
                      width: '80px',
                      padding: '6px',
                      borderRadius: '6px',
                      border: '1px solid #0E3B5E',
                      fontSize: '14px',
                      fontWeight: '700',
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>د.أ</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleSavePrice}
                    disabled={savingSection === 'price'}
                    style={{
                      background: '#0E3B5E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {savingSection === 'price' ? 'حفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={() => setEditingPrice(false)}
                    style={{
                      background: '#E2E8F0',
                      color: '#475569',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Navigation Pills Bar (Strictly 4 Clean Tabs) */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'نبذة', label: 'نبذة' },
          { key: 'الخبرة', label: 'الخبرة' },
          { key: 'الخدمات والمجالات', label: `الخدمات والمجالات (${services.length || 5})` },
          { key: 'التقييمات', label: `التقييمات (${ratingCount})` }
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                backgroundColor: isActive ? '#0E3B5E' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#475569',
                border: isActive ? '1px solid #0E3B5E' : '1px solid #E2E8F0',
                padding: '8px 24px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px rgba(14, 59, 94, 0.2)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Tab Contents Layout */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
        }}>
          {/* TAB 1: نبذة */}
          {activeTab === 'نبذة' && (
            <div>
              {/* Header with Pure Pencil Icon Button (No Text) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0E3B5E', margin: 0 }}>
                  نبذة
                </h3>
                {!editingBio && (
                  <button
                    onClick={() => {
                      if (!bio) setBio(bioSummary);
                      setEditingBio(true);
                    }}
                    title="تعديل النبذة"
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#475569',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <EditPencilIcon size={14} color="#475569" />
                  </button>
                )}
              </div>

              {!editingBio ? (
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', margin: '0 0 28px 0' }}>
                  {bioSummary}
                </p>
              ) : (
                <div style={{ marginBottom: '28px' }}>
                  <textarea
                    value={bio || bioSummary}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      fontFamily: 'Tajawal, sans-serif',
                      color: '#1E293B',
                      boxSizing: 'border-box',
                      marginBottom: '10px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleSaveBio}
                      disabled={savingSection === 'bio'}
                      style={{
                        background: '#0E3B5E',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '6px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {savingSection === 'bio' ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button
                      onClick={() => setEditingBio(false)}
                      style={{
                        background: '#E2E8F0',
                        color: '#475569',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* 3 Metric Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{
                  backgroundColor: '#FAFBFD',
                  border: '1px solid #F1F5F9',
                  borderRadius: '16px',
                  padding: '20px 16px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>أسلوب الاستشارة</span>
                  <b style={{ fontSize: '15px', color: '#0E3B5E' }}>عملي ومباشر</b>
                </div>

                <div style={{
                  backgroundColor: '#FAFBFD',
                  border: '1px solid #F1F5F9',
                  borderRadius: '16px',
                  padding: '20px 16px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>الأنشطة</span>
                  <b style={{ fontSize: '15px', color: '#0E3B5E' }}>مستشار مستقل</b>
                </div>

                <div style={{
                  backgroundColor: '#FAFBFD',
                  border: '1px solid #F1F5F9',
                  borderRadius: '16px',
                  padding: '20px 16px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>الخبرة</span>
                  <b style={{ fontSize: '15px', color: '#0E3B5E' }}>{yearsExp} سنة</b>
                </div>
              </div>

              {/* Timeline Header */}
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0E3B5E', marginBottom: '16px' }}>
                الخبرة والمؤهلات
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderRight: '4px solid #F5A52A', paddingRight: '16px' }}>
                  <b style={{ fontSize: '14px', color: '#0E3B5E', display: 'block' }}>مستشار ضرائب أول — {specName}</b>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>مستشار معتمد ومسجل لدى دائرة ضريبة الدخل والمبيعات الأردنية</span>
                </div>

                <div style={{ borderRight: '4px solid #CBD5E1', paddingRight: '16px' }}>
                  <b style={{ fontSize: '14px', color: '#475569', display: 'block' }}>{certificates}</b>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>جمعية المحاسبين القانونيين الأردنيين (JCPA)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: الخبرة */}
          {activeTab === 'الخبرة' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0E3B5E', margin: 0 }}>
                  الخبرات والمسيرة المهنية
                </h3>
                {!editingExp && (
                  <button
                    onClick={() => {
                      if (!yearsOfExperience) setYearsOfExperience(yearsExp);
                      setEditingExp(true);
                    }}
                    title="تعديل سنوات الخبرة"
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#475569',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <EditPencilIcon size={14} color="#475569" />
                  </button>
                )}
              </div>

              {!editingExp ? (
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', marginBottom: '24px' }}>
                  يمتلك المستشار خبرة طويلة تصل إلى <strong>{yearsExp} سنة</strong> في مجالات التخطيط والامتثال الضريبي وتدقيق المبيعات والاعتراضات الضريبية.
                </p>
              ) : (
                <div style={{ marginBottom: '24px', backgroundColor: '#FAFBFD', padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>سنوات الخبرة:</span>
                    <input
                      type="number"
                      value={yearsOfExperience || yearsExp}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      style={{
                        width: '90px',
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
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
                      style={{
                        background: '#0E3B5E',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {savingSection === 'exp' ? 'حفظ...' : 'حفظ'}
                    </button>
                    <button
                      onClick={() => setEditingExp(false)}
                      style={{
                        background: '#E2E8F0',
                        color: '#475569',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Certificates Section with Pure Pencil */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0E3B5E', margin: 0 }}>
                    🎓 الشهادات والمؤهلات
                  </h4>
                  {!editingCerts && (
                    <button
                      onClick={() => {
                        if (!certificates) setCertificates('بكالوريوس محاسبة - JCPA (مستشار ضريبي معتمد)');
                        setEditingCerts(true);
                      }}
                      title="تعديل الشهادات"
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        color: '#475569',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <EditPencilIcon size={14} color="#475569" />
                    </button>
                  )}
                </div>

                {!editingCerts ? (
                  <div style={{ borderRight: '4px solid #CBD5E1', paddingRight: '16px' }}>
                    <b style={{ fontSize: '14px', color: '#475569', display: 'block' }}>{certificates}</b>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>جمعية المحاسبين القانونيين الأردنيين (JCPA)</span>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#FAFBFD', padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                    <input
                      type="text"
                      value={certificates}
                      onChange={(e) => setCertificates(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        marginBottom: '10px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleSaveCerts}
                        disabled={savingSection === 'certs'}
                        style={{
                          background: '#0E3B5E',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {savingSection === 'certs' ? 'حفظ...' : 'حفظ'}
                      </button>
                      <button
                        onClick={() => setEditingCerts(false)}
                        style={{
                          background: '#E2E8F0',
                          color: '#475569',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: الخدمات والمجالات */}
          {activeTab === 'الخدمات والمجالات' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0E3B5E', margin: 0 }}>
                  الخدمات المتاحة للعملاء وأسعارها
                </h3>
                <span style={{ fontSize: '11px', color: '#005D9C', backgroundColor: '#E5EFF5', padding: '4px 12px', borderRadius: '12px', fontWeight: '700' }}>
                  🔒 الخدمات المعتمدة مفعلة من الإدارة
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                ℹ️ قائمة الخدمات والأسعار المعتمدة مفعّلة مسبقاً وتخضع لموافقة إدارة منصة ديوان.
              </div>

              {services.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '30px 0' }}>لا توجد خدمات مسجلة حالياً.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {services.map((srv, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1px solid #F1F5F9', borderRadius: '14px', backgroundColor: '#FAFBFD' }}>
                      <div>
                        <b style={{ fontSize: '14px', color: '#0E3B5E', display: 'block' }}>{srv.name}</b>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>المدة المعتمدة: {srv.duration_minutes || 60} دقيقة</span>
                      </div>
                      <b style={{ fontSize: '18px', color: '#F5A52A' }}>{Math.round(srv.price)} د.أ</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: التقييمات */}
          {activeTab === 'التقييمات' && (
            <div>
              <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid #F1F5F9', marginBottom: '24px' }}>
                <span style={{ fontSize: '46px', fontWeight: '800', color: '#0E3B5E', display: 'block' }}>{ratingAvg}</span>
                <span style={{ fontSize: '16px', color: '#F5A52A', display: 'block', margin: '4px 0' }}>★★★★★</span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>من {ratingCount} تقييم حقيقي للعملاء</span>
              </div>
              {ratings.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>لا توجد مراجعات مكتوبة مسجلة بعد.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ratings.map((r, i) => (
                    <div key={i} style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#FAFBFD', border: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#0E3B5E' }}>
                        <span>{r.client_name || 'عميل المنصة'}</span>
                        <span style={{ color: '#F5A52A' }}>★ {r.stars}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#475569', margin: '6px 0 0 0' }}>{r.comment || 'استشارة ممتازة ومفيدة جداً.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
