import React, { useState, useEffect } from 'react';
import { IconBroadcast, IconClose } from './KnowledgeIcons';
import { sendKnowledgeBroadcast } from './knowledgeApi';

const AUDIENCE_ITEMS = [
  { key: 'user', label: 'أفراد' },
  { key: 'consultant', label: 'مستشارين' },
  { key: 'company', label: 'شركات' }
];

export default function KnowledgeBroadcastModal({ isOpen, source, onClose, onNotify }) {
  const isJudgment = source?.source_type === 'judgment' || source?.kind === 'precedent';
  const [mode, setMode] = useState('add');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState({ user: true, consultant: true, company: true });
  const [sending, setSending] = useState(false);

  const buildPreset = (nextMode, src) => {
    const label = src?.title || '';
    if (nextMode === 'edit') {
      return {
        t: isJudgment ? 'تعديل في حكم قضائي' : 'تعديل في قانون',
        m: isJudgment ? `تم إجراء تعديل في حكم قضائي: ${label}` : `تم إجراء تعديل في قانون: ${label}`
      };
    }
    return {
      t: isJudgment ? 'إضافة حكم قضائي جديد' : 'إضافة قانون جديد',
      m: isJudgment ? `تم إضافة حكم قضائي جديد: ${label}` : `تم إضافة قانون جديد: ${label}`
    };
  };

  useEffect(() => {
    if (isOpen && source) {
      setMode('add');
      const preset = buildPreset('add', source);
      setTitle(preset.t);
      setMessage(preset.m);
      setAudience({ user: true, consultant: true, company: true });
    }
  }, [isOpen, source]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !source) return null;

  const selectedAudience = Object.entries(audience).filter(([, checked]) => checked).map(([k]) => k);

  const handleModeSwitch = (nextMode) => {
    setMode(nextMode);
    const preset = buildPreset(nextMode, source);
    setTitle(preset.t);
    setMessage(preset.m);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return onNotify('يرجى كتابة نص الإشعار أولاً');
    if (selectedAudience.length === 0) return onNotify('اختر فئة مستهدفة واحدة على الأقل');
    setSending(true);
    try {
      const res = await sendKnowledgeBroadcast({ title, message, audience: selectedAudience });
      if (res.ok) {
        const d = await res.json();
        onNotify(`تم إرسال التنبيه إلى ${d.sent_count ?? 0} مستخدم بنجاح`);
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        onNotify(err.detail || `فشل إرسال التنبيه (${res.status})`);
      }
    } catch {
      onNotify('خطأ في الاتصال أثناء إرسال التنبيه');
    } finally {
      setSending(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(13,60,92,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', direction: 'rtl' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '540px', width: '100%', border: '1px solid #E2E8F0', boxShadow: '0 24px 60px rgba(13,60,92,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconBroadcast className="size-5 text-[#E58A13]" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0D3C5C' }}>إرسال تنبيه للمتأثرين</h2>
          </div>
          <button type="button" onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <IconClose className="size-4" />
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#0D3C5C', fontWeight: 700, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px' }}>
          {source.title}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {[['add', 'إضافة جديدة'], ['edit', 'تعديل في القانون']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => handleModeSwitch(key)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${mode === key ? '#0D3C5C' : '#E2E8F0'}`, background: mode === key ? '#0D3C5C' : '#F8FAFC', color: mode === key ? '#FFFFFF' : '#64748B', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>عنوان الإشعار</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="knowledge-input" required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>مضمون الرسالة</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="knowledge-textarea" style={{ minHeight: '90px' }} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>إرسال إلى الفئات</label>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              {AUDIENCE_ITEMS.map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0D3C5C', cursor: 'pointer' }}>
                  <input type="checkbox" checked={audience[key]} onChange={(e) => setAudience((p) => ({ ...p, [key]: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#0D3C5C' }} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="submit" disabled={sending} className="btn-primary-action" style={{ flex: 1, justifyContent: 'center' }}>
              <IconBroadcast className="size-4" />
              <span>{sending ? 'جاري الإرسال...' : 'إرسال الإشعار'}</span>
            </button>
            <button type="button" onClick={onClose} className="btn-secondary-action">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

