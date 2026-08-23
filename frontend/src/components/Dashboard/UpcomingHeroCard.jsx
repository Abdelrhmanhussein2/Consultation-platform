import React from 'react';
import { VideoIcon, InvoicesIcon } from '../UserPortal/Icons';

export default function UpcomingHeroCard({ appointment, onJoinVideo, onPay }) {
  if (!appointment) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          color: '#1E293B',
          padding: '28px',
          borderRadius: '20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div>
          <div style={{ display: 'inline-block', background: '#F0F7FF', color: '#005D9C', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>
            منصة ديوان للاستشارات
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>مرحباً بك في منصة ديوان للاستشارات الضريبية</h2>
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>لا توجد استشارات قادمة حالياً. يمكنك تصفح دليل المستشارين وحجز جلسة استشارية جديدة.</p>
        </div>
      </div>
    );
  }

  const isConfirmed = appointment.status === 'confirmed';
  const isPendingPay = appointment.status === 'pending_payment';

  const dateStr = new Date(appointment.scheduled_at).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timeStr = new Date(appointment.scheduled_at).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      style={{
        background: '#FFFFFF',
        color: '#1E293B',
        padding: '28px',
        borderRadius: '20px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            {isConfirmed ? 'موعد محجوز ومؤكد' : 'بانتظار الدفع'}
          </span>
          <span style={{ fontSize: '13px', color: '#64748B' }}>جلسة استشارة ضريبية</span>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
          {appointment.consultant_name ? `استشارة مع ${appointment.consultant_name}` : 'جلسة استشارية قادمة'}
        </h2>

        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>
          {dateStr} - الساعة {timeStr} ({appointment.duration_minutes || 60} دقيقة)
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isConfirmed && (
            <button
              onClick={() => onJoinVideo(appointment.id)}
              style={{
                background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(245, 165, 42, 0.3)'
              }}
            >
              <VideoIcon size={18} color="#FFFFFF" />
              <span>دخول غرفة الميتينج المباشرة</span>
            </button>
          )}

          {isPendingPay && (
            <button
              onClick={() => onPay(appointment.id)}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <InvoicesIcon size={18} color="#FFFFFF" />
              <span>دفع رسوم الاستشارة الآن</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
