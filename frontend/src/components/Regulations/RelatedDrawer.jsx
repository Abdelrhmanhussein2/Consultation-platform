// frontend/src/components/Regulations/RelatedDrawer.jsx
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import AiRichMessage from '../AiAssistant/AiRichMessage';

/**
 * RelatedDrawer - نافذة صغيرة في منتصف الشاشة لسؤال ديوان عن القانون
 */
export default function RelatedDrawer({ isOpen, onClose, law }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const quickQuestions = [
    { label: 'نسب الضريبة', query: 'ما هي نسب وشرائح ضريبة الدخل في هذا القانون؟' },
    { label: 'الإعفاءات', query: 'ما هي الإعفاءات المقررة للأفراد والأسرة؟' },
    { label: 'عقوبات التهرب', query: 'ما هي عقوبات التهرب الضريبي وفق القانون؟' },
    { label: 'التعديلات', query: 'ما هي أهم التعديلات التي طرأت على هذا القانون؟' },
    { label: 'السوابق القضائية', query: 'هل توجد سوابق قضائية مرتبطة بهذا القانون؟' },
  ];

  useEffect(() => {
    if (isOpen && law) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: `أهلاً بك! يمكنك سؤالي عن أي استفسار حول "${law.title || 'هذا القانون'}". اختر من الأسئلة السريعة أو اكتب استفسارك مباشرة.`
        }
      ]);
    }
  }, [isOpen, law]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // إغلاق عبر Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !law) return null;

  const getAnswer = async (q) => {
    try {
      const res = await fetch('/api/legal/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          law_id: law?.law_id || law?.id || '',
          law_title: law?.title || ''
        })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.answer;
    } catch (err) {
      console.error('Ask law error:', err);
      return `عذراً، حدث خطأ أثناء البحث عن إجابة. يرجى المحاولة مرة أخرى أو حجز استشارة متخصصة.`;
    }
  };

  const handleSend = async (text) => {
    const q = text || inputText;
    if (!q.trim() || loading) return;

    setMessages((prev) => [...prev, { id: String(Date.now()), role: 'user', text: q.trim() }]);
    setInputText('');
    setLoading(true);

    try {
      const answer = await getAnswer(q.trim());
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: 'assistant', text: answer }
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: 'assistant', text: 'حدث خطأ أثناء معالجة السؤال. يرجى المحاولة مرة أخرى.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12, 43, 62, 0.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {/* المربع في المنتصف بحجم مريح ومناسب للقراءة */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '850px',
          maxWidth: '95vw',
          height: '680px',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3)',
          border: '1px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          direction: 'rtl',
          fontFamily: "'Cairo', sans-serif"
        }}
      >
        {/* شريط العنوان */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚖️</span>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0D3C5C', fontWeight: 800 }}>
                اسأل ديوان عن القانون
              </h3>
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
              {law?.title || 'قانون ضريبة الدخل'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              fontSize: '16px',
              color: '#475569',
              cursor: 'pointer',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          >
            ✕
          </button>
        </div>

        {/* أسئلة سريعة */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            background: '#ffffff'
          }}
        >
          {quickQuestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              disabled={loading}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0D3C5C';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F8FAFC';
                e.currentTarget.style.color = '#334155';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* مساحة المحادثة */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: '#F8FAFC'
          }}
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isUser ? 'flex-start' : 'flex-end',
                  maxWidth: isUser ? '80%' : '98%',
                  width: isUser ? 'auto' : '100%',
                  background: isUser ? '#0D3C5C' : '#FFFFFF',
                  color: isUser ? '#FFFFFF' : '#1E293B',
                  border: isUser ? 'none' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: isUser ? '10px 16px' : '14px 18px',
                  fontSize: '13.5px',
                  lineHeight: '1.7',
                  boxShadow: isUser ? 'none' : '0 2px 5px rgba(0,0,0,0.03)'
                }}
              >
                {isUser ? (
                  <div style={{ whiteSpace: 'pre-wrap', fontWeight: 600 }}>{m.text}</div>
                ) : (
                  <AiRichMessage content={m.text} />
                )}
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                alignSelf: 'flex-end',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⏳</span> جاري البحث في نصوص القانون وصياغة الإجابة...
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* حقل الإرسال */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '10px',
            background: '#ffffff'
          }}
        >
          <input
            type="text"
            placeholder="اكتب استفسارك هنا حول هذا القانون..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#0D3C5C')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
            style={{
              background: inputText.trim() && !loading ? '#0D3C5C' : '#94A3B8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: inputText.trim() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>إرسال</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
