import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';

export default function ConsultantDashboard({ navigate }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { toast, showToast } = useToast();

  const handleNavigate = (path) => {
    if (typeof navigate === 'function') {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [walletData, apptsData, profileData] = await Promise.all([
        consultantService.getWallet(token).catch(() => null),
        consultantService.getIncomingAppointments(token).catch(() => []),
        consultantService.getMyProfile(token).catch(() => null)
      ]);

      setWallet(walletData);
      setAppointments(apptsData || []);
      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching consultant dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleApprove = async (apptId) => {
    if (!token) return;
    setActionLoadingId(apptId);
    try {
      await consultantService.approveAppointment(apptId, token);
      await fetchDashboardData();
      showToast('تم قبول طلب الاستشارة بنجاح!');
    } catch (err) {
      showToast(err.message || 'فشلت عملية الموافقة على الطلب', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (apptId) => {
    if (!token) return;
    const reason = prompt("يرجى إدخال سبب الرفض:");
    if (reason === null) return; // cancelled
    
    setActionLoadingId(apptId);
    try {
      await consultantService.rejectAppointment(apptId, reason || "تم الرفض من قبل المستشار", token);
      await fetchDashboardData();
      showToast('تم رفض طلب الاستشارة.');
    } catch (err) {
      showToast(err.message || 'فشلت عملية رفض الطلب', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center', color: '#005D9C' }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(0, 93, 156, 0.1)',
          borderTop: '4px solid #005D9C',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p style={{ fontWeight: '600', fontSize: '16px' }}>جاري تحميل لوحة تشغيل المستشار والبيانات المالية...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Calculate stats
  const pendingCount = appointments.filter(a => a.status === 'pending_approval').length;
  const incomingCount = appointments.length;
  const scheduledCount = appointments.filter(a => a.status === 'confirmed').length;

  // Profile readiness checklist
  const hasBio = !!profile?.bio;
  const hasSpecialization = !!profile?.main_specialization_id;
  const hasPrice = (profile?.services && profile.services.length > 0) || true; // Mock check or assume true
  const hasExperience = !!profile?.years_of_experience;

  let checklistScore = 0;
  if (hasBio) checklistScore += 25;
  if (hasSpecialization) checklistScore += 25;
  if (hasPrice) checklistScore += 25;
  if (hasExperience) checklistScore += 25;

  // Filter today's appointments (mock or filter logic)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => {
    if (!a.scheduled_at) return false;
    return a.scheduled_at.startsWith(todayStr) && a.status === 'confirmed';
  });

  return (
    <div className="consultant-dashboard-container fade-in" style={{ direction: 'rtl', fontFamily: 'sans-serif' }}>
      
      <Toast {...toast} />

      {/* 1. Header Greeting Card (Full Width at the Top) */}
      <div className="consultant-header-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '24px 32px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Right side (Brand & Info block) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Orange square with i icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#F5A52A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '32px',
            fontWeight: '900',
            fontFamily: 'serif'
          }}>
            i
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#F5A52A', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Professional Advisor Studio
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C', margin: '4px 0 6px' }}>
              لوحة تشغيل المستشار
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
              إدارة يومك المهني، طلبات، تقويم، توفر، عملاء، وأرباح بدون خلطها بلوحة المستخدم.
            </p>
          </div>
        </div>

        {/* Left side (Action & Verification Status) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#10B981',
            backgroundColor: '#ECFDF5',
            padding: '3px 10px',
            borderRadius: '20px',
            border: '1px solid #A7F3D0',
            alignSelf: 'flex-start'
          }}>
            معتمد
          </span>
          <button 
            onClick={() => handleNavigate('/consultant/sessions')}
            style={{
              backgroundColor: '#F5A52A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 12px rgba(245, 165, 42, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E0921B'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F5A52A'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            فتح الجلسات والتوفر
          </button>
        </div>
      </div>

      {/* 2. Main Layout (Left column + Right area in exact screen positions) */}
      <div className="consultant-main-grid">
        
        {/* RIGHT AREA (Spans 1fr - placed FIRST in JSX so it renders on the RIGHT in RTL) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minWidth: 0 }}>
          
          {/* Row 1: Integrated Earnings Card + Profile Readiness Card side-by-side */}
          {/* Swapped order: Earnings is first (RIGHT side in RTL), Readiness is second (LEFT/CENTER side in RTL) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Earnings & Withdrawal Integrated Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Right block: Earnings Text */}
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '8px' }}>
                    صافي أرباح الشهر
                  </span>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: '#0D3C5C', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    {wallet?.total_earned !== undefined ? Number(wallet.total_earned).toLocaleString() : '0'}
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#F5A52A' }}> د.أ</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginTop: '4px' }}>
                    بعد عمولة المنصة 15%
                  </span>
                </div>

                {/* Left block: Withdrawal nested card */}
                <div style={{
                  backgroundColor: '#FDFBF7',
                  border: '1px dashed #F5A52A',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'center',
                  minWidth: '120px'
                }}>
                  <div style={{ color: '#F5A52A', fontSize: '22px' }}>
                    📥
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>قابل للسحب</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C' }}>
                    {wallet?.available_balance !== undefined ? Number(wallet.available_balance).toLocaleString() : '0'} د.أ
                  </span>
                </div>
              </div>

              {/* Middle block: Mini Bar Chart (7 orange horizontal bars) */}
              <div style={{ display: 'flex', gap: '8px', margin: '24px 0 16px' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((bar, idx) => (
                  <div key={idx} style={{
                    flex: 1,
                    height: '6px',
                    backgroundColor: '#F5A52A',
                    borderRadius: '3px',
                    opacity: idx === 6 ? 0.3 : 1
                  }}></div>
                ))}
              </div>

              {/* Bottom block: Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleNavigate('/consultant/earnings')}
                  style={{
                    backgroundColor: '#FFF8F0',
                    border: '1px solid #FFE4C4',
                    color: '#D27D2D',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FFEEDD'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FFF8F0'}
                >
                  الأرباح والمسحوبات
                </button>
              </div>
            </div>

            {/* Profile Readiness Checklist Card */}
            <div className="dashboard-card" style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748B' }}>جاهزية الملف</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#F5A52A' }}>{checklistScore}%</span>
                </div>
                
                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: `${checklistScore}%`,
                    height: '100%',
                    backgroundColor: '#005D9C',
                    borderRadius: '4px',
                    transition: 'width 0.4s'
                  }}></div>
                </div>

                {/* Checklist rows */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { label: 'السيرة المهنية', checked: hasBio },
                    { label: 'التخصصات', checked: hasSpecialization },
                    { label: 'سعر الجلسة', checked: hasPrice },
                    { label: 'سنوات الخبرة', checked: hasExperience }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      fontSize: '13px'
                    }}>
                      <span style={{ color: '#1E293B', fontWeight: '600' }}>{item.label}</span>
                      <span style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: item.checked ? '#ECFDF5' : '#FFF1F2',
                        border: `1px solid ${item.checked ? '#10B981' : '#F43F5E'}`,
                        color: item.checked ? '#10B981' : '#F43F5E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {item.checked ? '✓' : '×'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleNavigate('/consultant/profile')}
                style={{
                  width: '100%',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#0D3C5C',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              >
                👤 تحديث الملف
              </button>
            </div>
          </div>

          {/* Row 2: 3 Stats Counts Cards side-by-side */}
          {/* Swapped order from RTL perspective: Pending reply is first (RIGHT), Incoming total is second (MIDDLE), Scheduled is third (LEFT) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {/* Card 1: Pending reply (Right-most in RTL) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 10px rgba(13, 60, 92, 0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>طلبات بانتظار الرد</span>
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#0D3C5C' }}>{pendingCount}</span>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#FFF0D9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F5A52A'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            </div>

            {/* Card 2: Incoming total (Middle in RTL) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 10px rgba(13, 60, 92, 0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>طلبات واردة</span>
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#0D3C5C' }}>{incomingCount}</span>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#FFF0D9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F5A52A'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
            </div>

            {/* Card 3: Confirmed Scheduled (Left-most in RTL) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 10px rgba(13, 60, 92, 0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>جلسات مجدولة</span>
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#0D3C5C' }}>{scheduledCount}</span>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#FFF0D9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F5A52A'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Row 3: Incoming Bookings requests */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
                طلبات الحجز الواردة
              </h3>
              <button 
                onClick={() => handleNavigate('/consultant/sessions')}
                style={{
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  color: '#475569',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                إدارة الكل
              </button>
            </div>

            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📂</span>
                <p style={{ fontSize: '14px', fontWeight: '600' }}>لا توجد طلبات حجز جديدة حالياً.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {appointments.map((appt) => {
                  const dateVal = appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
                  const timeVal = appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
                  
                  return (
                    <div key={appt.id} style={{
                      padding: '16px 20px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '20px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                        {/* Orange Clock Icon on the right */}
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: '#FFF0D9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#F5A52A',
                          flexShrink: 0
                        }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#3B82F6',
                              backgroundColor: '#EFF6FF',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              border: '1px solid #DBEAFE'
                            }}>
                              pending
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#64748B',
                              backgroundColor: '#F1F5F9',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {appt.price !== undefined ? `${appt.price} د.أ` : 'مجانية'}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#1E293B', margin: 0, lineHeight: '1.6', fontWeight: '600' }}>
                            الموعد المفضل: {dateVal} الساعة {timeVal} القناة: فيديو المستشار المطلوب: {appt.service?.name || 'استشارة ضريبية'} - {appt.user?.full_name}
                          </p>
                        </div>
                      </div>

                      {appt.status === 'pending_approval' && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleReject(appt.id)}
                            disabled={actionLoadingId === appt.id}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              color: '#64748B',
                              padding: '8px 20px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                          >
                            رفض
                          </button>
                          
                          <button
                            onClick={() => handleApprove(appt.id)}
                            disabled={actionLoadingId === appt.id}
                            style={{
                              backgroundColor: '#10B981',
                              border: 'none',
                              color: '#FFFFFF',
                              padding: '8px 24px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: '0 4px 8px rgba(16, 185, 129, 0.15)'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#10B981'; }}
                          >
                            {actionLoadingId === appt.id ? 'جاري...' : 'قبول'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* LEFT COLUMN (Spans 300px - placed SECOND in JSX so it renders on the LEFT in RTL) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '300px' }}>
          
          {/* Quick Actions Panel */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', marginTop: 0, marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              إجراءات سريعة
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { title: 'الجلسات والتوفر', sub: 'قبول ورفض وإدارة التوفر', icon: '📅', path: '/consultant/sessions' },
                { title: 'ملفات العملاء', sub: 'سجل، مستندات، ملاحظات', icon: '👥', path: '/consultant/clients' },
                { title: 'الملف المهني', sub: 'سيرة، أسعار، تخصصات', icon: '👤', path: '/consultant/profile' },
                { title: 'الأرباح', sub: 'رصيد، عمولات، مسحوبات', icon: '💳', path: '/consultant/earnings' }
              ].map((act, i) => (
                <button 
                  key={i}
                  onClick={() => handleNavigate(act.path)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'transform 0.15s, background-color 0.15s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{act.icon}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', display: 'block' }}>{act.title}</span>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>{act.sub}</span>
                    </div>
                  </div>
                  <span style={{ color: '#94A3B8', fontSize: '16px' }}>←</span>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Agenda Panel */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', marginTop: 0, marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              أجندة اليوم
            </h3>
            
            {todayAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748B' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📭</span>
                <span style={{ fontSize: '13px' }}>لا توجد جلسات اليوم.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todayAppointments.map((appt) => {
                  const time = appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={appt.id} style={{
                      padding: '12px',
                      backgroundColor: 'rgba(0, 93, 156, 0.03)',
                      borderRadius: '8px',
                      borderLeft: '4px solid #005D9C'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0D3C5C' }}>
                        {appt.service?.name || 'جلسة استشارية'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                        مع: {appt.user?.full_name}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#005D9C', marginTop: '4px', textAlign: 'left' }}>
                        🕒 {time}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
