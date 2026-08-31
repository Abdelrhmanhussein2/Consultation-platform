import React from 'react';

export default function ConsultantCard({ consultant = {}, onBook, onViewDetails }) {
  if (!consultant) return null;

  const fullName = consultant.full_name || consultant.name || 'مستشار ضريبي معتمد';
  const ratingAvg = typeof consultant.average_rating === 'number' ? consultant.average_rating.toFixed(1) : (consultant.average_rating || '5.0');
  const firstLetter = fullName ? fullName.charAt(0).toUpperCase() : 'م';
  const profileId = consultant.profile_id || consultant.id || '';

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Top Header Badge & Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            background: '#D1FAE5',
            color: '#065F46',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: '700'
          }}
        >
          متاح الآن
        </span>

        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '16px',
            boxShadow: '0 3px 8px rgba(245, 165, 42, 0.25)'
          }}
        >
          {firstLetter}
        </div>
      </div>

      {/* Info Details */}
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginBottom: '2px' }}>
          {fullName}
        </h3>
        <p style={{ fontSize: '12px', color: '#005D9C', fontWeight: '600', marginBottom: '8px' }}>
          {consultant.specialization_name || 'استشارات ضريبة الدخل والمبيعات'}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#64748B',
            flexWrap: 'wrap',
            marginBottom: '8px'
          }}
        >
          <span>📍 الأردن</span>
          <span>•</span>
          <span>⭐ {ratingAvg}</span>
          <span>•</span>
          <span>💼 {consultant.years_of_experience || 10} سنة خبرة</span>
        </div>

        <p
          style={{
            fontSize: '12px',
            color: '#475569',
            lineHeight: '1.4',
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {consultant.bio || 'مستشار وخبير ضريبي معتمد في الاستشارات الضريبية وتدقيق الحسابات والاعتراضات.'}
        </p>
      </div>

      {/* Services Tags with Soft Light Blue */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          fontSize: '10px',
          color: '#005D9C',
          background: '#E5EFF5',
          padding: '6px 10px',
          borderRadius: '10px',
          fontWeight: '600'
        }}
      >
        <span>جلسات فيديو</span>
        <span>•</span>
        <span>محادثات مأمنة</span>
        <span>•</span>
        <span>تقارير مكتوبة</span>
      </div>

      {/* Price & Action Buttons */}
      <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748B' }}>سعر الجلسة</span>
          <span style={{ fontSize: '17px', fontWeight: '800', color: '#F5A52A' }}>
            {consultant.price || 50} <span style={{ fontSize: '11px', fontWeight: '600' }}>د.أ / جلسة</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => onViewDetails && onViewDetails(profileId)}
            style={{
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0',
              padding: '8px',
              borderRadius: '20px',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            الملف الكامل
          </button>
          <button
            onClick={() => onBook && onBook(consultant)}
            style={{
              background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(245, 165, 42, 0.2)'
            }}
          >
            احجز الموعد
          </button>
        </div>
      </div>
    </div>
  );
}
