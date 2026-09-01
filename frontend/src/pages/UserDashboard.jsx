import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { notificationService } from '../services/notificationService';
import { apiFetch } from '../services/api';

export default function UserDashboard({ navigate }) {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [laws, setLaws] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real backend data
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const [apptsData, cntData, notifsData, ticketsData, lawsData] = await Promise.all([
        appointmentService.getMyAppointments(token).catch(() => []),
        notificationService.getUnreadCount(token).catch(() => ({ unread_count: 0 })),
        notificationService.getMyNotifications(token).catch(() => []),
        apiFetch('/api/tickets/my?page=1&limit=10', {}, token).catch(() => []),
        apiFetch('/api/legal/laws', {}, token).catch(() => [])
      ]);
      
      setAppointments(Array.isArray(apptsData) ? apptsData : []);
      setUnreadNotifs(cntData?.unread_count || 0);
      setNotifications(Array.isArray(notifsData) ? notifsData : []);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setLaws(Array.isArray(lawsData) ? lawsData : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const displayName = user?.full_name || 'المستفيد';

  // Dynamic Profile Completeness Calculation
  const calculateProfileProgress = () => {
    if (!user) return 50;
    let score = 0;
    let total = 5;
    if (user.full_name) score++;
    if (user.email) score++;
    if (user.phone || user.phone_number) score++;
    if (user.role) score++;
    if (user.is_active || user.email_verified) score++;
    return Math.round((score / total) * 100);
  };

  // Dynamic Calculations
  const completedAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'finished').length;
  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'pending');
  const appointmentProgress = appointments.length > 0 ? Math.round((completedAppointments / appointments.length) * 100) : 0;

  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const ticketProgress = tickets.length > 0 ? Math.round((resolvedTickets / tickets.length) * 100) : 100;

  const getAlertTime = (notif, index) => {
    if (!notif.created_at) return index === 0 ? 'منذ ساعة' : 'اليوم';
    const diffMs = new Date() - new Date(notif.created_at);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `منذ ${Math.max(1, diffMins)} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return new Date(notif.created_at).toLocaleDateString('ar-EG');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
        color: '#0D3C5C',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #E2E8F0',
          borderTopColor: '#0D3C5C',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '15px', fontWeight: '700' }}>جاري تحميل لوحة التحكم والبيانات الضريبية...</span>
      </div>
    );
  }

  const profilePct = calculateProfileProgress();

  return (
    <div style={{
      direction: 'rtl',
      textAlign: 'right',
      fontFamily: "'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif",
      color: '#1E293B',
      paddingBottom: '40px',
      maxWidth: '1280px',
      margin: '0 auto'
    }}>
      
      {/* 1. Header Welcome Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px -2px rgba(13, 60, 92, 0.04)',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{
              color: '#0D3C5C',
              fontSize: '12px',
              fontWeight: '800',
              backgroundColor: '#E5EFF5',
              padding: '4px 14px',
              borderRadius: '20px',
              display: 'inline-block',
              marginBottom: '8px'
            }}>
              لوحة التحكم الرئيسية
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C', margin: '4px 0 6px 0', lineHeight: '1.3' }}>
              مرحباً {displayName}
            </h1>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0, fontWeight: '500' }}>
              متابعة مباشرة لاستشاراتك الضريبية ومستجدات القوانين والتشريعات المعتمدة.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/ai-assistant')}
              style={{
                backgroundColor: '#F5A52A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 165, 42, 0.25)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#E0921E'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#F5A52A'}
            >
              المساعد الضريبي الذكي
            </button>

            <button
              onClick={() => navigate('/consultants')}
              style={{
                backgroundColor: '#0D3C5C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(13, 60, 92, 0.25)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0A2E47'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0D3C5C'}
            >
              حجز استشارة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Right Column: AI Assistant Launcher Banner, Official Tax Regulations, Upcoming Consultations, Quick Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Assistant Direct Launcher Banner */}
          <div style={{
            backgroundColor: '#0D3C5C',
            borderRadius: '20px',
            padding: '24px 28px',
            color: '#FFFFFF',
            boxShadow: '0 6px 24px -4px rgba(13, 60, 92, 0.2)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            background: 'linear-gradient(135deg, #0D3C5C 0%, #155582 100%)'
          }}>
            <div style={{ maxWidth: '480px' }}>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#F5A52A',
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '10px',
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                المساعد الذكي (ديوان AI)
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: '#FFFFFF' }}>
                استشر الذكاء الاصطناعي الضريبي فوراً
              </h2>
              <p style={{ fontSize: '12px', color: '#E2E8F0', margin: 0, lineHeight: '1.6' }}>
                احصل على تحليل فوري للتشريعات ومخاطر القرارات الضريبية وإتاحة إرفاق المستندات في الشات المخصص.
              </p>
            </div>

            <button
              onClick={() => navigate('/ai-assistant')}
              style={{
                backgroundColor: '#F5A52A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                marginRight: 'auto'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#E0921E'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#F5A52A'}
            >
              فتح محادثة AI جديدة
            </button>
          </div>

          {/* Official Tax Regulations & Updates Section */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 4px 20px -2px rgba(13, 60, 92, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 4px 0' }}>
                  أحدث التحديثات والتشريعات الضريبية
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>التشريعات والقرارات التنفيذية المعتمدة رسمياً</span>
              </div>
              <button
                onClick={() => navigate('/regulations')}
                style={{ background: 'none', border: 'none', color: '#0D3C5C', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                مكتبة التشريعات الكاملة
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {laws.length > 0 ? (
                laws.slice(0, 3).map((law, idx) => (
                  <div key={law.id || idx} style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#0D3C5C', backgroundColor: '#E5EFF5', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '6px' }}>
                        قانون رقم {law.number || law.law_number || ''} لسنة {law.year || law.law_year || ''}
                      </span>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', margin: '0 0 4px 0' }}>
                        {law.title || law.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                        ساري من تاريخ: {law.effective_from || law.created_at ? new Date(law.effective_from || law.created_at).toLocaleDateString('ar-EG') : 'معتمد'}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate('/regulations')}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#0D3C5C',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      عرض النص
                    </button>
                  </div>
                ))
              ) : (
                /* Static Default Official Tax Decrees if Database table is empty */
                <>
                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #F1F5F9'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0D3C5C', backgroundColor: '#E5EFF5', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '6px' }}>
                      قانون ضريبة الدخل رقم 34 لسنة 2014 وتعديلاته
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', margin: '0 0 4px 0' }}>
                      قانون ضريبة الدخل الأردني الموحد
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                      يحدد نسب الاقتطاع والمصاريف المقبولة ضريبياً والإعفاءات المتاحة للأفراد والشركات.
                    </p>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #F1F5F9'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '6px' }}>
                      تعليمات رقم 4 لسنة 2024
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', margin: '0 0 4px 0' }}>
                      تعليمات اقتطاع ضريبة الدخل من الموردين والخدمات
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                      ضوابط توريد المبالغ المقتطعة والإفصاح عن الدفعات الخاضعة للضريبة عند المصدر.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upcoming Consultations Widget */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 4px 20px -2px rgba(13, 60, 92, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>مواعيدك واستشاراتك القادمة</h3>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                style={{ background: 'none', border: 'none', color: '#0D3C5C', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                عرض الكل ({appointments.length})
              </button>
            </div>

            {upcomingAppointments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingAppointments.slice(0, 3).map((appt) => (
                  <div key={appt.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #F1F5F9'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 4px 0' }}>
                        {appt.consultant_name || 'استشارة ضريبية'}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        {appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString('ar-EG') : 'موعد قادم'} • {appt.appointment_time || ''}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/chat?apptId=${appt.id}`)}
                      style={{
                        backgroundColor: '#0D3C5C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      دخول الشات
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '14px',
                border: '1px dashed #CBD5E1'
              }}>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px 0' }}>لا توجد استشارات قادمة حالياً.</p>
                <button
                  onClick={() => navigate('/consultants')}
                  style={{
                    backgroundColor: '#F5A52A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  احجز استشارة الآن
                </button>
              </div>
            )}
          </div>

          {/* Quick Tools Grid */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', marginBottom: '16px' }}>الأدوات والخدمات السريعة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
              {[
                { title: 'حجز استشارة', path: '/consultants', bg: '#EFF6FF', color: '#2563EB' },
                { title: 'استشارة سريعة', path: '/quick-consultation', bg: '#FFFBEB', color: '#D97706' },
                { title: 'المساعد الذكي', path: '/ai-assistant', bg: '#F0FDF4', color: '#16A34A' },
                { title: 'التشريعات والقوانين', path: '/regulations', bg: '#F5F3FF', color: '#7C3AED' },
                { title: 'تذاكر الدعم', path: '/support/tickets', bg: '#FEF2F2', color: '#DC2626' },
                { title: 'إعدادات الحساب', path: '/settings', bg: '#F8FAFC', color: '#475569' }
              ].map((tool, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(tool.path)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '18px 12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = tool.color;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                  }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: tool.color,
                    margin: '0 auto 10px auto'
                  }} />
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{tool.title}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Left Column: Dynamic Progress Bars & Real Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Profile & Dynamic Progress Bars Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 4px 20px -2px rgba(13, 60, 92, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>ملخص ملفك ونسبة الإنجاز</h3>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#D97706', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: '12px' }}>
                {profilePct}%
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' }}>
              مؤشرات إكمال البيانات والاستشارات والتذاكر المسجلة باسمك:
            </p>

            {/* Real Progress Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Progress 1: Profile Completeness */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  <span>اكتمال بيانات الملف</span>
                  <span>{profilePct}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${profilePct}%`, height: '100%', backgroundColor: '#0D3C5C', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Progress 2: Consultations Completed */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  <span>الاستشارات المكتملة</span>
                  <span>{completedAppointments} من {appointments.length} ({appointmentProgress}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${appointmentProgress}%`, height: '100%', backgroundColor: '#10B981', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Progress 3: Support Tickets Resolved */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  <span>تذاكر الدعم المحلولة</span>
                  <span>{resolvedTickets} من {tickets.length} ({ticketProgress}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${ticketProgress}%`, height: '100%', backgroundColor: '#F5A52A', borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
              </div>

            </div>

            {/* Numeric Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '22px', paddingTop: '18px', borderTop: '1px solid #F1F5F9' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0D3C5C', display: 'block' }}>{appointments.length}</span>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>استشارة</span>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0D3C5C', display: 'block' }}>{tickets.length}</span>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>تذكرة دعم</span>
              </div>
            </div>
          </div>

          {/* Real Notifications Widget */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 4px 20px -2px rgba(13, 60, 92, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>تنبيهاتك المباشرة</h3>
              </div>
              {unreadNotifs > 0 && (
                <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
                  {unreadNotifs} غير مقروء
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((notif, idx) => (
                  <div
                    key={notif.id || idx}
                    style={{
                      borderBottom: idx < Math.min(notifications.length, 4) - 1 ? '1px solid #F1F5F9' : 'none',
                      paddingBottom: idx < Math.min(notifications.length, 4) - 1 ? '12px' : '0'
                    }}
                  >
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#334155', margin: '0 0 3px 0' }}>
                      {notif.title || 'تنبيه من المنصة'}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 3px 0', lineHeight: '1.4' }}>
                      {notif.content || notif.message}
                    </p>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{getAlertTime(notif, idx)}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: '#94A3B8', fontSize: '12px' }}>
                  لا توجد تنبيهات جديدة.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
