import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { consultantService } from '../services/consultantService';
import VideoSessionModal from '../components/VideoSession/VideoSessionModal';
import PaymentModal from '../components/Consultants/PaymentModal';
import Toast, { useToast } from '../components/Toast/Toast';

export default function MyAppointmentsPage({ navigate }) {
  const { token, user } = useAuth();
  const { toast, showToast } = useToast();

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
  const [ratingValidationError, setRatingValidationError] = useState('');
  const [ratingSuccessModal, setRatingSuccessModal] = useState(null);
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
      showToast('تم إتمام عملية الدفع بنجاح!', 'success');
      fetchAppointments();
    } catch (err) {
      showToast(err.message || 'فشلت عملية الدفع', 'error');
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
      showToast('تم إلغاء الموعد بنجاح', 'success');
      fetchAppointments();
    } catch (err) {
      showToast(err.message || 'فشلت عملية الإلغاء', 'error');
    } finally {
      setCancellingLoading(false);
    }
  };

  // Open Rating / Complaint Modal
  const handleOpenRatingModal = (appt, isNoShow = false) => {
    setRatingModalAppt(appt);
    setRatingValidationError('');
    setRatingStars(isNoShow ? 1 : 5);
    setRatingReason(isNoShow ? 'المستشار لم يحضر الجلسة وفتح الغرفة في الموعد المحدد' : '');
    setRatingComment(isNoShow ? 'المستشار لم يحضر الجلسة في الموعد المحدد ولم يقم بفتح الغرفة.' : '');
  };

  // Submit Rating / Complaint
  const handleRatingSubmit = async () => {
    if (!token || !ratingModalAppt) return;
    if (ratingStars < 2 && !ratingReason.trim() && !ratingComment.trim()) {
      setRatingValidationError('يرجى اختيار أو كتابة سبب التقييم المنخفض أو تفاصيل المشكلة');
      return;
    }
    setSubmittingRating(true);
    setRatingValidationError('');
    try {
      // If appointment was not yet marked no_show and user is reporting consultant absence
      const isConsultantAbsent = ratingModalAppt.attendance_status === 'consultant_no_show' || ratingModalAppt.no_show_party === 'consultant' || ratingStars <= 2;
      if (isConsultantAbsent && ratingModalAppt.status !== 'no_show') {
        await appointmentService.markNoShow(ratingModalAppt.id, token).catch(() => { });
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

      const consultantName = getPartnerName(ratingModalAppt);
      const submittedStars = ratingStars;
      const isComplaint = ratingStars < 3;

      setRatingModalAppt(null);
      setRatingValidationError('');
      setRatingSuccessModal({
        consultantName,
        stars: submittedStars,
        isComplaint
      });
      showToast(isComplaint ? 'تم توثيق وبلاغ التقييم بنجاح' : 'تم إرسال تقييمك بنجاح ⭐', 'success');
      fetchAppointments();
    } catch (err) {
      setRatingValidationError(err.message || 'تعذر إرسال التقييم');
      showToast(err.message || 'تعذر إرسال التقييم', 'error');
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
      showToast(`عفواً، لا يمكنك دخول غرفة الفيديو إلا في موعد الجلسة المحدّد (${formatDateStr(appt.scheduled_at)}).`, 'error');
      return;
    }

    setActiveVideoApptId(appt.id);
  };

  // Stats Calculations
  const activeCount = appointments.filter(a => ['accepted', 'confirmed', 'pending_payment', 'pending_approval', 'scheduled'].includes(a.status)).length;
  const pendingApprovalCount = appointments.filter(a => a.status === 'pending_approval').length;
  const pendingPaymentCount = appointments.filter(a => ['accepted', 'pending_payment'].includes(a.status)).length;
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

  // Get status badge UI with calm, unified colors
  const getStatusBadge = (status, appt = null) => {
    if (appt) {
      if (appt.attendance_status === 'consultant_no_show' || appt.no_show_party === 'consultant') {
        return <span style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>⚠️ غياب المستشار</span>;
      }
      if (appt.attendance_status === 'user_no_show' || appt.no_show_party === 'user') {
        return <span style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>⚠️ غياب العميل</span>;
      }
      if (appt.attendance_status === 'both_attended') {
        return <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>✓ حضر الطرفان</span>;
      }
      if (appt.room_opened_at && appt.status === 'confirmed' && !appt.user_joined_at) {
        return <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>🟢 المستشار بالغرفة</span>;
      }
    }

    const s = (typeof status === 'object' && status !== null) ? status.status : status;
    switch (s) {
      case 'confirmed':
        return <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>مؤكدة (تم الدفع)</span>;
      case 'accepted':
      case 'pending_payment':
        return <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>بانتظار الدفع</span>;
      case 'pending_approval':
        return <span style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>بانتظار الموافقة</span>;
      case 'completed':
        return <span style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>مكتملة</span>;
      case 'no_show':
        return <span style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>لم يحضر</span>;
      case 'cancelled':
      case 'cancelled_by_user':
      case 'cancelled_by_consultant':
      case 'rejected':
        return <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>ملغاة</span>;
      default:
        return <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>معلقة</span>;
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
    if (user?.role === 'consultant' || user?.role === 'platform_consultant') {
      return appt.client_name || appt.user?.full_name || appt.user_name || 'العميل';
    }
    return appt.consultant_name || appt.consultant?.user?.full_name || 'د. مستشار المنصة';
  };

  const getPartnerInitial = (name) => {
    if (!name) return 'م';
    const clean = name.replace(/^(د\.|دكتور|أستاذ|أ\.)\s*/, '').trim();
    return clean ? clean.charAt(0) : 'م';
  };

  const filteredAppointments = getFilteredAppointments();
  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'accepted' || a.status === 'pending_payment' || a.status === 'scheduled').slice(0, 3);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#0B2E4B', fontWeight: '700', fontFamily: 'Tajawal, sans-serif' }}>
        جاري تحميل جلساتك واستشاراتك...
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Tajawal, sans-serif', maxWidth: '1180px', margin: '0 auto', padding: '16px 20px 60px' }}>

      {/* Scoped CSS styling for calm aesthetics */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .map-btn-main {
          background: #0B2E4B;
          color: #FFFFFF;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(11, 46, 75, 0.15);
          font-family: inherit;
        }
        .map-btn-main:hover {
          background: #164D70;
          transform: translateY(-1px);
        }
        .map-btn-outline {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #334155;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s;
          font-family: inherit;
        }
        .map-btn-outline:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }
        .map-stat-box {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(11, 46, 75, 0.02);
          transition: all 0.2s;
        }
        .map-stat-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(11, 46, 75, 0.05);
          border-color: #CBD5E1;
        }
        .map-tab-item {
          background: transparent;
          border: none;
          color: #64748B;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 10px;
          transition: all 0.15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }
        .map-tab-item.active {
          background: #FFFFFF;
          color: #0B2E4B;
          font-weight: 850;
          box-shadow: 0 2px 6px rgba(11, 46, 75, 0.06);
        }
        .map-card-item {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(11, 46, 75, 0.02);
          transition: all 0.2s;
        }
        .map-card-item:hover {
          border-color: #CBD5E1;
          box-shadow: 0 6px 18px rgba(11, 46, 75, 0.04);
        }
      `}} />

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0B2E4B', margin: '0 0 4px 0' }}>استشاراتي ومواعيدي</h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>متابعة المواعيد والجلسات الاستشارية وسجل الجلسات السابقة.</p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/consultants')}
            className="map-btn-main"
          >
            <span>+ طلب استشارة جديدة</span>
          </button>

          <button
            onClick={() => setActiveVideoApptId('test-session-id')}
            className="map-btn-outline"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
            </svg>
            <span>تجربة الغرفة</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Calm & Balanced */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '26px' }}>

        <div className="map-stat-box">
          <div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '2px' }}>إجمالي الجلسات</span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#0B2E4B' }}>{appointments.length}</span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', color: '#0B2E4B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            📋
          </div>
        </div>

        <div className="map-stat-box">
          <div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '2px' }}>الجلسات النشطة</span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#047857' }}>{activeCount}</span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            🟢
          </div>
        </div>

        <div className="map-stat-box">
          <div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '2px' }}>الجلسات المكتملة</span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#0B2E4B' }}>{completedCount}</span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EEF4F8', color: '#0B2E4B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            ✅
          </div>
        </div>

        <div className="map-stat-box">
          <div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', display: 'block', marginBottom: '2px' }}>الملغاة / المرفوضة</span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#64748B' }}>{cancelledCount}</span>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            ✕
          </div>
        </div>

      </div>

      {/* Highlight Upcoming Appointments (if any) */}
      {upcomingAppointments.length > 0 && (
        <div id="my-upcoming-appointments-section" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px 22px', marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '850', color: '#0B2E4B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
              مواعيدك القادمة القريبة
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>({upcomingAppointments.length} مواعيد)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingAppointments.map((appt) => {
              const isConfirmed = appt.status === 'confirmed';
              const isConsultantNoShow = appt.attendance_status === 'consultant_no_show' || appt.no_show_party === 'consultant' || isOverdueConsultant(appt);
              const isClient = user?.role !== 'consultant';

              return (
                <div
                  key={appt.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #EDF2F7',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #164D70 0%, #0B2E4B 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      {getPartnerInitial(getPartnerName(appt))}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0B2E4B', marginBottom: '2px' }}>
                        {getPartnerName(appt)}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🕒 {formatDateStr(appt.scheduled_at)}</span>
                        <span>•</span>
                        <span>{appt.service_name || 'استشارة مهنية'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusBadge(appt.status, appt)}

                    {isConsultantNoShow && isClient ? (
                      <button
                        onClick={() => handleOpenRatingModal(appt, true)}
                        style={{
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        ⭐ بلاغ غياب المستشار
                      </button>
                    ) : (
                      <button
                        onClick={() => isConfirmed && handleJoinVideoRoom(appt)}
                        disabled={!isConfirmed}
                        style={{
                          backgroundColor: isConfirmed ? (appt.room_opened_at ? '#059669' : '#0B2E4B') : '#CBD5E1',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '7px 16px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: isConfirmed ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s'
                        }}
                      >
                        {appt.room_opened_at && <span>🟢</span>}
                        <span>{appt.room_opened_at ? 'دخول الغرفة (المستشار بانتظارك)' : 'دخول الغرفة'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: '#F1F5F9',
        padding: '5px',
        borderRadius: '12px',
        marginBottom: '20px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'all', label: 'الكل', count: appointments.length },
          { id: 'active', label: 'النشطة', count: activeCount },
          { id: 'pending_approval', label: 'بانتظار الموافقة', count: pendingApprovalCount },
          { id: 'pending_payment', label: 'بانتظار الدفع', count: pendingPaymentCount },
          { id: 'completed', label: 'المكتملة', count: completedCount },
          { id: 'cancelled', label: 'الملغاة / الغياب', count: cancelledCount }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`map-tab-item ${isActive ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: '800',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: isActive ? '#EEF4F8' : '#E2E8F0',
                  color: isActive ? '#0B2E4B' : '#64748B'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtered Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div style={{ background: '#FFFFFF', padding: '48px 24px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <div style={{ width: '56px', height: '56px', background: '#F1F5F9', color: '#0B2E4B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', fontSize: '24px' }}>
            📅
          </div>
          <h3 style={{ color: '#0B2E4B', marginBottom: '6px', fontWeight: '850', fontSize: '16px' }}>لا توجد استشارات في هذا التبويب</h3>
          <p style={{ fontSize: '13px', margin: '0 0 16px', color: '#64748B' }}>يمكنك حجز موعد جديد واختيار المستشار المناسب من دليل المنصة.</p>
          <button
            onClick={() => navigate('/consultants')}
            className="map-btn-main"
            style={{ fontSize: '12.5px', padding: '8px 18px' }}
          >
            تصفح دليل المستشارين
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAppointments.map((appt) => {
            const isConfirmed = appt.status === 'confirmed';
            const isPendingPayment = appt.status === 'pending_payment';
            const isPendingApproval = appt.status === 'pending_approval';
            const isConsultantNoShow = appt.attendance_status === 'consultant_no_show' || appt.no_show_party === 'consultant' || (isConfirmed && isOverdueConsultant(appt));
            const isClient = user?.role !== 'consultant';

            return (
              <div
                key={appt.id}
                className="map-card-item"
              >

                {/* Right Side: Partner Info & Service */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #164D70 0%, #0B2E4B 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                    {getPartnerInitial(getPartnerName(appt))}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      {getStatusBadge(appt.status, appt)}
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>#{appt.id.substring(0, 8)}</span>
                    </div>

                    <h4 style={{ fontSize: '14.5px', fontWeight: '850', color: '#0B2E4B', margin: '0 0 3px 0' }}>
                      {getPartnerName(appt)}
                    </h4>

                    <div style={{ fontSize: '12.5px', color: '#475569', fontWeight: '600', marginBottom: '4px' }}>
                      {appt.service_name || 'جلسة استشارية متخصصة'}
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📅 {formatDateStr(appt.scheduled_at)}</span>
                      {appt.amount ? <span>• 💰 {appt.amount} د.أ</span> : null}
                    </div>

                    {/* Attendance hints */}
                    {appt.room_opened_at && !appt.user_joined_at && isConfirmed && (
                      <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                        <span>المستشار فتح الغرفة وبانتظارك</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Left Side: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

                  {/* Rating / Report for no show */}
                  {isClient && isConsultantNoShow && (
                    <button
                      onClick={() => handleOpenRatingModal(appt, true)}
                      style={{
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      ⭐ تقييم المستشار / بلاغ
                    </button>
                  )}

                  {/* Video room button */}
                  {isConfirmed && !isConsultantNoShow && (
                    <button
                      onClick={() => handleJoinVideoRoom(appt)}
                      style={{
                        backgroundColor: appt.room_opened_at ? '#059669' : '#0B2E4B',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 18px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s'
                      }}
                    >
                      {appt.room_opened_at && <span>🟢</span>}
                      <span>{appt.room_opened_at ? 'دخول الغرفة (بانتظارك)' : 'دخول الغرفة'}</span>
                    </button>
                  )}

                  {/* Rate completed session */}
                  {isClient && appt.status === 'completed' && (
                    !appt.rating ? (
                      <button
                        onClick={() => handleOpenRatingModal(appt, false)}
                        style={{
                          backgroundColor: '#F59A23',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: 'inherit'
                        }}
                      >
                        <span>⭐ تقييم الجلسة</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '5px 12px', borderRadius: '10px', fontWeight: '800' }}>
                        ✓ تم التقييم ({appt.rating?.stars || '★'})
                      </span>
                    )
                  )}

                  {/* Pay button */}
                  {isPendingPayment && (user?.role === 'user' || user?.role === 'client' || String(appt.user_id) === String(user?.id)) && (
                    <button
                      onClick={() => setPayingAppt(appt)}
                      style={{
                        backgroundColor: '#0B2E4B',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 18px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      دفع {appt.amount || appt.price || 50} د.أ
                    </button>
                  )}

                  {/* Chat button */}
                  {(isPendingApproval || isPendingPayment || isConfirmed) && (
                    <button
                      onClick={() => navigate(`/chat?apptId=${appt.id}`)}
                      className="map-btn-outline"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      <span>💬 {user?.role === 'consultant' ? 'العميل' : 'المستشار'}</span>
                    </button>
                  )}

                  {/* Cancel button */}
                  {appt.status !== 'cancelled' && appt.status !== 'completed' && appt.status !== 'cancelled_by_user' && appt.status !== 'cancelled_by_consultant' && appt.status !== 'no_show' && (
                    <button
                      onClick={() => handleOpenCancelModal(appt.id)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#64748B',
                        border: '1px solid #E2E8F0',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.background = '#FEF2F2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; }}
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

      {/* Cancellation Reason Modal */}
      {cancelModalApptId && (
        <div className="consultantModalBackdrop open" onClick={() => setCancelModalApptId(null)}>
          <div className="consultantModalShell" style={{ maxWidth: '500px', borderRadius: '20px', padding: '28px 24px', background: '#FFFFFF' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: '800' }}>إلغاء الاستشارة</span>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0B2E4B', margin: '4px 0 0' }}>سبب إلغاء الموعد</h2>
              </div>
              <button
                onClick={() => setCancelModalApptId(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: '#64748B' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 14px' }}>
              يرجى توضيح سبب الإلغاء لمشاركته مع المستشار والمنصة.
            </p>

            <textarea
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                fontFamily: 'inherit',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                marginBottom: '18px',
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
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  fontFamily: 'inherit'
                }}
                onClick={() => setCancelModalApptId(null)}
              >
                تراجع
              </button>
              <button
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  fontFamily: 'inherit'
                }}
                onClick={confirmCancelSubmit}
                disabled={cancellingLoading}
              >
                {cancellingLoading ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating & Complaint Modal */}
      {ratingModalAppt && (
        <div className="consultantModalBackdrop open" onClick={() => setRatingModalAppt(null)}>
          <div className="consultantModalShell" style={{ maxWidth: '520px', borderRadius: '20px', padding: '28px 24px', background: '#FFFFFF' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: ratingStars < 3 ? '#DC2626' : '#F59A23' }}>
                  {ratingStars < 3 ? 'بلاغ وتقييم عدم حضور' : 'تقييم جلسة الاستشارة'}
                </span>
                <h2 style={{ fontSize: '17px', fontWeight: '900', color: '#0B2E4B', margin: '4px 0 2px' }}>
                  {ratingModalAppt.attendance_status === 'consultant_no_show' || ratingStars < 3
                    ? 'توثيق غياب المستشار وتقييمه'
                    : 'تقييم المستشار والجلسة'}
                </h2>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                  المستشار: {getPartnerName(ratingModalAppt)}
                </p>
              </div>
              <button
                onClick={() => setRatingModalAppt(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', color: '#64748B' }}
              >
                ×
              </button>
            </div>

            {/* Validation Error Banner */}
            {ratingValidationError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '9px 14px',
                marginBottom: '14px',
                color: '#991B1B',
                fontSize: '12.5px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{ratingValidationError}</span>
              </div>
            )}

            {/* Star Rating Picker */}
            <div style={{ textAlign: 'center', marginBottom: '18px', background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '750', color: '#334155', marginBottom: '6px' }}>
                حدد تقييمك للجلسة:
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', direction: 'ltr' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRatingStars(star);
                      if (ratingValidationError) setRatingValidationError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '30px',
                      cursor: 'pointer',
                      color: star <= ratingStars ? '#F59A23' : '#CBD5E1',
                      transition: 'transform 0.1s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '12px', color: ratingStars <= 2 ? '#DC2626' : '#059669', fontWeight: '800', marginTop: '4px', display: 'block' }}>
                {ratingStars === 1 ? 'نجمة واحدة (سيء جداً - لم يحضر)' :
                  ratingStars === 2 ? 'نجمتان (غير مرضي)' :
                    ratingStars === 3 ? '3 نجوم (متوسط)' :
                      ratingStars === 4 ? '4 نجوم (جيد جداً)' : '5 نجوم (ممتاز)'}
              </span>
            </div>

            {/* Low rating reasons pills */}
            {ratingStars < 3 && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0B2E4B', marginBottom: '6px' }}>
                  سبب الشكوى أو المشكلة:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'المستشار لم يحضر الجلسة وفتح الغرفة',
                    'تأخر المستشار كثيراً عن الموعد',
                    'المستشار أنهى الجلسة قبل موعدها',
                    'مشكلة تقنية من طرف المستشار'
                  ].map((reasonText) => (
                    <button
                      key={reasonText}
                      type="button"
                      onClick={() => {
                        setRatingReason(reasonText);
                        if (!ratingComment) setRatingComment(reasonText);
                        if (ratingValidationError) setRatingValidationError('');
                      }}
                      style={{
                        background: ratingReason === reasonText ? '#FEF2F2' : '#F8FAFC',
                        color: ratingReason === reasonText ? '#991B1B' : '#475569',
                        border: ratingReason === reasonText ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '11px',
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0B2E4B', marginBottom: '6px' }}>
                {ratingStars < 3 ? 'تفاصيل البلاغ أو الملاحظات:' : 'رأيك في الجلسة (اختياري):'}
              </label>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '85px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontFamily: 'inherit',
                  fontSize: '12.5px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder={ratingStars < 3 ? 'اكتب تفاصيل ما حدث وتأكيد عدم حضور المستشار...' : 'اكتب تجربتك مع المستشار...'}
                value={ratingComment}
                onChange={(e) => {
                  setRatingComment(e.target.value);
                  if (ratingValidationError) setRatingValidationError('');
                }}
              />
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
                onClick={() => setRatingModalAppt(null)}
              >
                إلغاء
              </button>
              <button
                type="button"
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: ratingStars < 3 ? '#DC2626' : '#0B2E4B',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
                onClick={handleRatingSubmit}
                disabled={submittingRating}
              >
                {submittingRating ? 'جاري الإرسال...' : (ratingStars < 3 ? 'إرسال البلاغ والتقييم' : 'تأكيد التقييم')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Success Modal */}
      {ratingSuccessModal && (
        <div className="consultantModalBackdrop open" onClick={() => setRatingSuccessModal(null)}>
          <div
            className="consultantModalShell"
            style={{
              maxWidth: '460px',
              textAlign: 'center',
              padding: '36px 28px',
              borderRadius: '22px',
              background: '#FFFFFF',
              boxShadow: '0 20px 50px rgba(11, 46, 75, 0.16)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing Badge */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: ratingSuccessModal.isComplaint ? '#FEF2F2' : 'linear-gradient(135deg, #FFFBEB 0%, #ECFDF5 100%)',
              border: `2px solid ${ratingSuccessModal.isComplaint ? '#FECACA' : '#FDE68A'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              margin: '0 auto 16px',
              boxShadow: ratingSuccessModal.isComplaint ? '0 8px 24px rgba(239, 68, 68, 0.15)' : '0 8px 24px rgba(245, 158, 11, 0.15)'
            }}>
              {ratingSuccessModal.isComplaint ? '🛡️' : '🌟'}
            </div>

            <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#0B2E4B', margin: '0 0 8px' }}>
              {ratingSuccessModal.isComplaint ? 'تم توثيق بلاغك بنجاح' : 'شكراً لك! تم تسجيل تقييمك'}
            </h2>

            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6', margin: '0 0 20px' }}>
              {ratingSuccessModal.isComplaint
                ? 'تم استلام بلاغك وتوثيق حالة عدم الحضور لدى إدارة المنصة لمتابعة الإجراءات وحفظ حقوقك بالكامل.'
                : 'رأيك القيّم يمثل أهمية كبيرة لنا وللمستشارين، ويساعد مجتمع المستفيدين في اختيار الاستشارة الأنسب.'}
            </p>

            {/* Rating summary pill */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              direction: 'rtl'
            }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', display: 'block' }}>المستشار</span>
                <strong style={{ fontSize: '13.5px', color: '#1E293B', fontWeight: '800' }}>{ratingSuccessModal.consultantName}</strong>
              </div>
              <div style={{ textAlign: 'left', direction: 'ltr' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', display: 'block', textAlign: 'right' }}>التقييم</span>
                <div style={{ color: '#F59A23', fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{'★'.repeat(ratingSuccessModal.stars)}{'☆'.repeat(5 - ratingSuccessModal.stars)}</span>
                  <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>({ratingSuccessModal.stars}/5)</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={() => setRatingSuccessModal(null)}
              style={{
                width: '100%',
                padding: '11px 20px',
                borderRadius: '10px',
                background: '#0B2E4B',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(11, 46, 75, 0.2)',
                transition: 'all 0.15s'
              }}
            >
              حسناً، العودة للجلسات
            </button>
          </div>
        </div>
      )}

      {/* Global Toast */}
      <Toast {...toast} />

    </div>
  );
}
