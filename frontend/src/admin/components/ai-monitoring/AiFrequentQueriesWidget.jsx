import React from 'react';

export default function AiFrequentQueriesWidget({ queries }) {
  const items = queries && queries.length > 0 ? queries.slice(0, 5) : [];

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>أكثر الاستفسارات تكراراً</h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>أعلى 5 أسئلة استفسر عنها المستخدمون والتوفير المحقق</p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0E3B5E', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>
          {items.length} أسئلة
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '45px 0', color: '#94A3B8', fontSize: '13px' }}>
          لا توجد استفسارات متكررة مسجلة في هذه الفترة حتى الآن
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((q, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #F1F5F9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#FEF3C7',
                    color: '#B45309',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {q.count}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {q.text}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    {q.segment}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'left', flexShrink: 0, paddingRight: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                  {(q.tokens_saved || 0).toLocaleString()} token
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
