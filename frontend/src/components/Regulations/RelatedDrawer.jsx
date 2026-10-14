// frontend/src/components/Regulations/RelatedDrawer.jsx
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

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

  const getAnswer = (q) => {
    const query = q.toLowerCase();
    if (query.includes('نسب') || query.includes('شرائح') || query.includes('نسبة')) {
      return `نسب ضريبة الدخل (المادة 11):\n• الأفراد: تصاعدياً من 5% لأول 5,000 دينار وحتى 25% لما زاد عن 20,000 دينار.\n• البنوك: 35%.\n• شركات التأمين والاتصالات والتعدين: 24%.\n• باقي الشركات: 20%.`;
    }
    if (query.includes('إعفاء') || query.includes('اعفاء')) {
      return `الإعفاءات الضريبية (المادة 9):\n• إعفاء شخصي للمكلف: 9,000 دينار سنوياً.\n• إعفاء المعالين: 9,000 دينار سنوياً (بحد أقصى 18,000 دينار للأسرة).\n• إعفاءات فواتير العلاج والتعليم والإيجار: حتى 3,000 دينار إضافية.`;
    }
    if (query.includes('تهرب') || query.includes('عقوب')) {
      return `عقوبات التهرب الضريبي (المادة 66):\n• الحبس من 4 أشهر إلى سنة واحدة.\n• غرامة تعويضية تعادل مثل الفرق الضريبي المستحق.\n• الحبس وجوبي في حال التكرار للمرة الثالثة.`;
    }
    if (query.includes('تعديل')) {
      return `أهم التعديلات:\n• القانون المعدل رقم 38 لسنة 2018 خفّض سقف الإعفاءات واستحدث شريحة 25% وألزم بنظام الفوترة الإلكتروني لمكافحة التهرب.`;
    }
    if (query.includes('سابق') || query.includes('قضائ') || query.includes('تمييز') || query.includes('حكم')) {
      return `سوابق قضائية لمحكمة التمييز:\n• تمييز حقوق 1290/2021: المصروفات الضرورية لإنتاج الدخل مقبولة قانوناً متى ثبتت بالوثائق.\n• تمييز حقوق 4350/2022: بطلان التقدير الإداري الجزافي غير المستند لبينات.`;
    }
    return `بخصوص "${q}":\nيرجى مراجعة نصوص المواد التفصيلية في "البحث المتقدم" أو طلب استشارة معتمدة من أحد مستشاري المنصة.`;
  };

  const handleSend = (text) => {
    const q = text || inputText;
    if (!q.trim() || loading) return;

    setMessages((prev) => [...prev, { id: String(Date.now()), role: 'user', text: q.trim() }]);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: 'assistant', text: getAnswer(q) }
      ]);
      setLoading(false);
    }, 350);
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
      {/* المربع الصغير في المنتصف */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px',
          maxWidth: '95vw',
          height: '480px',
          maxHeight: '85vh',
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          border: '1px solid #DCE5EA',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          direction: 'rtl',
          fontFamily: "'Tajawal', sans-serif"
        }}
      >
        {/* شريط العنوان */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#0D3C5C', fontWeight: 800 }}>
              اسأل ديوان عن القانون
            </h3>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              {law?.title || 'قانون ضريبة الدخل'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: '#64748B',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* أسئلة سريعة */}
        <div
          style={{
            padding: '8px 14px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            gap: '6px',
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
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
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
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
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
                  maxWidth: '85%',
                  background: isUser ? '#0D3C5C' : '#FFFFFF',
                  color: isUser ? '#FFFFFF' : '#1E293B',
                  border: isUser ? 'none' : '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                {m.text}
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                alignSelf: 'flex-end',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12px',
                color: '#64748B'
              }}
            >
              جاري البحث وصياغة الرد...
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* حقل الإرسال */}
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '8px',
            background: '#ffffff'
          }}
        >
          <input
            type="text"
            placeholder="اكتب استفسارك هنا..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
            style={{
              background: inputText.trim() && !loading ? '#0D3C5C' : '#94A3B8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: inputText.trim() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit'
            }}
          >
            إرسال
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
