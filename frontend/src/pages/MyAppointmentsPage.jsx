import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import VideoSessionModal from '../components/VideoSession/VideoSessionModal';
import PaymentModal from '../components/Consultants/PaymentModal';

export default function MyAppointmentsPage({ navigate }) {
  const { token, user } = useAuth();

  // States
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  const [loading, setLoading] = useState(true);
  const [activeVideoApptId, setActiveVideoApptId] = useState(null);
  const [payingAppt, setPayingAppt] = useState(null);

  // Rating & No-Show Complaint States
  const [ratingModalAppt, setRatingModalAppt] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingReason, setRatingReason] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchAppointments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let data = await appointmentService.getMyAppointments(token).catch(() => []);
      if (!Array.isArray(data) || data.length === 0) {
        const incoming = await consultantService.getIncomingAppointments(token).catch(() => []);
        if (Array.isArray(incoming) && incoming.length > 0) {
          data = incoming;
        }
      }
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token, user]);

  useEffect(() => {
    if (!loading) {
      const params = new URLSearchParams(window.location.search);
      const openId = params.get('openApptId') || params.get('apptId');
      if (openId) {
        setTimeout(() => {
          const el = document.getElementById('my-upcoming-appointments-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }
        }, 250);
      }
    }
  }, [loading]);

  const handlePay = async (id) => {
    try {
      await appointmentService.payAppointment(id, token);
      alert('تم إتمام عملية الدفع بنجاح!');
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'فشلت عملية الدفع');
    }
  };

  const [cancelModalApptId, setCancelModalApptId] = useState(null);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [cancellingLoading, setCancellingLoading] = useState(false);

  const handleOpenCancelModal = (id) => {
    setCancelModalApptId(id);
    setCancelReasonText('');
  };

  const confirmCancelSubmit = async () => {
    if (!token || !cancelModalApptId) return;
    const reason = cancelReasonText.trim() || 'تم إلغاء الموعد بناءً على طلب المستخدم';
    setCancellingLoading(true);
    try {
      await appointmentService.cancelAppointment(cancelModalApptId, reason, token);
      setCancelModalApptId(null);
      setCancelReasonText('');
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'فشلت عملية الإلغاء');
    } finally {
      setCancellingLoading(false);
    }
  };

  // Open Rating / Complaint Modal
  const handleOpenRatingModal = (appt, isNoShow = false) => {
    setRatingModalAppt(appt);
    setRatingStars(isNoShow ? 1 : 5);
    setRatingReason(isNoShow ? 'المستشار لم يحضر الجلسة وفتح الغرفة في الموعد المحدد' : '');
    setRatingComment(isNoShow ? 'المستشار لم يحضر الجلسة في الموعد المحدد ولم يقم بفتح الغرفة.' : '');
  };

  // Submit Rating / Complaint
  const handleRatingSubmit = async () => {
    if (!token || !ratingModalAppt) return;
    if (ratingStars < 2 && !ratingReason.trim() && !ratingComment.trim()) {
      alert('يرجى اختيار أو كتابة سبب التقييم المنخفض أو تفاصيل المشكلة');
      return;
    }
    setSubmittingRating(true);
    try {
      // If appointment was not yet marked no_show and user is reporting consultant absence
      const isConsultantAbsent = ratingModalAppt.attendance_status === 'consultant_no_show' || ratingModalAppt.no_show_party === 'consultant' || ratingStars <= 2;
      if (isConsultantAbsent && ratingModalAppt.status !== 'no_show') {
        await appointmentService.markNoShow(ratingModalAppt.id, token).catch(() => {});
      }

      await appointmentService.rateAppointment(
        ratingModalAppt.id,
        {
          stars: ratingStars,
          comment: ratingComment.trim(),
          low_rating_reason: ratingReason.trim() || (ratingStars < 2 ? ratingComment.trim() || 'عدم حضور المستشار' : undefined)
        },
        token
      );

      alert('تم إرسال تقييمك وبلاغك بنجاح! شكراً لمساعدتنا في تحسين جودة المنصة ومحاسبة أي تقصير.');
      setRatingModalAppt(null);
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'تعذر إرسال التقييم');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Helper to check if consultant is overdue to open room
  const isOverdueConsultant = (appt) => {
    if (!appt.scheduled_at) return false;
    if (appt.room_opened_at) return false;
    if (['completed', 'cancelled', 'cancelled_by_user', 'cancelled_by_consultant', 'rejected', 'no_show'].includes(appt.status)) return false;
    const now = new Date();
    const sessionTime = new Date(appt.scheduled_at);
    // 10 minutes grace period
    return now.getTime() > (sessionTime.getTime() + 10 * 60 * 1000);
  };

  // Video Room Join Time Protection
  const handleJoinVideoRoom = (appt) => {
    if (!appt.scheduled_at) {
      setActiveVideoApptId(appt.id);
      return;
    }

    const now = new Date();
    const sessionTime = new Date(appt.scheduled_at);
    // Allow joining 15 minutes before scheduled time up to 2 hours after
    const minJoinTime = new Date(sessionTime.getTime() - 15 * 60 * 1000);
    const maxJoinTime = new Date(sessionTime.getTime() + 120 * 60 * 1000);

    if (now < minJoinTime) {
      alert(`عفواً، لا يمكنك دخول غرفة الفيديو إلا في موعد الجلسة المحدّد (${formatDateStr(appt.scheduled_at)}).`);
      return;
    }

    setActiveVideoApptId(appt.id);
  };

  // Stats Calculations
  const activeCount = appointments.filter(a => ['accepted', 'confirmed', 'pending_payment', 'pending_approval', 'scheduled'].includes(a.status)).length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => ['cancelled', 'cancelled_by_user', 'cancelled_by_consultant', 'rejected', 'no_show'].includes(a.status) || a.attendance_status === 'consultant_no_show' || a.attendance_status === 'user_no_show').length;

  // Filter Appointments by Tab
  const getFilteredAppointments = () => {
    switch (activeTab) {
      case 'active':
        return appointments.filter(a => ['accepted', 'confirmed', 'pending_payment', 'pending_approval', 'scheduled'].includes(a.status));
      case 'pending_approval':
        return appointments.filter(a => a.status === 'pending_approval');
      case 'pending_payment':
        return appointments.filter(a => ['accepted', 'pending_payment'].includes(a.status));
      case 'completed':
        return appointments.filter(a => a.status === 'completed');
      case 'cancelled':
        return appointments.filter(a => ['cancelled', 'cancelled_by_user', 'cancelled_by_consultant', 'rejected', 'no_show'].includes(a.status) || a.attendance_status === 'consultant_no_show' || a.attendance_status === 'user_no_show');
      case 'all':
      default:
        return appointments;
    }
  };

  // Get status badge UI with attendance support
  const getStatusBadge = (status, appt = null) => {
    if (appt) {
      if (appt.attendance_status === 'consultant_no_show' || appt.no_show_party === 'consultant') {
        return <span style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #F87171', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>⚠️ غياب المستشار (المشكلة من المستشار)</span>;
      }
      if (appt.attendance_status === 'user_no_show' || appt.no_show_party === 'user') {
        return <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>⚠️ غياب العميل (لم يحضر الجلسة)</span>;
      }
      if (appt.attendance_status === 'both_attended') {
        return <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>✓ حضر الطرفان</span>;
      }
      if (appt.room_opened_at && appt.status === 'confirmed' && !appt.user_joined_at) {
        return <span style={{ background: '#D1FAE5', color: '#047857', border: '1px solid #34D399', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>🟢 المستشار داخل الغرفة</span>;
      }
    }

    const s = (typeof status === 'object' && status !== null) ? status.status : status;
    switch (s) {
      case 'confirmed':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>مؤكدة (تم الدفع)</span>;
      case 'accepted':
      case 'pending_payment':
        return <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>مقبولة (بانتظار الدفع)</span>;
      case 'pending_approval':
        return <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>معلقة (بانتظار موافقة المستشار)</span>;
      case 'completed':
        return <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>مكتملة</span>;
      case 'no_show':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>غياب / لم يحضر</span>;
      case 'cancelled':
      case 'cancelled_by_user':
      case 'cancelled_by_consultant':
      case 'rejected':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>ملغاة / مرفوضة</span>;
      default:
        return <span style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>معلقة</span>;
    }
  };

  // Render Date nicely
  const formatDateStr = (dateVal) => {
    if (!dateVal) return '';
    const dateObj = new Date(dateVal);
    const dateFormatted = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
    const timeFormatted = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return `${dateFormatted} ، ${timeFormatted}`;
  };

  // Helper to get Partner Name based on user role
  const getPartnerName = (appt) => {
    if (user?.role === 'consultant') {
      return appt.client_name || appt.user?.full_name || appt.user_name || 'العميل';
    }
    return appt.consultant_name || appt.consultant?.user?.full_name || 'د. مستشار المنصة';
  };

  const filteredAppointments = getFilteredAppointments();

  // Show first 5 upcoming accepted/confirmed appointments
  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'accepted' || a.status === 'pending_payment' || a.status === 'scheduled').slice(0, 5);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#005D9C', fontWeight: '700' }}>
        جاري تحميل الاستشارات الخاصة بك...
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'sans-serif', paddingBottom: '40px' }}>

      {/* Header controls & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>استشاراتي ومواعيدي</h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '6px 0 0 0' }}>جميع طلبات الاستشارة ومواعيدك في مكان واحد.</p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/consultants')}
            style={{
              background: '#134B70',
              color: '#FFFFFF',
              border: 'none',
              padding: '11px 24px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>+ طلب استشارة جديدة</span>
          </button>

          <button
            onClick={() => setActiveVideoApptId('test-session-id')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#475569',
              padding: '11px 20px',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
            </svg>
            <span>تجربة غرفة الفيديو</span>
          </button>
        </div>
      </div>

      {/* Three Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: '#3B82F6', display: 'block' }}>{activeCount}</span>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>نشطة</span>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', display: 'block' }}>{completedCount}</span>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>مكتملة</span>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: '#EF4444', display: 'block' }}>{cancelledCount}</span>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>ملغاة/مرفوضة</span>
        </div>

      </div>

      {/* Section: Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div id="my-upcoming-appointments-section" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(13, 60, 92, 0.02)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🕒</span> مواعيدك القادمة
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {upcomingAppointments.map((appt) => (
              <div
                key={appt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '14px',
                  borderBottom: '1px solid #F1F5F9',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#005D9C', fontWeight: '800', marginBottom: '2px' }}>
                    {user?.role === 'consultant' ? `العميل: ${getPartnerName(appt)}` : `المستشار: ${getPartnerName(appt)}`}
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#334155', margin: '0 0 4px 0' }}>
                    {appt.service_name || appt.notes || 'جلسة استشارية ضريبية'}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    {formatDateStr(appt.scheduled_at)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {getStatusBadge(appt.status, appt)}
                  {(() => {
                    const isConfirmed = appt.status === 'confirmed';
                    const isConsultantNoShow = appt.attendance_status === 'consultant_no_show' || appt.no_show_party === 'consultant' || isOverdueConsultant(appt);
                    const isClient = user?.role !== 'consultant';

                    if (isConsultantNoShow && isClient) {
                      return (
                        <button
                          onClick={() => handleOpenRatingModal(appt, true)}
                          style={{
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                          }}
                        >
                          <span>⭐ بلاغ غياب وتقييم المستشار</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => isConfirmed && handleJoinVideoRoom(appt)}
                        disabled={!isConfirmed}
                        title={!isConfirmed ? 'في انتظار إتمام الدفع لتفعيل دخول الغرفة' : 'دخول غرفة الجلسة'}
                        style={{
                          backgroundColor: isConfirmed ? (appt.room_opened_at ? '#059669' : '#134B70') : '#CBD5E1',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: isConfirmed ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: isConfirmed ? 1 : 0.7
                        }}
                      >
                        {appt.room_opened_at && <span>🟢</span>}
                        <span>{appt.room_opened_at ? 'دخول الغرفة (المستشار بانتظارك)' : 'دخول الغرفة'}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs list */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '2px solid #F1F5F9',
          paddingBottom: '10px',
          marginBottom: '20px',
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'all', label: 'الكل' },
          { id: 'active', label: 'النشطة' },
          { id: 'pending_approval', label: 'بانتظار موافقة المستشار' },
          { id: 'pending_payment', label: 'بانتظار الدفع' },
          { id: 'completed', label: 'المكتملة' },
          { id: 'cancelled', label: 'الملغاة / الغياب' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? '#003C62' : '#64748B',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '8px 16px',
                borderBottom: isActive ? '3px solid #003C62' : '3px solid transparent',
                borderRadius: '0',
                transition: 'all 0.15s',
                marginBottom: '-12px'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content list */}
      {filteredAppointments.length === 0 ? (
        <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '18px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <div style={{ width: '60px', height: '60px', background: '#E5EFF5', color: '#134B70', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <h3 style={{ color: '#1E293B', marginBottom: '8px', fontWeight: '800' }}>لا توجد استشارات في هذا التبويب</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>يمكنك حجز موعد جديد من دليل المستشارين.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAppointments.map((appt) => {
            const isConfirmed = appt.status === 'confirmed';
            const isPendingPayment = appt.status === 'pending_payment';
            const isPendingApproval = appt.status === 'pending_approval';

            return (
              <div
                key={appt.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >

                {/* Details Section */}
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    {getStatusBadge(appt.status, appt)}
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>رقم المعاملة: #{appt.id.substring(0, 8)}</span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#005D9C', fontWeight: '800', marginBottom: '4px' }}>
                    {user?.role === 'consultant' ? `العميل: ${getPartnerName(appt)}` : `المستشار: ${getPartnerName(appt)}`}
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 6px 0' }}>
                    {appt.service_name || 'جلسة تجريبية - اختبار الفيديو والملخص الذكي'}
                  </h3>

                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>
                    {isConfirmed ? (
                      `جلسة فيديو - موعد الجلسة: (${formatDateStr(appt.scheduled_at)})`
                    ) : isPendingPayment || isPendingApproval ? (
                      `الموعد المختار: ${formatDateStr(appt.scheduled_at)}`
                    ) : (
                      `الموعد المفضل: ${formatDateStr(appt.scheduled_at)}`
                    )}
                  </p>

                  {/* Live attendance hint alerts */}
                  {appt.room_opened_at && !appt.user_joined_at && isConfirmed && (
                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#D1FAE5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                      <span>المستشار قام بفتح الغرفة وهو بانتظارك الآن</span>
                    </div>
                  )}

                  {(appt.attendance_status === 'consultant_no_show' || appt.no_show_party === 'consultant' || (isConfirmed && isOverdueConsultant(appt))) && (
                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700' }}>
                      <span>⚠️ لم يحضر المستشار في الموعد المحدد (المشكلة من جانب المستشار)</span>
                    </div>
                  )}

                  {(appt.attendance_status === 'user_no_show' || appt.no_show_party === 'user') && (
                    <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700' }}>
                      <span>⚠️ لم يحضر العميل الجلسة في الموعد المحدد (المشكلة من جانب العميل)</span>
                    </div>
                  )}
                </div>

                {/* Actions Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

                  {/* Rating / Report action for client if consultant failed to show */}
                  {(user?.role !== 'consultant') && (appt.attendance_status === 'consultant_no_show' || appt.no_show_party === 'consultant' || (isConfirmed && isOverdueConsultant(appt))) && (
                    <button
                      onClick={() => handleOpenRatingModal(appt, true)}
                      style={{
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                      }}
                    >
                      <span>⭐ تقييم المستشار / بلاغ غياب</span>
                    </button>
                  )}

                  {isConfirmed && !(appt.attendance_status === 'consultant_no_show' || appt.no_show_party === 'consultant') && (
                    <button
                      onClick={() => handleJoinVideoRoom(appt)}
                      style={{
                        backgroundColor: appt.room_opened_at ? '#059669' : '#134B70',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 22px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)'
                      }}
                    >
                      {appt.room_opened_at && <span>🟢</span>}
                      <span>{appt.room_opened_at ? 'دخول الغرفة (المستشار بانتظارك)' : 'دخول الغرفة'}</span>
                    </button>
                  )}

                  {/* Rating action for completed sessions */}
                  {(user?.role !== 'consultant') && appt.status === 'completed' && (
                    !appt.rating ? (
                      <button
                        onClick={() => handleOpenRatingModal(appt, false)}
                        style={{
                          backgroundColor: '#F59E0B',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          fontWeight: '800',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
                        }}
                      >
                        <span>⭐ تقييم الجلسة</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: '12px', fontWeight: '800' }}>
                        ✓ تم التقييم ({appt.rating?.stars || '★'})
                      </span>
                    )
                  )}

                  {isPendingPayment && (user?.role === 'user' || user?.role === 'client' || String(appt.user_id) === String(user?.id)) && (
                    <button
                      onClick={() => setPayingAppt(appt)}
                      style={{
                        backgroundColor: '#134B70',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 22px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(19, 75, 112, 0.25)'
                      }}
                    >
                      دفع {appt.amount || appt.price || 50} د.أ
                    </button>
                  )}

                  {isPendingPayment && (user?.role === 'consultant' || user?.role === 'platform_consultant') && (
                    <span style={{ fontSize: '12px', color: '#D97706', backgroundColor: '#FFFBEB', padding: '6px 14px', borderRadius: '12px', border: '1px solid #FDE68A', fontWeight: '800' }}>
                      بانتظار سداد العميل
                    </span>
                  )}

                  {(isPendingApproval || isPendingPayment || isConfirmed) && (
                    <button
                      onClick={() => navigate(`/chat?apptId=${appt.id}`)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#475569',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{user?.role === 'consultant' ? 'راسل العميل' : 'راسل المستشار'}</span>
                    </button>
                  )}

                  {appt.status !== 'cancelled' && appt.status !== 'completed' && appt.status !== 'cancelled_by_user' && appt.status !== 'cancelled_by_consultant' && appt.status !== 'no_show' && (
                    <button
                      onClick={() => handleOpenCancelModal(appt.id)}
                      style={{
                        backgroundColor: '#FEF2F2',
                        color: '#EF4444',
                        border: '1px solid #FCA5A5',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      إلغاء الموعد
                    </button>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Video Session Modal */}
      <VideoSessionModal
        appointmentId={activeVideoApptId}
        isOpen={!!activeVideoApptId}
        onClose={() => setActiveVideoApptId(null)}
        onSessionEnd={fetchAppointments}
        onRequestRating={(apptId) => {
          const found = appointments.find(a => String(a.id) === String(apptId));
          if (found) {
            handleOpenRatingModal(found, true);
          }
        }}
      />

      {/* Payment Modal for Pending Payment Appointments */}
      {payingAppt && (
        <PaymentModal
          isOpen={!!payingAppt}
          onClose={() => setPayingAppt(null)}
          onSuccess={() => {
            setPayingAppt(null);
            fetchAppointments();
          }}
          appointmentId={payingAppt.id}
          price={payingAppt.amount || payingAppt.price || 50}
          consultantName={payingAppt.consultant_name || 'المستشار'}
          serviceName={payingAppt.service_name || 'جلسة استشارية ضريبية'}
        />
      )}

      {/* CUSTOM STYLED CANCELLATION REASON MODAL */}
      {cancelModalApptId && (
        <div className="consultantModalBackdrop open" onClick={() => setCancelModalApptId(null)}>
          <div className="consultantModalShell" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow" style={{ color: '#d86d5d' }}>إلغاء الاستشارة</span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#123d57', margin: '4px 0' }}>سبب إلغاء الموعد</h2>
                <p style={{ fontSize: '12px', color: '#607987', margin: 0 }}>يرجى توضيح سبب الإلغاء لمشاركته مع المستشار والمنصة.</p>
              </div>
              <button className="consultantModalClose" onClick={() => setCancelModalApptId(null)}>×</button>
            </div>
            <div className="consultantModalBody" style={{ padding: '20px' }}>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '110px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #dce5ea',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="اكتب سبب إلغاء الموعد هنا..."
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  style={{
                    padding: '9px 18px',
                    borderRadius: '9px',
                    border: '1px solid #dce5ea',
                    background: '#fff',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '12px'
                  }}
                  onClick={() => setCancelModalApptId(null)}
                >
                  تراجع
                </button>
                <button
                  style={{
                    padding: '9px 24px',
                    borderRadius: '9px',
                    border: 'none',
                    background: '#d86d5d',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '12px'
                  }}
                  onClick={confirmCancelSubmit}
                  disabled={cancellingLoading}
                >
                  {cancellingLoading ? 'جاري...' : 'تأكيد الإلغاء'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM STYLED RATING & NO-SHOW COMPLAINT MODAL */}
      {ratingModalAppt && (
        <div className="consultantModalBackdrop open" onClick={() => setRatingModalAppt(null)}>
          <div className="consultantModalShell" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="consultantModalHeader">
              <div>
                <span className="consultantModalEyebrow" style={{ color: ratingStars < 3 ? '#DC2626' : '#F59E0B' }}>
                  {ratingStars < 3 ? 'بلاغ وتقييم عدم حضور' : 'تقييم جلسة الاستشارة'}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#123d57', margin: '4px 0' }}>
                  {ratingModalAppt.attendance_status === 'consultant_no_show' || ratingStars < 3
                    ? 'توثيق غياب المستشار وتقييمه'
                    : 'تقييم المستشار والجلسة'}
                </h2>
                <p style={{ fontSize: '12px', color: '#607987', margin: 0 }}>
                  المستشار: {getPartnerName(ratingModalAppt)} | الجلسة #{ratingModalAppt.id.substring(0, 8)}
                </p>
              </div>
              <button className="consultantModalClose" onClick={() => setRatingModalAppt(null)}>×</button>
            </div>

            <div className="consultantModalBody" style={{ padding: '20px' }}>
              {/* Star Rating Picker */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  حدد تقييمك:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', direction: 'ltr' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '32px',
                        cursor: 'pointer',
                        color: star <= ratingStars ? '#F59E0B' : '#CBD5E1',
                        transition: 'transform 0.1s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: ratingStars <= 2 ? '#DC2626' : '#059669', fontWeight: '700', marginTop: '4px', display: 'block' }}>
                  {ratingStars === 1 ? 'نجمة واحدة (سيء جداً - لم يحضر)' :
                   ratingStars === 2 ? 'نجمتان (غير مرضي)' :
                   ratingStars === 3 ? '3 نجوم (متوسط)' :
                   ratingStars === 4 ? '4 نجوم (جيد جداً)' : '5 نجوم (ممتاز)'}
                </span>
              </div>

              {/* Low rating reasons pills */}
              {ratingStars < 3 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
                    سبب الشكوى أو المشكلة:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      'المستشار لم يحضر الجلسة وفتح الغرفة',
                      'تأخر المستشار كثيراً عن الموعد المحدد',
                      'المستشار أنهى الجلسة قبل موعدها',
                      'مشكلة تقنية من طرف المستشار'
                    ].map((reasonText) => (
                      <button
                        key={reasonText}
                        type="button"
                        onClick={() => {
                          setRatingReason(reasonText);
                          if (!ratingComment) setRatingComment(reasonText);
                        }}
                        style={{
                          background: ratingReason === reasonText ? '#FEE2E2' : '#F1F5F9',
                          color: ratingReason === reasonText ? '#991B1B' : '#475569',
                          border: ratingReason === reasonText ? '1px solid #F87171' : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        {reasonText}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment text */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                  {ratingStars < 3 ? 'تفاصيل البلاغ أو الملاحظات:' : 'رأيك في الجلسة (اختياري):'}
                </label>
                <textarea
                  style={{
                    width: '100%',
                    minHeight: '90px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #dce5ea',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  placeholder={ratingStars < 3 ? 'اكتب تفاصيل ما حدث وتأكيد عدم حضور المستشار...' : 'اكتب تجربتك مع المستشار...'}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
              </div>

              {/* Footer buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '9px',
                    border: '1px solid #dce5ea',
                    background: '#fff',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '12px'
                  }}
                  onClick={() => setRatingModalAppt(null)}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  style={{
                    padding: '9px 24px',
                    borderRadius: '9px',
                    border: 'none',
                    background: ratingStars < 3 ? '#DC2626' : '#0A3254',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '12px'
                  }}
                  onClick={handleRatingSubmit}
                  disabled={submittingRating}
                >
                  {submittingRating ? 'جاري الإرسال...' : (ratingStars < 3 ? 'إرسال البلاغ والتقييم' : 'تأكيد التقييم')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
