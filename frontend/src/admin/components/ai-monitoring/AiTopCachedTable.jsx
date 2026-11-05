import React from 'react';

export default function AiTopCachedTable({ queries }) {
  const items = queries || [];

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        marginBottom: '24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            الاستعلامات الأكثر تكراراً واستفادة من الكاش
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
            الأسئلة التي تكررت وحققت أعلى وفورات في التوكينز وزمن الاستجابة
          </p>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', background: '#F0F9FF', padding: '4px 10px', borderRadius: '6px' }}>
          {items.length} أسئلة مفهرسة
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: '#94A3B8', fontSize: '13px' }}>
          لا توجد استعلامات مخزنة في الكاش خلال هذه الفترة حتى الآن
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B', fontSize: '12px' }}>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>نوع الكاش</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>معرّف الكاش / المفتاح</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>الوضع</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>مرات التكرار (Hits)</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>متوسط التوكينز</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>إجمالي التوكينز الموفرة</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>التوفير المالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((q, idx) => {
                const isExact = q.cache_type === 'exact';
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #F8FAFC',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isExact ? '#E0F2FE' : '#FEF3C7',
                          color: isExact ? '#0369A1' : '#B45309'
                        }}
                      >
                        {isExact ? 'تطابق دقيق (Redis)' : 'دلالي (Qdrant)'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#0F172A', fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>
                      {q.cache_key || '—'}
                    </td>
                    <td style={{ padding: '12px', color: '#64748B' }}>
                      {q.mode || 'default'}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#0284C7' }}>
                      {q.hit_count}x
                    </td>
                    <td style={{ padding: '12px', color: '#475569' }}>
                      {(q.avg_tokens || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#16A34A' }}>
                      {(q.total_tokens_saved || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#D97706' }}>
                      ${q.estimated_cost_saved_usd || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

