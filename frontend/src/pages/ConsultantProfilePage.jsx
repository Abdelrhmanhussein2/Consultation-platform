import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';
import './ConsultantProfilePage.css';

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
    <div className="consultant-profile-shell">
      <Toast {...toast} />

      {/* ------------------------------------------------------------- */}
      {/* 1. Main Header Profile Card (Matching Admin Profile Aesthetic) */}
      {/* ------------------------------------------------------------- */}
      <section className="profile-card-header">
        <div className="profile-hero-band"></div>

        <div className="profile-top-info">
          {/* Large Overlapping Avatar */}
          <div className="profile-avatar-large">
            {profile?.profile_image_url ? (
              <img src={profile.profile_image_url} alt={fullName} />
            ) : (
              firstTwoLetters
            )}
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

        {/* Navigation Tabs Bar */}
        <nav className="profile-nav-tabs">
          {[
            { key: 'نبذة', label: 'نبذة' },
            { key: 'الخبرة', label: 'الخبرة' },
            { key: 'الخدمات والمجالات', label: `الخدمات والمجالات (${services.length || 5})` },
            { key: 'التقييمات', label: `التقييمات (${ratingCount})` }
          ].map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. Tab Contents Layout */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="profile-section-card">
          {/* TAB 1: نبذة */}
          {activeTab === 'نبذة' && (
            <div>
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
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', margin: '0 0 28px 0' }}>
                  {bioSummary}
                </p>
              ) : (
                <div style={{ marginBottom: '28px' }}>
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
              <h3 style={{ fontSize: '16px', fontWeight: '850', color: 'var(--admin-navy)', marginBottom: '16px' }}>
                الخبرة والمؤهلات
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ borderRight: '4px solid var(--admin-orange)', paddingRight: '16px' }}>
                  <b style={{ fontSize: '14.5px', color: 'var(--admin-navy)', display: 'block' }}>مستشار ضرائب أول — {specName}</b>
                  <span style={{ fontSize: '12.5px', color: 'var(--admin-muted)' }}>مستشار معتمد ومسجل لدى دائرة ضريبة الدخل والمبيعات الأردنية</span>
                </div>

                <div style={{ borderRight: '4px solid var(--admin-line)', paddingRight: '16px' }}>
                  <b style={{ fontSize: '14px', color: '#475569', display: 'block' }}>{certificates}</b>
                  <span style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>جمعية المحاسبين القانونيين الأردنيين (JCPA)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: الخبرة */}
          {activeTab === 'الخبرة' && (
            <div>
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
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8', marginBottom: '24px' }}>
                  يمتلك المستشار خبرة طويلة تصل إلى <strong>{yearsExp} سنة</strong> في مجالات التخطيط والامتثال الضريبي وتدقيق المبيعات والاعتراضات الضريبية.
                </p>
              ) : (
                <div style={{ marginBottom: '24px', backgroundColor: 'var(--admin-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--admin-line)' }}>
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

              {/* Certificates Section */}
              <div style={{ borderTop: '1px solid var(--admin-line)', paddingTop: '20px', marginTop: '20px' }}>
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
            </div>
          )}

          {/* TAB 3: الخدمات والمجالات */}
          {activeTab === 'الخدمات والمجالات' && (
            <div>
              <div className="profile-section-header">
                <h3>الخدمات المتاحة للعملاء وأسعارها</h3>
                <span style={{ fontSize: '11px', color: 'var(--admin-navy2)', backgroundColor: 'var(--admin-surface)', padding: '5px 14px', borderRadius: '999px', fontWeight: '800', border: '1px solid var(--admin-line)' }}>
                  🔒 الخدمات المعتمدة مفعلة من الإدارة
                </span>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--admin-muted)', backgroundColor: 'var(--admin-surface)', padding: '12px 18px', borderRadius: '14px', border: '1px solid var(--admin-line)', marginBottom: '20px' }}>
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
            </div>
          )}

          {/* TAB 4: التقييمات */}
          {activeTab === 'التقييمات' && (
            <div>
              <div style={{ textAlign: 'center', padding: '24px 0', borderBottom: '1px solid var(--admin-line)', marginBottom: '24px' }}>
                <span style={{ fontSize: '48px', fontWeight: '900', color: 'var(--admin-navy)', display: 'block', lineHeight: '1' }}>{ratingAvg}</span>
                <span style={{ fontSize: '18px', color: 'var(--admin-orange)', display: 'block', margin: '6px 0 2px' }}>★★★★★</span>
                <span style={{ fontSize: '12.5px', color: 'var(--admin-muted)', fontWeight: '600' }}>من {ratingCount} تقييم حقيقي للعملاء</span>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
