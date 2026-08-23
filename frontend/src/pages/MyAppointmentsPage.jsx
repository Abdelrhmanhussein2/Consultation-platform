import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import VideoSessionModal from '../components/VideoSession/VideoSessionModal';
import { AppointmentsIcon, VideoIcon, InvoicesIcon } from '../components/UserPortal/Icons';

export default function MyAppointmentsPage({ navigate }) {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'confirmed', 'pending_payment', 'completed', 'cancelled'
  const [loading, setLoading] = useState(true);
  const [activeVideoApptId, setActiveVideoApptId] = useState(null);

  const fetchAppointments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await appointmentService.getMyAppointments(token);
      setAppointments(data || []);
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const handlePay = async (id) => {
    try {
      await appointmentService.payAppointment(id, token);
      alert('تم إتمام عملية الدفع بنجاح!');
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'فشلت عملية الدفع');
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('يرجى كتابة سبب إلغاء الاستشارة:');
    if (!reason) return;
    try {
      await appointmentService.cancelAppointment(id, reason, token);
      alert('تم إلغاء الاستشارة بنجاح');
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'فشلت عملية الإلغاء');
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'all') return true;
    return a.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>مؤكد ومجهز للميتينج</span>;
      case 'pending_payment':
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>بانتظار الدفع</span>;
      case 'completed':
        return <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>مكتملة</span>;
      case 'cancelled':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>ملغاة</span>;
      default:
        return <span style={{ background: '#F1F5F9', color: '#475569', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status}</span>;
    }
  };

  return (
    <div className="fade-in">
      {/* Title */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#E5EFF5', padding: '10px', borderRadius: '12px', color: '#005D9C' }}>
          <AppointmentsIcon size={24} color="#005D9C" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
            استشاراتي ومواعيـدي
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            إدارة وتتبع جميع الاستشارات المحجوزة، الدخول لغرف الميتينج المباشرة، أو إلغاء/إعادة جدولة المواعيد.
          </p>
        </div>
      </div>

      {/* Filter Tabs - Soft Light Blue & Warm Golden Highlight */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '14px',
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'all', label: 'جميع المواعيد' },
          { id: 'confirmed', label: 'المؤكدة والميتينج' },
          { id: 'pending_payment', label: 'بانتظار الدفع' },
          { id: 'completed', label: 'المكتملة' },
          { id: 'cancelled', label: 'الملغاة' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 20px',
                borderRadius: '25px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, #F5A52A, #E0921B)' : '#E5EFF5',
                color: isActive ? '#FFFFFF' : '#005D9C',
                fontWeight: isActive ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(245, 165, 42, 0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#005D9C' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px' }}>جاري تحميل استشاراتك ومواعيدك...</p>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAppointments.map(appt => (
            <div
              key={appt.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {getStatusBadge(appt.status)}
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>رقم الموعد: #{appt.id.substring(0, 8)}</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}>
                  {appt.consultant_name ? `استشارة مع ${appt.consultant_name}` : 'جلسة استشارية ضريبية'}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                  {new Date(appt.scheduled_at).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })} ({appt.duration_minutes || 60} دقيقة)
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {appt.status === 'confirmed' && (
                  <button
                    onClick={() => setActiveVideoApptId(appt.id)}
                    style={{
                      background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 10px rgba(245, 165, 42, 0.25)'
                    }}
                  >
                    <VideoIcon size={16} color="#FFFFFF" />
                    <span>دخول غرفة الميتينج المباشرة</span>
                  </button>
                )}

                {appt.status === 'pending_payment' && (
                  <button
                    onClick={() => handlePay(appt.id)}
                    style={{
                      background: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '20px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <InvoicesIcon size={16} color="#FFFFFF" />
                    <span>دفع {appt.amount || 50} د.أ</span>
                  </button>
                )}

                {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                  <button
                    onClick={() => handleCancel(appt.id)}
                    style={{
                      background: '#FEF2F2',
                      color: '#EF4444',
                      border: '1px solid #FCA5A5',
                      padding: '10px 16px',
                      borderRadius: '20px',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    إلغاء الموعد
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <div style={{ width: '60px', height: '60px', background: '#E5EFF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <AppointmentsIcon size={28} color="#005D9C" />
          </div>
          <h3 style={{ color: '#1E293B', marginBottom: '8px' }}>لا توجد استشارات في هذا التبويب</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>يمكنك حجز موعد جديد من دليل المستشارين.</p>
        </div>
      )}

      {/* Video Session Modal */}
      <VideoSessionModal
        appointmentId={activeVideoApptId}
        isOpen={!!activeVideoApptId}
        onClose={() => setActiveVideoApptId(null)}
        onSessionEnd={fetchAppointments}
      />
    </div>
  );
}
