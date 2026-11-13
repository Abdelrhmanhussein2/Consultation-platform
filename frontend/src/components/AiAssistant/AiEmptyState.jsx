// frontend/src/components/AiAssistant/AiEmptyState.jsx
import React from 'react';

const CARDS_DATA = [
  {
    id: 't1',
    category: 'ضريبة الدخل',
    categoryColor: '#0284C7',
    categoryBg: '#E0F2FE',
    title: 'اقتطاع من المصدر',
    text: 'ما هي نسبة الاقتطاع الملزم باقتطاعها مستأجر العقار وتوريدها للدائرة من مبلغ الإيجار؟',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    )
  },
  {
    id: 't2',
    category: 'ضريبة المبيعات',
    categoryColor: '#D97706',
    categoryBg: '#FEF3C7',
    title: 'إلغاء التسجيل الضريبي',
    text: 'أريد إلغاء تسجيل نشاط ضمن ضريبة المبيعات وما زال لدي مخزون، ما المعالجة المحاسبية؟',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    id: 't3',
    category: 'تخطيط وامتثال',
    categoryColor: '#16A34A',
    categoryBg: '#DCFCE7',
    title: 'هيكلة وتخطيط ضريبي',
    text: 'أرغب بإعادة هيكلة نشاطي لتقليل المخاطر الضريبية والامتثال، ما الخيارات المتاحة؟',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    )
  },
  {
    id: 't4',
    category: 'منازعات قضائية',
    categoryColor: '#0D3C5C',
    categoryBg: '#F1F5F9',
    title: 'الاعتراض على التقدير',
    text: 'وردني تقدير ضريبي أرى أنه مبالغ فيه، ما خطوات وإجراءات الاعتراض القانوني؟',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
        <path d="m16 16 6-6" />
        <path d="m8 8 6-6" />
      </svg>
    )
  }
];

export default function AiEmptyState({ onPickPrompt }) {
  return (
    <div className="ai-empty-state-root">
      {/* Sleek Hero Emblem */}
      <div className="ai-empty-emblem">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <path d="M5 3v4" />
          <path d="M19 17v4" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="ai-empty-title">
        كيف يمكنني مساعدتك في استشارتك اليوم؟
      </h1>

      {/* Subtitle */}
      <p className="ai-empty-subtitle">
        اسأل عن نصوص القوانين، الإقرارات، الفوترة الإلكترونية، أو قرارات المحاكم — إجابات قانونية موثقة بمراجع رسمية.
      </p>

      {/* 4 Compact Prompt Cards Grid */}
      <div className="ai-prompt-cards-grid">
        {CARDS_DATA.map((card) => (
          <button
            key={card.id}
            type="button"
            className="ai-prompt-card"
            onClick={() => onPickPrompt(card.text)}
          >
            <div className="ai-prompt-card-top">
              <div className="ai-prompt-card-icon-wrap">
                <div
                  className="ai-prompt-card-icon"
                  style={{ background: card.categoryBg, color: card.categoryColor }}
                >
                  {card.icon}
                </div>
                <span
                  className="ai-prompt-card-tag"
                  style={{ background: card.categoryBg, color: card.categoryColor }}
                >
                  {card.category}
                </span>
              </div>
              <span className="ai-prompt-card-arrow">‹</span>
            </div>

            <h3 className="ai-prompt-card-title">{card.title}</h3>
            <p className="ai-prompt-card-desc">{card.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
