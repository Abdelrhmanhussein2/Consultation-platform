import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import VideoSessionModal from '../components/VideoSession/VideoSessionModal';

export default function MyAppointmentsPage({ navigate }) {
  const { token } = useAuth();
  
  // States
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  const [loading, setLoading] = useState(true);
  const [activeVideoApptId, setActiveVideoApptId] = useState(null);

  const fetchAppointments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await appointmentService.getMyAppointments(token);
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
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

  // Stats Calculations
  const activeCount = appointments.filter(a => ['confirmed', 'pending_payment', 'pending_approval'].includes(a.status)).length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => ['cancelled', 'cancelled_by_user', 'cancelled_by_consultant', 'rejected'].includes(a.status)).length;

  // Filter Appointments by Tab
  const getFilteredAppointments = () => {
    switch (activeTab) {
      case 'active':
        return appointments.filter(a => ['confirmed', 'pending_payment', 'pending_approval'].includes(a.status));
      case 'completed':
        return appointments.filter(a => a.status === 'completed');
      case 'cancelled':
        return appointments.filter(a => ['cancelled', 'cancelled_by_user', 'cancelled_by_consultant', 'rejected'].includes(a.status));
      case 'all':
      default:
        return appointments;
    }
  };

  // Get status badge UI
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>مؤكدة</span>;
      case 'pending_payment':
      case 'pending_approval':
        return <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>مقبولة</span>;
      case 'completed':
        return <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>مكتملة</span>;
      case 'cancelled':
      case 'cancelled_by_user':
      case 'cancelled_by_consultant':
      case 'rejected':
        return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>ملغاة</span>;
      default:
        return <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>معلقة</span>;
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

  const filteredAppointments = getFilteredAppointments();
  
  // Show first 5 upcoming confirmed appointments
  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed').slice(0, 5);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>📅</span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>استشاراتي</h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '6px 0 0 0' }}>جميع طلبات الاستشارة ومواعيدك في مكان واحد.</p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/consultants')}
            style={{
              background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(245, 165, 42, 0.25)'
            }}
          >
            + طلب استشارة جديدة
          </button>
          
          <button
            onClick={() => setActiveVideoApptId('test-session-id')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#64748B',
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
            <span>⚙️</span>
            <span>تجربة غرفة الفيديو الآن</span>
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
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(13, 60, 92, 0.02)' }}>
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
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#334155', margin: '0 0 4px 0' }}>
                    {appt.service_name || appt.notes || 'جلسة استشارية ضريبية'}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    {formatDateStr(appt.scheduled_at)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {getStatusBadge(appt.status)}
                  <button
                    onClick={() => setActiveVideoApptId(appt.id)}
                    style={{
                      backgroundColor: '#F5A52A',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>📹</span>
                    <span>دخول الغرفة</span>
                  </button>
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
          { id: 'completed', label: 'المكتملة' },
          { id: 'cancelled', label: 'الملغاة/المرفوضة' }
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
        <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          <div style={{ width: '60px', height: '60px', background: '#E5EFF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            📥
          </div>
          <h3 style={{ color: '#1E293B', marginBottom: '8px' }}>لا توجد استشارات في هذا التبويب</h3>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    {getStatusBadge(appt.status)}
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>رقم المعاملة: #{appt.id.substring(0, 8)}</span>
                  </div>
                  
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 6px 0' }}>
                    {appt.service_name || 'جلسة تجريبية - اختبار الفيديو والملخص الذكي'}
                  </h3>

                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>
                    {isConfirmed ? (
                      `جلسة فيديو - يمكن الدخول ومراجعة السجل في أي حالة (${formatDateStr(appt.scheduled_at)})`
                    ) : isPendingPayment || isPendingApproval ? (
                      `غرفة تجريبية لاختيار المكالمة، التفريغ الصوتي، والملخص الذكي. الموعد المختار: ${formatDateStr(appt.scheduled_at)}`
                    ) : (
                      `الموعد المفضل: ${formatDateStr(appt.scheduled_at)} القناة: فيديو المستشار المطلوب`
                    )}
                  </p>
                </div>

                {/* Actions Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  
                  {isConfirmed && (
                    <button
                      onClick={() => setActiveVideoApptId(appt.id)}
                      style={{
                        backgroundColor: '#F5A52A',
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
                      <span>📹</span>
                      <span>دخول الغرفة</span>
                    </button>
                  )}

                  {isPendingPayment && (
                    <button
                      onClick={() => handlePay(appt.id)}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      دفع {appt.amount || appt.price || 50} د.أ
                    </button>
                  )}

                  {(isPendingApproval || isPendingPayment || isConfirmed) && (
                    <button
                      onClick={() => navigate('/chat')}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#64748B',
                        padding: '10px 18px',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>💬</span>
                      <span>راسل المستشار</span>
                    </button>
                  )}

                  {appt.status !== 'cancelled' && appt.status !== 'completed' && appt.status !== 'cancelled_by_user' && appt.status !== 'cancelled_by_consultant' && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      style={{
                        backgroundColor: '#FEF2F2',
                        color: '#EF4444',
                        border: '1px solid #FCA5A5',
                        padding: '10px 18px',
                        borderRadius: '20px',
                        fontWeight: '700',
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
      />

    </div>
  );
}
