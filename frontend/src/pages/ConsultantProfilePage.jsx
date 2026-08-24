import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';

export default function ConsultantProfilePage({ navigate }) {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  
  // Form fields
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('50');
  const [yearsOfExperience, setYearsOfExperience] = useState('10');
  const [specializations, setSpecializations] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch profile and service data on load
  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        setInitialLoading(true);
        const [profileData, servicesData] = await Promise.all([
          consultantService.getMyProfile(token).catch(() => null),
          consultantService.getMyServices(token).catch(() => [])
        ]);

        if (profileData) {
          setProfile(profileData);
          setBio(profileData.bio || '');
          setYearsOfExperience(profileData.years_of_experience ? String(profileData.years_of_experience) : '10');
        }

        if (servicesData && servicesData.length > 0) {
          setServices(servicesData);
          const activeServices = servicesData.filter(s => s.is_active);
          
          // Set hourly rate from the first active service price
          if (activeServices.length > 0) {
            setHourlyRate(String(Math.round(activeServices[0].price)));
            
            // Map active service names to comma-separated specializations
            const serviceNames = activeServices.map(s => s.name).join('، ');
            setSpecializations(serviceNames);
          }
        }
      } catch (err) {
        console.error('Error loading consultant profile:', err);
        setError('فشل تحميل بيانات الملف الشخصي. يرجى المحاولة مرة أخرى.');
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // 1. Update Profile (Bio, Years of Experience)
      const updatedProfile = await consultantService.updateMyProfile({
        bio: bio.trim(),
        years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
        main_specialization_id: profile?.main_specialization_id
      }, token);

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      // 2. Parse specializations entered in input (handling both Arabic and English commas)
      const enteredNames = specializations
        .split(/,|،/)
        .map(name => name.trim())
        .filter(Boolean);

      const price = parseFloat(hourlyRate) || 0;

      // Match current active services with entered names
      const activeServices = services.filter(s => s.is_active);
      const servicesToDeactivate = activeServices.filter(s => !enteredNames.includes(s.name));
      const servicesToUpdate = activeServices.filter(s => enteredNames.includes(s.name));
      const namesToCreate = enteredNames.filter(name => !activeServices.some(s => s.name === name));

      // A. Deactivate services that were removed from the input list
      for (const service of servicesToDeactivate) {
        await consultantService.toggleService(service.id, token).catch(err => {
          console.error(`Failed to deactivate service ${service.name}:`, err);
        });
      }

      // B. Update prices of existing services
      for (const service of servicesToUpdate) {
        if (Math.round(service.price) !== Math.round(price)) {
          await consultantService.updateService(service.id, {
            name: service.name,
            price: price,
            duration_minutes: 60
          }, token).catch(err => {
            console.error(`Failed to update service ${service.name}:`, err);
          });
        }
      }

      // C. Create new services for new names
      for (const name of namesToCreate) {
        // If there was an inactive service with this name, toggle it back on and update its price
        const inactiveMatch = services.find(s => !s.is_active && s.name === name);
        if (inactiveMatch) {
          await consultantService.toggleService(inactiveMatch.id, token).catch(err => {
            console.error(`Failed to activate service ${name}:`, err);
          });
          await consultantService.updateService(inactiveMatch.id, {
            name: name,
            price: price,
            duration_minutes: 60
          }, token).catch(err => {
            console.error(`Failed to update activated service ${name}:`, err);
          });
        } else {
          // Otherwise, create a brand new service
          await consultantService.addService({
            name: name,
            price: price,
            duration_minutes: 60,
            specialization_id: profile?.main_specialization_id || 4 // Fallback to tech or main specialization
          }, token).catch(err => {
            console.error(`Failed to create service ${name}:`, err);
          });
        }
      }

      // Refetch services to update the state
      const freshServices = await consultantService.getMyServices(token).catch(() => []);
      setServices(freshServices);

      setMessage('تم حفظ التغييرات بنجاح!');
    } catch (err) {
      console.error('Error saving profile changes:', err);
      setError(err.message || 'حدث خطأ أثناء حفظ التغييرات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#005D9C', fontWeight: '700' }}>
        جاري تحميل بيانات الملف الشخصي...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', direction: 'rtl', textAlign: 'right' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/consultant/dashboard')} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          border: 'none', 
          background: 'none', 
          color: '#64748B', 
          cursor: 'pointer', 
          fontSize: '14px', 
          fontWeight: '700', 
          marginBottom: '16px',
          padding: 0
        }}
      >
        <span style={{ fontSize: '18px' }}>→</span>
        <span>رجوع</span>
      </button>

      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
        <div style={{ 
          width: '54px', 
          height: '54px', 
          borderRadius: '16px', 
          background: 'rgba(245, 165, 42, 0.1)', 
          color: '#F5A52A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Custom profile user icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#003C62', margin: 0 }}>الملف الشخصي</h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>حدّث بياناتك لتظهر للعملاء.</p>
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingRight: '70px' }}>
        <span style={{
          background: '#003C62',
          color: '#FFFFFF',
          padding: '4px 14px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '700'
        }}>
          الحالة: {profile?.verification_status || 'approved'}
        </span>
      </div>

      {/* Alerts */}
      {message && (
        <div style={{ 
          background: '#E5EFF5', 
          color: '#005D9C', 
          padding: '14px 18px', 
          borderRadius: '12px', 
          marginBottom: '20px', 
          fontSize: '13px', 
          fontWeight: '700', 
          border: '1px solid #BAE6FD' 
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#FEE2E2', 
          color: '#991B1B', 
          padding: '14px 18px', 
          borderRadius: '12px', 
          marginBottom: '20px', 
          fontSize: '13px', 
          fontWeight: '700', 
          border: '1px solid #FCA5A5' 
        }}>
          {error}
        </div>
      )}

      {/* Main Profile Form Card */}
      <div style={{ 
        background: '#FFFFFF', 
        padding: '32px', 
        borderRadius: '20px', 
        border: '1px solid #E2E8F0', 
        boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)' 
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Bio Description */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '8px' }}>
              نبذة مهنية
            </label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              rows={5} 
              placeholder="اكتب نبذة مختصرة عن خبرتك ومؤهلاتك المهنية..."
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                border: '1px solid #CBD5E1', 
                fontSize: '13px', 
                lineHeight: '1.6', 
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#005D9C'}
              onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
            />
          </div>

          {/* Two Columns: Hourly Rate & Years of Experience */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '8px' }}>
                الأجر بالساعة (د.أ)
              </label>
              <input 
                type="number" 
                value={hourlyRate} 
                onChange={(e) => setHourlyRate(e.target.value)} 
                min="0"
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #CBD5E1', 
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#005D9C'}
                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '8px' }}>
                سنوات الخبرة
              </label>
              <input 
                type="number" 
                value={yearsOfExperience} 
                onChange={(e) => setYearsOfExperience(e.target.value)} 
                min="0"
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #CBD5E1', 
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#005D9C'}
                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
              />
            </div>
          </div>

          {/* Specializations / Service Names list */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', display: 'block', marginBottom: '8px' }}>
              التخصصات (افصل بفاصلة)
            </label>
            <input 
              type="text" 
              value={specializations} 
              onChange={(e) => setSpecializations(e.target.value)} 
              placeholder="مثال: ضريبة دخل، امتثال ضريبي، تدقيق"
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                border: '1px solid #CBD5E1', 
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#005D9C'}
              onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                background: '#003C62', 
                color: '#FFFFFF', 
                border: 'none', 
                padding: '12px 28px', 
                borderRadius: '25px', 
                fontWeight: '700', 
                fontSize: '14px', 
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0, 60, 98, 0.2)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.background = '#002F52'}
              onMouseLeave={(e) => e.target.style.background = '#003C62'}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
