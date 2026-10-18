// frontend/src/components/AiAssistant/AiStructuredAnswer.jsx
import React, { useState } from 'react';
import AiCitationItem, { CitationPill } from './AiCitationItem';

export default function AiStructuredAnswer({ payload, onFollowUp, onOpenArticle }) {
  const [copied, setCopied] = useState(false);
  const { greeting, sections = [], legal_basis = [], follow_ups = [], disclaimer } = payload || {};

  const handleCopy = () => {
    let fullText = [];
    if (greeting) fullText.push(greeting);
    sections.forEach((s, idx) => {
      fullText.push(`\n${idx + 1}) ${s.title}`);
      if (s.body) fullText.push(s.body);
      if (s.items) s.items.forEach((it) => fullText.push(`- ${it.source || it}`));
    });
    navigator.clipboard.writeText(fullText.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (type) => {
    const text = 'استشارة ضريبية من ديوان:\n' + window.location.href;
    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (type === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent('استشارة ديوان')}&body=${encodeURIComponent(text)}`;
    }
  };

  return (
    <div className="ai-assistant-card">
      {/* Greeting */}
      {greeting && <p className="ai-card-greeting">{greeting}</p>}

      {/* Sections */}
      {sections.map((sec, idx) => (
        <div key={idx} style={{ marginBottom: '14px' }}>
          <h3 className="ai-section-title">
            {idx + 1}) {sec.title}
          </h3>

          {sec.body && <p className="ai-section-body">{sec.body}</p>}

          {sec.type === 'legal_basis' && sec.items && (
            <div>
              {sec.items.map((it, itIdx) => (
                <AiCitationItem key={itIdx} item={it} onOpenArticle={onOpenArticle} />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Citations Summary */}
      {legal_basis.length > 0 && (
        <div style={{ paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, marginBottom: '6px' }}>
            📚 المراجع المستند إليها:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {legal_basis.map((item, idx) => (
              <CitationPill key={idx} item={item} onClick={onOpenArticle} />
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Questions */}
      {follow_ups.length > 0 && (
        <div className="ai-followup-box">
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#D97706', marginBottom: '8px' }}>
            ✨ أسئلة مقترحة للمتابعة:
          </div>
          {follow_ups.map((f, fIdx) => (
            <button
              key={fIdx}
              type="button"
              className="ai-followup-item"
              onClick={() => onFollowUp && onFollowUp(f.label)}
            >
              <span className="ai-followup-num">{fIdx + 1}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="ai-disclaimer-box">
        <strong>تنبيه هام: </strong>
        <span>{disclaimer || 'هذا الرأي المهني يعتمد على الوقائع المعروضة والمصادر المذكورة...'}</span>
      </div>

      {/* Expert Consultation Banner */}
      <div className="ai-expert-cta-banner">
        <div>
          <div style={{ fontWeight: 800, fontSize: '13px', color: '#92400E' }}>
            يحتاج إجابة دقيقة ومفصلة؟
          </div>
          <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '2px' }}>
            احجز استشارة فورية مع أحد مستشارينا المعتمدين المتخصصين في كل التخصصات الضريبية
          </div>
        </div>
        <button
          className="ai-cta-btn"
          onClick={() => window.location.href = '/consultants'}
        >
          احجز استشارة فورية — 85 دينار
        </button>
      </div>

      {/* Bottom Message Actions Toolbar */}
      <div className="ai-msg-toolbar">
        <button className="ai-msg-tool-btn" onClick={handleCopy}>
          <span>{copied ? '✓' : '📋'}</span>
          <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
        </button>
        <button className="ai-msg-tool-btn" onClick={() => window.print()}>
          <span>🖨️</span>
          <span>طباعة</span>
        </button>
        <button className="ai-msg-tool-btn" onClick={() => handleShare('whatsapp')}>
          <span>💬</span>
          <span>واتساب</span>
        </button>
        <button className="ai-msg-tool-btn" onClick={() => handleShare('email')}>
          <span>✉️</span>
          <span>إيميل</span>
        </button>
      </div>
    </div>
  );
}
