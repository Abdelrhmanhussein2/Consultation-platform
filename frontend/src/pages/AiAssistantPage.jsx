import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AiIcon } from '../components/UserPortal/Icons';

export default function AiAssistantPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'أهلاً بك! أنا المساعد الضريبي الذكي لمنصة ديوان. كيف يمكنني مساعدتك في استفسارات القوانين والضرائب اليوم؟' }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: userText })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.answer || data.response || 'تم استلام الإجابة.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: 'عذراً، حدث خطأ أثناء الاستعلام من المساعد الذكي.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'عذراً، تعذر الاتصال بالمساعد الذكي حالياً.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Soft Light Blue Banner Header */}
      <div
        style={{
          background: '#E5EFF5',
          border: '1px solid #BAE6FD',
          color: '#005D9C',
          padding: '20px 24px',
          borderRadius: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '12px', color: '#005D9C', boxShadow: '0 2px 6px rgba(0,93,156,0.1)' }}>
          <AiIcon size={24} color="#005D9C" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#005D9C' }}>
            المساعد الضريبي الذكي (ديوان AI)
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#486581' }}>
            إجابات مدعومة بـ RAG والتشريعات الضريبية الأردنية
          </p>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div
        style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: m.role === 'user' ? 'linear-gradient(135deg, #F5A52A, #E0921B)' : '#F8FAFC',
              color: m.role === 'user' ? '#FFFFFF' : '#1E293B',
              padding: '14px 18px',
              borderRadius: m.role === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
              border: m.role === 'user' ? 'none' : '1px solid #E2E8F0',
              fontSize: '14px',
              lineHeight: '1.6',
              boxShadow: m.role === 'user' ? '0 4px 10px rgba(245, 165, 42, 0.2)' : 'none'
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: '#F8FAFC', padding: '12px 18px', borderRadius: '16px', color: '#64748B', fontSize: '13px' }}>
            جاري التفكير وصياغة الإجابة...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Golden Button */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="طرح سؤالاً حول ضريبة الدخل، المبيعات، أو الإعفاءات..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: '25px',
            border: '1px solid #CBD5E1',
            fontSize: '14px',
            background: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          style={{
            background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
            color: '#FFFFFF',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '25px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 165, 42, 0.3)'
          }}
        >
          إرسال
        </button>
      </form>
    </div>
  );
}
