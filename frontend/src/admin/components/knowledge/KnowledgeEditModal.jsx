import React, { useState, useEffect } from 'react';
import { IconSave } from './KnowledgeIcons';

export default function KnowledgeEditModal({
  isOpen,
  source,
  onSave,
  onClose
}) {
  const [formData, setFormData] = useState({
    title: '', year: '', number: '', court: '', body: '', is_active: true
  });

  useEffect(() => {
    if (source) {
      let cleanNum = '';
      if (source.number && source.number !== '-') {
        cleanNum = String(source.number).split(' لسنة')[0].split('/')[0].trim();
      } else if (source.code) {
        const m = source.code.match(/رقم\s*(\d+)/);
        cleanNum = m ? m[1] : '';
      }
      setFormData({
        title: source.title || '',
        year: source.year && source.year !== '-' ? source.year : '',
        number: cleanNum,
        court: source.court || '',
        body: source.body || '',
        is_active: source.is_active ?? true
      });
    }
  }, [source]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !source) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(source.id, source.source_type || 'law', formData);
  };

  const isJudgment = source.source_type === 'judgment' || source.kind === 'precedent';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(13, 60, 92, 0.5)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', direction: 'rtl',
        animation: 'tdFade 0.18s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '28px 24px',
          maxWidth: '680px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(13, 60, 92, 0.22)',
          border: '1px solid #E2E8F0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#E58A13' }}>تعديل المصدر</span>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0D3C5C', margin: '4px 0 0' }}>
              {isJudgment ? 'تعديل بيانات الحكم القضائي' : 'تعديل بيانات التشريع والقانون'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', cursor: 'pointer', fontSize: '15px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>
              {isJudgment ? 'عنوان الحكم أو النزاع' : 'عنوان القانون / التشريع'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="knowledge-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isJudgment ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>
                السنة
              </label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="knowledge-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>
                {isJudgment ? 'رقم الحكم' : 'رقم القانون'}
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="knowledge-input"
              />
            </div>

            {isJudgment && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>
                  المحكمة
                </label>
                <input
                  type="text"
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  className="knowledge-input"
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>
              {isJudgment ? 'منطوق ومبدأ الحكم القضائي الكامل' : 'النص الكامل للتشريع والقانون'}
            </label>
            <textarea
              rows={6}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="knowledge-textarea"
              placeholder={isJudgment ? 'اكتب أو عدّل منطوق ومبدأ الحكم الكامل هنا...' : 'اكتب أو عدّل نص مواد القانون الكاملة هنا...'}
              style={{ minHeight: '120px', maxHeight: '240px', overflowY: 'auto', lineHeight: '1.6' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <input
              type="checkbox"
              id="isActiveSourceCheck"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: '#0D3C5C' }}
            />
            <label htmlFor="isActiveSourceCheck" style={{ fontSize: '13px', fontWeight: 700, color: '#0D3C5C', cursor: 'pointer' }}>
              المصدر نشط ومتاح في استعلامات البحث الذكي (RAG)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', marginTop: '10px' }}>
            <button
              type="submit"
              className="btn-primary-action"
              style={{ padding: '9px 20px', minWidth: '130px' }}
            >
              <IconSave className="size-4" />
              <span>حفظ التعديلات</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-action"
              style={{ padding: '9px 18px' }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

