// frontend/src/components/Regulations/NoteModal.jsx
import React, { useState } from 'react';

export default function NoteModal({ isOpen, onClose, selectedText, onSaveNote }) {
  const [noteText, setNoteText] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!noteText.trim()) return;
    onSaveNote(selectedText, noteText);
    setNoteText('');
    onClose();
  };

  return (
    <div className="reg-modal-backdrop" style={{ zIndex: 450 }} onClick={onClose}>
      <div className="reg-modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="reg-modal-header">
          <h3 className="reg-modal-title">📝 إضافة ملاحظة قانونية على النص</h3>
          <button className="reg-modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ background: '#FFFBEB', borderRight: '4px solid #F59E0B', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', color: '#92400E' }}>
          <strong>النص المظلل:</strong> "{selectedText}"
        </div>

        <textarea
          style={{ width: '100%', height: '100px', border: '1px solid var(--reg-line)', borderRadius: '12px', padding: '12px', fontFamily: 'var(--reg-font)', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}
          placeholder="اكتب تعليقك أو استفسارك هنا..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <button className="reg-btn-primary" onClick={handleSave}>حفظ الملاحظة</button>
          <button className="reg-btn-outline" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
