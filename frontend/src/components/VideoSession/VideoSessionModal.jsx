import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import './VideoSessionModal.css';

export default function VideoSessionModal({ appointmentId, isOpen, onClose, onSessionEnd }) {
  const { token } = useAuth();
  const [roomUrl, setRoomUrl] = useState('');
  const [meetingToken, setMeetingToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !appointmentId || !token) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    const initSession = async () => {
      try {
        const data = await appointmentService.joinSession(appointmentId, token);
        if (isMounted) {
          setRoomUrl(data.room_url);
          setMeetingToken(data.token);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'تعذر الانضمام إلى غرفة الميتينج');
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, [isOpen, appointmentId, token]);

  if (!isOpen) return null;

  const fullIframeSrc = roomUrl && meetingToken ? `${roomUrl}?t=${meetingToken}` : roomUrl;

  const handleEndMeeting = () => {
    onClose();
    if (onSessionEnd) onSessionEnd();
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

        {/* Video Body Frame */}
        <div className="video-frame-body">
          {loading && (
            <div className="video-loading-state">
              <div className="spinner" style={{ borderTopColor: '#005D9C' }}></div>
              <p>جاري الاتصال بالغرفة المباشرة وتأكيد التوكن...</p>
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
            🔒 ميتينج مشفر بالكامل ومحمي بين العميل والمستشار
          </span>
          <button className="end-meeting-btn" onClick={handleEndMeeting}>
            إنهاء الميتينج والخروج 📞
          </button>
        </div>
      </div>
    </div>
  );
}
