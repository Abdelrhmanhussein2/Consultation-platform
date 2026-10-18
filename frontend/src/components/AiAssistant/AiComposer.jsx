// frontend/src/components/AiAssistant/AiComposer.jsx
import React, { useRef, useState } from 'react';
import { CONSULTATION_MODES } from './aiAssistantData';

export default function AiComposer({
  value,
  onChange,
  onSend,
  disabled,
  activeMode,
  isAdvanced,
  onToggleAdvanced
}) {
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [attachedName, setAttachedName] = useState(null);

  const currentModeObj = CONSULTATION_MODES.find((m) => m.id === activeMode) || CONSULTATION_MODES[0];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  };

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('ميزة الإملاء الصوتي غير مدعومة في متصفحك الحالي، يرجى استخدام متصفح Chrome.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-JO';
    recognition.continuous = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onChange(value ? `${value} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedName(file.name);
      onChange(value ? `${value}\n[ملف مرفق: ${file.name}]` : `[ملف مرفق: ${file.name}]`);
    }
  };

  return (
    <div className="ai-composer-box">
      {/* Top Header inside box */}
      <div className="ai-composer-top">
        <span className="kicker-title">حدد موضوع استشارتك</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAdvanced && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '3px 10px',
                borderRadius: '9999px'
              }}
            >
              🔍 البحث المتقدم مفعّل
            </span>
          )}

          <div className="ai-mode-pill-badge">
            <span style={{ fontSize: '13px' }}>{currentModeObj.icon}</span>
            <span>{currentModeObj.label}</span>
          </div>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        className="ai-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اسألني عن أي موضوع قانوني أو ضريبي أردني…"
        disabled={disabled}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.xlsx,.png,.jpg"
        onChange={handleFileUpload}
      />

      {/* Bottom tools row */}
      <div className="ai-composer-bottom">
        <div className="ai-composer-tools">
          <button
            type="button"
            className={`ai-tool-btn ${isAdvanced ? 'active' : ''}`}
            onClick={onToggleAdvanced}
            title="تفعيل البحث المتقدم في النصوص واللوائح"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>بحث متقدم</span>
          </button>

          <button
            type="button"
            className={`ai-tool-btn ${isListening ? 'active' : ''}`}
            onClick={handleVoiceToggle}
            title={isListening ? 'إيقاف الإملاء الصوتي' : 'إملاء صوتي عربي'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <span>{isListening ? 'جارٍ الاستماع…' : 'صوت'}</span>
          </button>

          <button
            type="button"
            className="ai-tool-btn"
            onClick={() => fileInputRef.current?.click()}
            title="إرفاق ملف أو مستند ضريبي"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <span>{attachedName ? 'مرفق ✓' : 'ملف'}</span>
          </button>
        </div>

        <button
          type="button"
          className="ai-send-btn"
          onClick={onSend}
          disabled={!value.trim() || disabled}
          title="إرسال الاستشارة"
          aria-label="إرسال"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
