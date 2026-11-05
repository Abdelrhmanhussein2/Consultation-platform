import React, { useState } from 'react';

export default function AiCachedQueriesTabTable({ cachedQueries, failedQueries, hitRate = 0 }) {
  const [activeTab, setActiveTab] = useState('cached');
  const cachedList = cachedQueries || [];
  const failedList = failedQueries || [];

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
      {/* Tabs Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('cached')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: '8px', border: activeTab === 'cached' ? '1px solid #0E3B5E' : '1px solid #E2E8F0',
            background: activeTab === 'cached' ? '#0E3B5E' : '#FFFFFF', color: activeTab === 'cached' ? '#FFFFFF' : '#64748B',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          <span>الاستفسارات المحفوظة ({cachedList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('failed')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: '8px', border: activeTab === 'failed' ? '1px solid #DC2626' : '1px solid #E2E8F0',
            background: activeTab === 'failed' ? '#FEF2F2' : '#FFFFFF', color: activeTab === 'failed' ? '#DC2626' : '#64748B',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          <span>استفسارات غير مجابة ({failedList.length})</span>
        </button>
      </div>

      {/* Green Banner */}
      {activeTab === 'cached' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '8px', marginBottom: '16px', fontSize: '12.5px', color: '#166534' }}>
          <span>يتم احتساب معدلات التوفير لحظياً عبر الـ Exact Cache (Redis) والـ Semantic Cache (Qdrant).</span>
          <span style={{ fontWeight: 800, background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
            متوسط التوفير: {hitRate}% في زمن الرد
          </span>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {activeTab === 'cached' ? (
          cachedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '45px 0', color: '#94A3B8', fontSize: '13px' }}>
              لا توجد استفسارات مخزنة في الكاش خلال هذه الفترة حتى الآن
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B', fontSize: '12px' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>الاستفسار المخزن بالكاش</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>التصنيف</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>استدعاءات الكاش</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>زمن الاستجابة</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>التوفير بالـ Tokens</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>آخر استدعاء</th>
                </tr>
              </thead>
              <tbody>
                {cachedList.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#0F172A', maxWidth: '340px' }}>{row.question}</td>
                    <td style={{ padding: '12px', color: '#64748B' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', fontSize: '11px', fontWeight: 600 }}>{row.category}</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#16A34A' }}>{row.cache_hits} مرات</td>
                    <td style={{ padding: '12px', color: '#0284C7', fontWeight: 700 }}>{row.response_time}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#D97706' }}>{row.saved_tokens}</td>
                    <td style={{ padding: '12px', color: '#64748B', fontSize: '12px' }}>{row.last_cached}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          failedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '45px 0', color: '#16A34A', fontSize: '13px', fontWeight: 600 }}>
              ممتاز! لا توجد استفسارات غير مجابة خلال هذه الفترة.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#64748B', fontSize: '12px' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>الاستفسار</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>السبب</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>الحالة</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>الوقت</th>
                </tr>
              </thead>
              <tbody>
                {failedList.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F8FAFC' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#0F172A' }}>{row.question}</td>
                    <td style={{ padding: '12px', color: '#DC2626' }}>{row.reason}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#FEF2F2', color: '#DC2626', fontSize: '11px', fontWeight: 700 }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748B', fontSize: '12px' }}>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
