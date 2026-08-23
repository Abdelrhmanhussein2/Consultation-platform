import React from 'react';
import { IconAiMonitoring, IconSparkles } from '../components/AdminIcons';

export default function AdminAiMonitoringPage({ navigate }) {
  const queries = [
    {
      id: 'q1',
      user: 'أحمد العبداللات',
      question: 'كيف يتم احتساب ضريبة المبيعات على الخدمات الاستشارية في القانون الأردني؟',
      tokens: 420,
      model: 'Groq LLaMA 3.3 70B / Cohere Rerank',
      time: '2026-08-23 15:10',
      status: 'success'
    },
    {
      id: 'q2',
      user: 'شركة أفق للتقنية',
      question: 'ما هي نسبة الخصم المسموح بها لمصاريف البحث والتطوير في قانون ضريبة الدخل رقم 34؟',
      tokens: 610,
      model: 'Groq LLaMA 3.3 70B / Qdrant RAG',
      time: '2026-08-23 14:22',
      status: 'success'
    }
  ];

  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">AI INFERENCE & RAG MONITORING</div>
          <h1 className="admin-banner-title">رقابة الذكاء الاصطناعي والبحث الدلالي</h1>
          <p className="admin-banner-desc">
            متابعة استفسارات المساعد الذكي، استهلاك الـ Tokens، ودقة نتائج استرجاع المعرفة الضريبية (RAG).
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <div className="admin-card">
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>إجمالي استفسارات AI</span>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>351 استشارة</div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>رسائل مؤرشفة قابلة للمراجعة</div>
        </div>

        <div className="admin-card">
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>استهلاك Tokens اليوم</span>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#E58A13', marginTop: '6px' }}>142.8K</div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>ضمن الحدود التشغيلية المعتمدة</div>
        </div>

        <div className="admin-card">
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '700' }}>معدل الاستجابة والـ Rerank</span>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284C7', marginTop: '6px' }}>0.85 ثانية</div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>استرجاع فائق السرعة عبر Qdrant</div>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <h3 className="admin-card-title">أحدث استفسارات المساعد الذكي</h3>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>السؤال والاستفسار</th>
              <th>الـ Tokens</th>
              <th>المحرك والنظام</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            {queries.map(q => (
              <tr key={q.id}>
                <td><strong>{q.user}</strong></td>
                <td style={{ maxWidth: '400px', color: '#1E293B' }}>{q.question}</td>
                <td><span className="admin-badge-info">{q.tokens}</span></td>
                <td><span className="admin-badge-warning">{q.model}</span></td>
                <td>{q.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
