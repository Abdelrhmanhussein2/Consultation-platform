// frontend/src/components/AiAssistant/AiCitationItem.jsx
import React from 'react';

export function getCitationKindLabel(kind) {
  switch (kind) {
    case 'instruction':
    case 'interpretation':
    case 'circular':
      return 'التعليمات التنفيذية / القرار التفسيري';
    case 'precedent':
      return 'السابقة القضائية المرجعية';
    case 'regulation':
      return 'النظام الناظم';
    default:
      return 'المادة القانونية';
  }
}

export function truncateText(text, max = 45) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 3) + '…' : text;
}

export function QuoteBox({ text }) {
  if (!text) return null;
  return (
    <div className="ai-quote-box">
      <span className="ai-quote-icon">“</span>
      <div>"{text}"</div>
    </div>
  );
}

export function CitationPill({ item, onClick }) {
  if (!item) return null;
  const articleNum = item.paragraph ? `${item.article}/${item.paragraph}` : (item.article || '—');

  return (
    <button
      type="button"
      className="ai-citation-pill"
      onClick={() => onClick && onClick(item)}
      title="انقر لعرض المادة والمصدر"
    >
      <span>📖</span>
      <span>المادة {articleNum}</span>
      <span style={{ color: '#475569', fontWeight: 500 }}>
        — {truncateText(item.source, 48)}
      </span>
    </button>
  );
}

export default function AiCitationItem({ item, onOpenArticle }) {
  const kindLabel = getCitationKindLabel(item.kind);

  return (
    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
      <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>•</span>
        <span>{kindLabel}:</span>
      </div>

      <CitationPill item={item} onClick={onOpenArticle} />

      {item.quote && <QuoteBox text={item.quote} />}
    </div>
  );
}
