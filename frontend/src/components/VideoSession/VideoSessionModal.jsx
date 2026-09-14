import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import './VideoSessionModal.css';

export default function VideoSessionModal({ appointmentId, isOpen, onClose, onSessionEnd, onRequestRating }) {
  const { token, user } = useAuth();
  const [roomUrl, setRoomUrl] = useState('');
  const [meetingToken, setMeetingToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState(null);
  const [markingNoShow, setMarkingNoShow] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  const isConsultant = user?.role === 'consultant' || user?.role === 'platform_consultant';

  const fetchAttendance = async () => {
    if (!appointmentId || !token || appointmentId === 'test-session-id') return;
    try {
      const data = await appointmentService.getSessionAttendance(appointmentId, token);
      setAttendance(data);
    } catch (err) {
      console.warn('Could not fetch attendance status:', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !appointmentId || !token) return;

    let isMounted = true;
    setLoading(true);
    setError('');
    setNotificationMsg('');

    const initSession = async () => {
      try {
        // Joining video session automatically records attendance timestamp in backend
        const data = await appointmentService.joinVideoSession(appointmentId, token);
        if (isMounted) {
          setRoomUrl(data.room_url);
          setMeetingToken(data.token);
          setLoading(false);
          // Fetch initial attendance snapshot
          fetchAttendance();
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'تعذر الانضمام إلى غرفة الميتينج');
          setLoading(false);
        }
      }
    };

    initSession();

    // Set up polling for attendance updates every 7 seconds
    const interval = setInterval(() => {
      fetchAttendance();
    }, 7000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, appointmentId, token]);

  if (!isOpen) return null;

  const fullIframeSrc = roomUrl && meetingToken ? `${roomUrl}?t=${meetingToken}` : roomUrl;

  const handleEndMeeting = () => {
    onClose();
    if (onSessionEnd) onSessionEnd();
  };

  const handleMarkUserNoShow = async () => {
    if (!window.confirm('هل تؤكد أن العميل لم يحضر الجلسة بعد انتهاء المهلة المقررة؟ سيتم تسجيل عدم الحضور كخطأ من جانب العميل وإنهاء الجلسة.')) {
      return;
    }

    setMarkingNoShow(true);
    try {
      await appointmentService.markNoShow(appointmentId, token);
      setNotificationMsg('تم تسجيل غياب العميل بنجاح (المشكلة من العميل). سيتم إغلاق الجلسة الآن.');
      setTimeout(() => {
        handleEndMeeting();
      }, 1800);
    } catch (err) {
      alert(err.message || 'تعذر تسجيل غياب العميل');
      setMarkingNoShow(false);
    }
  };

  const handleRateConsultant = () => {
    onClose();
    if (onRequestRating) {
      onRequestRating(appointmentId);
    } else if (onSessionEnd) {
      onSessionEnd();
    }
  };

  const formatTimeOnly = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="video-modal-overlay">
      <div className="video-modal-container fade-in">
        {/* Header */}
        <div className="video-modal-header">
          <div className="video-modal-title">
            <span>📹 غرفة الميتينج المباشرة</span>
            <span className="live-indicator-badge">
              <span>●</span> بث مباشر نشط
            </span>
          </div>
          <button
            onClick={handleEndMeeting}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Live Attendance Tracking Bar */}
        {attendance && (
          <div className="video-attendance-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {isConsultant ? (
                <>
                  <span style={{ fontWeight: '700', color: '#CBD5E1' }}>
                    حضور المستشار: <strong style={{ color: '#34D399' }}>متواجد داخل الغرفة</strong>
                    {attendance.room_opened_at && ` (فُتحت: ${formatTimeOnly(attendance.room_opened_at)})`}
                  </span>

                  {attendance.is_user_present || attendance.user_joined_at ? (
                    <span className="attendance-pill present">
                      ● العميل متواجد داخل الغرفة (حضر الطرفان)
                    </span>
                  ) : (
                    <span className="attendance-pill waiting">
                      ⏳ في انتظار دخول العميل... (مهلة الحضور 15 دقيقة)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span style={{ fontWeight: '700', color: '#CBD5E1' }}>
                    حضور العميل: <strong style={{ color: '#34D399' }}>أنت متواجد في الغرفة</strong>
                  </span>

                  {attendance.is_consultant_present || attendance.room_opened_at ? (
                    <span className="attendance-pill present">
                      ● المستشار متواجد داخل الغرفة
                    </span>
                  ) : (
                    <span className="attendance-pill waiting">
                      ⏳ في انتظار فتح المستشار للغرفة...
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Attendance Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {notificationMsg && (
                <span style={{ color: '#34D399', fontSize: '12px', fontWeight: '800' }}>
                  {notificationMsg}
                </span>
              )}

              {isConsultant && !attendance.is_user_present && !attendance.user_joined_at && attendance.can_mark_user_no_show && (
                <button
                  className="mark-noshow-btn"
                  onClick={handleMarkUserNoShow}
                  disabled={markingNoShow}
                  title="انتهت مهلة 15 دقيقة المخصصة لحضور العميل"
                >
                  {markingNoShow ? 'جاري التسجيل...' : 'تسجيل غياب العميل (المشكلة من العميل) ❌'}
                </button>
              )}

              {!isConsultant && !attendance.is_consultant_present && !attendance.room_opened_at && attendance.can_rate_consultant && (
                <button
                  className="rate-consultant-btn"
                  onClick={handleRateConsultant}
                  title="المستشار لم يحضر بعد انتهاء المهلة المحددة"
                >
                  ⭐ المستشار لم يحضر (تقييم وتقديم بلاغ)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Video Body Frame */}
        <div className="video-frame-body">
          {loading && (
            <div className="video-loading-state">
              <div className="spinner" style={{ borderTopColor: '#005D9C' }}></div>
              <p>جاري الاتصال بالغرفة المباشرة وتوثيق الحضور في قاعدة البيانات...</p>
            </div>
          )}

          {error && (
            <div className="video-error-state">
              <span style={{ fontSize: '48px' }}>⚠️</span>
              <h3>تعذر دخول الميتينج</h3>
              <p>{error}</p>
              <button className="end-meeting-btn" onClick={onClose}>إغلاق النافذة</button>
            </div>
          )}

          {!loading && !error && fullIframeSrc && (
            <iframe
              src={fullIframeSrc}
              title="Daily.co Video Meeting"
              allow="camera; microphone; display-capture; autoplay; clipboard-write"
            ></iframe>
          )}
        </div>

        {/* Footer Actions */}
        <div className="video-modal-footer">
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>
            🔒 ميتينج مشفر بالكامل ومحمي ومسجل حضور الطرفين رسميًا
          </span>
          <button className="end-meeting-btn" onClick={handleEndMeeting}>
            إنهاء الميتينج والخروج 📞
          </button>
        </div>
      </div>
    </div>
  );
}
