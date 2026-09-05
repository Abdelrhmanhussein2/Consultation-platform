import React from 'react';
import { grad } from './consultantFilterUtils';

/**
 * ConsultantListCard — بطاقة عرض المستشار في قائمة التصفح.
 */
export default function ConsultantListCard({ c, idx, onBook, onView, list, isMe }) {
  const name   = c.full_name || c.name || 'مستشار';
  const init   = name.slice(0, 2);
  const hasRating = c.average_rating !== null && c.average_rating !== undefined && Number(c.average_rating) > 0;
  const ratingStr = hasRating ? Number(c.average_rating).toFixed(1) : 'جديد';

  return (
    <div
      className={`cp-card ${isMe ? 'is-me-card' : ''}`}
      onClick={() => onView && onView(c)}
      style={isMe ? { border: '2px solid #005D9C', background: '#F0F9FF' } : {}}
    >
      <div className="cp-photo-wrap">
        {c.profile_image_url || c.img
          ? <img src={c.profile_image_url || c.img} alt={name} />
          : <div className="cp-avatar-initials" style={{ background: grad(idx), color: '#fff' }}>{init}</div>
        }
        <span className="cp-topic-pill">{c.specialization_name || 'ضريبة'}</span>
        <span className="cp-rating-pill">⭐ {ratingStr}</span>
      </div>

      <div className="cp-card-body">
        <div className="cp-name-price">
          <h3>
            {name}
            {isMe && (
              <span style={{ marginRight: '8px', fontSize: '11px', background: '#005D9C', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                أنت (حسابك)
              </span>
            )}
          </h3>
          <div className="cp-price">
            {c.price ?? c.price_per_hour ?? 50} <span>د.أ/جلسة</span>
          </div>
        </div>
        <div className="cp-meta">📍 {c.city || 'الأردن'} · 💼 {c.years_of_experience || 10} سنة · {c.ratings_count || 0} تقييم</div>
        <span className="cp-tier">{isMe ? 'حسابك الشخصي' : (c.tier || 'مستشار معتمد')}</span>
        <p className="cp-desc">{c.bio || 'خبير ومستشار ضريبي بخبرة تزيد عن 20 سنة في الاستشارات الضريبية والتدقيق.'}</p>
        <div className="cp-card-actions" onClick={e => e.stopPropagation()}>
          <button className="cp-view-btn" onClick={() => onView && onView(c)}>الملف الكامل</button>
          <button className="cp-book-btn" onClick={() => onBook && onBook(c)}>{isMe ? 'معاينة ملفك' : 'احجز الآن'}</button>
        </div>
      </div>
    </div>
  );
}
