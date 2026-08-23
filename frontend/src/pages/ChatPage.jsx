import React, { useState } from 'react';
import { ChatIcon } from '../components/UserPortal/Icons';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'me', text: text.trim(), time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }]);
    setText('');
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Sessions Sidebar */}
      <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
          <div style={{ background: '#E5EFF5', padding: '8px', borderRadius: '10px', color: '#005D9C' }}>
            <ChatIcon size={20} color="#005D9C" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', margin: 0 }}>المحادثات المتاحة</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginTop: '40px' }}>
          لا توجد محادثات نشطة مع المستشارين حالياً.
        </p>
      </div>

      {/* Main Chat Area */}
      <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748B' }}>
              <div style={{ width: '56px', height: '56px', background: '#E5EFF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <ChatIcon size={26} color="#005D9C" />
              </div>
              <h4 style={{ color: '#1E293B', marginBottom: '4px' }}>اختر محادثة لبدء التراسل</h4>
              <p style={{ fontSize: '13px', margin: 0 }}>يمكنك مراسلة المستشار أثناء الجلسة المباشرة.</p>
            </div>
          ) : (
            messages.map(m => (
              <div key={m.id} style={{ alignSelf: 'flex-end', background: 'linear-gradient(135deg, #F5A52A, #E0921B)', color: '#FFFFFF', padding: '10px 16px', borderRadius: '16px 16px 0 16px', fontSize: '13px' }}>
                {m.text}
              </div>
            ))
          )}
        </div>

        {/* Input Bar with Golden Button */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <input
            type="text"
            placeholder="اكتب رسالتك هنا..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 1, padding: '12px 18px', borderRadius: '25px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '25px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(245, 165, 42, 0.25)'
            }}
          >
            إرسال
          </button>
        </form>
      </div>
    </div>
  );
}
