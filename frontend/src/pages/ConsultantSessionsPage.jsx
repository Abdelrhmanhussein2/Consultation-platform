import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import Toast, { useToast } from '../components/Toast/Toast';
import VideoSessionModal from '../components/VideoSession/VideoSessionModal';

export default function ConsultantSessionsPage({ navigate }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [activeVideoApptId, setActiveVideoApptId] = useState(null);
  const [savingAvail, setSavingAvail] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { toast, showToast } = useToast();

  // Grid constants
  const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  
  // 0 = Monday, 6 = Sunday. Order in screenshot from right to left is Sunday (6), Monday (0), Tuesday (1), Wednesday (2), Thursday (3), Friday (4), Saturday (5)
  const weekdays = [
    { label: 'أحد', value: 6 },
    { label: 'اثنين', value: 0 },
    { label: 'ثلاثاء', value: 1 },
    { label: 'أربعاء', value: 2 },
    { label: 'خميس', value: 3 },
    { label: 'جمعة', value: 4 },
    { label: 'سبت', value: 5 }
  ];

  const fetchPageData = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const [apptsData, availData] = await Promise.all([
        consultantService.getIncomingAppointments(token).catch(() => []),
        consultantService.getAvailabilities(token).catch(() => [])
      ]);
      setAppointments(apptsData || []);
      setAvailability(availData || []);
    } catch (err) {
      console.error("Error fetching sessions page data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [token]);

  // Check if a specific slot is enabled in availability state
  const isSlotActive = (dayValue, timeStr) => {
    return availability.some(
      (avail) => avail && avail.day_of_week === dayValue && typeof avail.start_time === 'string' && avail.start_time.startsWith(timeStr) && avail.is_active
    );
  };

  // Toggle slot active state in local memory
  const handleToggleSlot = (dayValue, timeStr) => {
    const isActive = isSlotActive(dayValue, timeStr);
    if (isActive) {
      // Remove or set active=false
      setAvailability(prev => prev.map(avail => {
        if (avail.day_of_week === dayValue && avail.start_time.startsWith(timeStr)) {
          return { ...avail, is_active: false };
        }
        return avail;
      }).filter(avail => !(avail.day_of_week === dayValue && avail.start_time.startsWith(timeStr) && !avail.id))); // remove unsaved toggles
    } else {
      // Add new active slot
      setAvailability(prev => [
        ...prev,
        { day_of_week: dayValue, start_time: `${timeStr}:00`, is_active: true }
      ]);
    }
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    if (!token) return;
    setSavingAvail(true);
    try {
      // Format payload: only active slots
      const activeAvailabilities = availability
        .filter(avail => avail.is_active)
        .map(avail => ({
          day_of_week: avail.day_of_week,
          start_time: avail.start_time.substring(0, 5) // ensure HH:MM
        }));

      await consultantService.setAvailability(activeAvailabilities, token);
      showToast("تم حفظ أوقات التوفر بنجاح!");
      await fetchPageData(true); // silent refresh — don't show loading spinner
    } catch (err) {
      showToast(err.message || "فشل حفظ التغييرات", "error");
    } finally {
      setSavingAvail(false);
    }
  };

  const handleApprove = async (apptId) => {
    if (!token) return;
    setActionLoadingId(apptId);
    try {
      await consultantService.approveAppointment(apptId, token);
      await fetchPageData();
    } catch (err) {
      showToast(err.message || 'فشلت عملية قبول الجلسة', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (apptId) => {
    if (!token) return;
    const reason = prompt("يرجى إدخال سبب الرفض:");
    if (reason === null) return;
    setActionLoadingId(apptId);
    try {
      await consultantService.rejectAppointment(apptId, reason || "تم الرفض من قبل المستشار", token);
      await fetchPageData();
    } catch (err) {
      showToast(err.message || 'فشلت عملية رفض الجلسة', 'error');
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
        <p style={{ fontWeight: '600', fontSize: '16px' }}>جاري تحميل الجلسات وأوقات التوفر الخاصة بك...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Group appointments into sections
  const incomingRequests = appointments.filter(a => a.status === 'pending_approval' || a.status === 'pending_payment' || a.status === 'completed' || a.status === 'cancelled_by_user' || a.status === 'cancelled_by_consultant');
  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed');

  return (
    <div className="consultant-sessions-container fade-in" style={{ direction: 'rtl', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      <Toast {...toast} />

      {/* Back Button + Test Video Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/consultant/dashboard')}
          style={{
            backgroundColor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            color: '#475569',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>→</span> رجوع
        </button>

        <button
          onClick={() => setActiveVideoApptId('test-session-id')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            color: '#64748B',
            padding: '8px 18px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>⚙️</span>
          <span>تجربة غرفة الفيديو الآن</span>
        </button>
      </div>

      {/* Title Header Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: '#FFF0D9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F5A52A',
          fontSize: '22px'
        }}>
          📅
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
            الجلسات وأوقات التوفر
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
            حدد الأوقات التي يستطيع فيها العملاء حجز استشارة معك.
          </p>
        </div>
      </div>

      {/* SECTION 1: Weekly Availability Table Card */}
      <div className="dashboard-card" style={{
        backgroundColor: '#FFFFFF',
        padding: '24px 32px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
            أوقات التوفر الأسبوعية
          </h2>
          <button
            onClick={handleSaveChanges}
            disabled={savingAvail}
            style={{
              backgroundColor: '#F5A52A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(245, 165, 42, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => !savingAvail && (e.currentTarget.style.backgroundColor = '#E0921B')}
            onMouseOut={(e) => !savingAvail && (e.currentTarget.style.backgroundColor = '#F5A52A')}
          >
            💾 {savingAvail ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>

        {/* Availability Grid */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <th style={{ padding: '12px 8px', color: '#64748B', fontSize: '13px', fontWeight: '700' }}>الوقت</th>
                {weekdays.map(day => (
                  <th key={day.value} style={{ padding: '12px 8px', color: '#0D3C5C', fontSize: '13px', fontWeight: '700' }}>
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((timeStr) => (
                <tr key={timeStr} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {/* Time label column */}
                  <td style={{ padding: '12px 8px', fontSize: '12px', color: '#94A3B8', fontWeight: '700' }}>
                    {timeStr}
                  </td>
                  
                  {/* Weekday check-cells */}
                  {weekdays.map((day) => {
                    const active = isSlotActive(day.value, timeStr);
                    return (
                      <td key={day.value} style={{ padding: '10px 6px' }}>
                        <div
                          onClick={() => handleToggleSlot(day.value, timeStr)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            margin: '0 auto',
                            backgroundColor: active ? '#FFF8EE' : '#F1F5F9',
                            border: `1px solid ${active ? '#F5A52A' : '#E2E8F0'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            boxShadow: active ? '0 2px 6px rgba(245, 165, 42, 0.15)' : 'none'
                          }}
                          onMouseOver={(e) => {
                            if (!active) e.currentTarget.style.backgroundColor = '#E2E8F0';
                          }}
                          onMouseOut={(e) => {
                            if (!active) e.currentTarget.style.backgroundColor = '#F1F5F9';
                          }}
                        ></div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '16px', margin: '16px 0 0', textAlign: 'center' }}>
          * انقر على خانة لتفعيل/إلغاء التوفر في ذلك الوقت.
        </p>
      </div>

      {/* SECTION 2: Incoming Consultation Requests */}
      <div className="dashboard-card" style={{
        backgroundColor: '#FFFFFF',
        padding: '24px 32px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 20px' }}>
          طلبات الاستشارة الواردة
        </h2>

        {incomingRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📂</span>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>لا توجد طلبات استشارة جديدة حالياً.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {incomingRequests.map((appt) => {
              const dateVal = appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
              const timeVal = appt.scheduled_at ? new Date(appt.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
              
              const isPending = appt.status === 'pending_approval';
              const isAccepted = appt.status === 'pending_payment' || appt.status === 'confirmed' || appt.status === 'completed';

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
                  {/* Left part (Action buttons) */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => navigate(`/chat?apptId=${appt.id}`)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        color: '#64748B',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      مراسلة
                    </button>
                    
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleReject(appt.id)}
                          disabled={actionLoadingId === appt.id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            color: '#F43F5E',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          رفض
                        </button>
                        
                        <button
                          onClick={() => handleApprove(appt.id)}
                          disabled={actionLoadingId === appt.id}
                          style={{
                            backgroundColor: '#0D3C5C',
                            border: 'none',
                            color: '#FFFFFF',
                            padding: '7px 18px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {actionLoadingId === appt.id ? 'جاري...' : 'قبول'}
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        backgroundColor: '#F8FAFC'
                      }}>
                        accepted
                      </span>
                    )}
                  </div>

                  {/* Right part (Request Details) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px', justifyContent: 'flex-end', textAlign: 'left' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', justifyContent: 'flex-end' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: isPending ? '#3B82F6' : '#64748B',
                          backgroundColor: isPending ? '#EFF6FF' : '#F1F5F9',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: isPending ? '1px solid #DBEAFE' : 'none'
                        }}>
                          {appt.status === 'pending_approval' ? 'pending' : appt.status}
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
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', margin: '4px 0' }}>
                        {appt.client_name || appt.user?.full_name || appt.user_name || 'عميل'}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                        {appt.session_type === 'video_call' ? 'جلسة فيديو' : appt.session_type === 'audio_call' ? 'جلسة صوتية' : appt.session_type === 'text_chat' ? 'محادثة نصية' : 'استشارة'} • {dateVal} الساعة {timeVal}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Upcoming Appointments */}
      <div className="dashboard-card" style={{
        backgroundColor: '#FFFFFF',
        padding: '24px 32px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(13, 60, 92, 0.03)'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 20px' }}>
          المواعيد القادمة
        </h2>

        {upcomingAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📅</span>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>لا توجد جلسات مؤكدة قادمة حالياً.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {upcomingAppointments.map((appt) => {
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
                  {/* Left part (Enter Room + Chat Buttons) */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => setActiveVideoApptId(appt.id)}
                      style={{
                        backgroundColor: '#F5A52A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(245, 165, 42, 0.15)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E0921B'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F5A52A'}
                    >
                      دخول الفيديو
                    </button>
                    <button
                      onClick={() => navigate(`/chat?apptId=${appt.id}`)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#64748B',
                        borderRadius: '6px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      شات
                    </button>
                  </div>

                  {/* Right part (Appointment Info) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px', justifyContent: 'flex-end', textAlign: 'left' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', justifyContent: 'flex-end' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#047857',
                          backgroundColor: '#ECFDF5',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: '1px solid #A7F3D0'
                        }}>
                          confirmed
                        </span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', margin: '4px 0' }}>
                        {appt.client_name || appt.user?.full_name || appt.user_name || 'عميل'}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                        {appt.session_type === 'video_call' ? 'جلسة فيديو' : appt.session_type === 'audio_call' ? 'جلسة صوتية' : appt.session_type === 'text_chat' ? 'محادثة نصية' : 'استشارة'} • {dateVal} الساعة {timeVal}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Session Modal */}
      <VideoSessionModal
        appointmentId={activeVideoApptId}
        isOpen={!!activeVideoApptId}
        onClose={() => setActiveVideoApptId(null)}
        onSessionEnd={() => fetchPageData()}
      />

    </div>
  );
}
