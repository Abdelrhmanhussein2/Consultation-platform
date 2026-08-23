import React, { useState } from 'react';
import { IconSearch } from '../components/AdminIcons';

export default function AdminPromptsPage({ navigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const prompts = [
    {
      id: 'p1',
      title: 'مساعد الاستشارات الضريبية الأساسي (System Tax Agent)',
      targetEngine: 'GPT-4o & Claude-3.5-Sonnet',
      category: 'استشارات عامة',
      status: 'نشط في الإنتاج',
      version: 'v3.2',
      updatedAt: '2026-08-22',
      systemPrompt: 'أنت مستشار ضريبي وقانوني خبير في النظام الضريبي الأردني. تجيب بدقة وفق نصوص قانون ضريبة الدخل وقانون المبيعات، وتستشهد بالمواد القانونية ذات الصلة مع التنبيه بضرورة مراجعة مدقق حسابات قانوني.'
    },
    {
      id: 'p2',
      title: 'محرك تلخيص وتحليل القوائم المالية والمستندات (Financial Document Parser)',
      targetEngine: 'Gemini-1.5-Pro',
      category: 'معالجة الوثائق',
      status: 'نشط في الإنتاج',
      version: 'v2.1',
      updatedAt: '2026-08-20',
      systemPrompt: 'قم باستخراج بيانات الدخل الإجمالي، والمصاريف التشغيلية، واقتطاعات ضريبة الدخل والضريبة العامة على المبيعات، وقدم تحليلاً للأوعية الضريبية الخاضعة وفق النسب الأردنية المعتمدة.'
    },
    {
      id: 'p3',
      title: 'منسق الاستفسارات وتوجيه العملاء (Router & Intent Classifier)',
      targetEngine: 'GPT-4o-mini',
      category: 'توجيه المحادثات',
      status: 'نشط في الإنتاج',
      version: 'v4.0',
      updatedAt: '2026-08-18',
      systemPrompt: 'قم بتصنيف استفسار المستخدم وتحديد ما إذا كان يتعلق بضريبة الدخل، أو ضريبة المبيعات، أو الجمارك، أو حجز جلسة استشارة مباشرة مع خبير معتمد.'
    }
  ];

  const filtered = prompts.filter(p => p.title.includes(searchTerm) || p.category.includes(searchTerm));

  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">AI SYSTEM PROMPTS & INSTRUCTION TUNING</div>
          <h1 className="admin-banner-title">مكتبة البرومبت وتعليمات الذكاء الاصطناعي</h1>
          <p className="admin-banner-desc">
            إدارة وتحديث التوجيهات البرمجية والـ System Prompts لنماذج الـ LLM في منصة ديوان.
          </p>
        </div>
        <button className="admin-btn-action-primary" onClick={() => alert('نافذة إضافة برومبت ذكي جديد')}>
          <span>+ إضافة برومبت جديد</span>
        </button>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-header-bar">
          <div className="admin-search-wrapper" style={{ width: '360px' }}>
            <IconSearch size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="البحث في مكتبة التوجيهات والبرومبت..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>عنوان التوجيه (Prompt Title)</th>
              <th>النموذج المستهدف</th>
              <th>التصنيف</th>
              <th>الإصدار</th>
              <th>الحالة</th>
              <th>آخر تحديث</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td><strong>{p.title}</strong></td>
                <td><span className="admin-badge-info">{p.targetEngine}</span></td>
                <td>{p.category}</td>
                <td>{p.version}</td>
                <td><span className="admin-badge-success">{p.status}</span></td>
                <td>{p.updatedAt}</td>
                <td>
                  <button 
                    className="admin-btn-action-primary" 
                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    onClick={() => setSelectedPrompt(p)}
                  >
                    تعديل التوجيه ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Prompt Editor Modal */}
      {selectedPrompt && (
        <div className="admin-modal-overlay" onClick={() => setSelectedPrompt(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>
              تعديل التوجيه: {selectedPrompt.title}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 16px 0' }}>
              النموذج: <strong>{selectedPrompt.targetEngine}</strong> — الإصدار: <strong>{selectedPrompt.version}</strong>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '6px' }}>
                نص التوجيه الموجه للنموذج (System Prompt):
              </label>
              <textarea
                className="admin-search-input"
                rows="6"
                style={{ resize: 'none', lineHeight: '1.5' }}
                value={selectedPrompt.systemPrompt}
                onChange={e => setSelectedPrompt({ ...selectedPrompt, systemPrompt: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="admin-btn-action-outline" onClick={() => setSelectedPrompt(null)}>إلغاء</button>
              <button 
                className="admin-btn-action-primary" 
                onClick={() => {
                  alert('تم حفظ وتحديث التوجيه في محرك الذكاء الاصطناعي بنجاح');
                  setSelectedPrompt(null);
                }}
              >
                حفظ ونشر التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
