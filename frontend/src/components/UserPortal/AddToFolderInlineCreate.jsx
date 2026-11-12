import React from 'react';

export default function AddToFolderInlineCreate({
  nameInputRef,
  newFolderName,
  setNewFolderName,
  nameError,
  setNameError,
  creating,
  onSubmit,
  onCancel
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{
        background: '#F8FAFC',
        border: `1.5px solid ${nameError ? '#EF4444' : '#E2E8F0'}`,
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '14px',
        transition: 'all 0.2s ease',
        boxShadow: nameError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none'
      }}
    >
      {nameError && (
        <div style={{ color: '#EF4444', fontSize: '11px', fontWeight: '700', marginBottom: '8px' }}>
          {nameError}
        </div>
      )}
      <input
        ref={nameInputRef}
        value={newFolderName}
        onChange={(e) => {
          setNewFolderName(e.target.value);
          if (nameError) setNameError('');
        }}
        placeholder="اكتب اسم المجلد هنا (أو اضغط إنتر للحفظ السريع)..."
        maxLength={60}
        autoFocus
        style={{
          width: '100%',
          border: `1px solid ${nameError ? '#EF4444' : '#CBD5E1'}`,
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '12px',
          fontFamily: 'Cairo, sans-serif',
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: '8px',
          background: '#FFFFFF'
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: '#E2E8F0', color: '#64748B', border: 'none',
            borderRadius: '6px', padding: '5px 10px', fontSize: '11px',
            fontWeight: '700', cursor: 'pointer', fontFamily: 'Cairo, sans-serif'
          }}
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={creating}
          style={{
            background: '#0D3C5C', color: '#FFFFFF', border: 'none',
            borderRadius: '6px', padding: '5px 12px', fontSize: '11px',
            fontWeight: '700', cursor: 'pointer', fontFamily: 'Cairo, sans-serif'
          }}
        >
          {creating ? '...' : 'حفظ'}
        </button>
      </div>
    </form>
  );
}

