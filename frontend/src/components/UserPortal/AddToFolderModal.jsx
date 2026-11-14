import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FolderIcon, BookmarkIcon, CheckIcon, PlusIcon } from './AddToFolderIcons';
import AddToFolderInlineCreate from './AddToFolderInlineCreate';

export default function AddToFolderModal({ item, isOpen, onClose, onStatusChange }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState({ is_favorite: false, folders: [] });
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const nameInputRef = useRef(null);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const fetchStatus = useCallback(async () => {
    if (!token || !item) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/folders/check-status?item_type=${encodeURIComponent(item.item_type)}&item_id=${encodeURIComponent(item.item_id)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (onStatusChange) onStatusChange(data.is_saved);
      }
    } catch { } finally {
      setLoading(false);
    }
  }, [token, item, onStatusChange]);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setShowCreate(false);
      setNewFolderName('');
      setNameError('');
      setToastMsg(null);
    }
  }, [isOpen, fetchStatus]);

  if (!isOpen || !item) return null;

  const handleToggleFavorite = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_type: item.item_type, item_id: item.item_id, title: item.title, subtitle: item.subtitle || null })
      });
      if (res.ok) {
        const data = await res.json();
        const isFav = data.status === 'added';
        setStatusData(prev => ({ ...prev, is_favorite: isFav, is_saved: isFav || prev.is_in_any_folder }));
        if (onStatusChange) onStatusChange(isFav || statusData.is_in_any_folder);
        notify(isFav ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
      }
    } catch { notify('تعذر التحديث'); }
  };

  const handleToggleFolder = async (folder) => {
    if (!token) return;
    if (folder.has_item) {
      try {
        const res = await fetch(`/api/folders/${folder.id}/items/${folder.folder_item_id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 204) {
          notify(`تمت الإزالة من "${folder.name}"`);
          const remainingInFolders = statusData.folders.some(f => f.id !== folder.id && f.has_item);
          const stillSaved = statusData.is_favorite || remainingInFolders;
          setStatusData(prev => ({ ...prev, is_in_any_folder: remainingInFolders, is_saved: stillSaved }));
          if (onStatusChange) onStatusChange(stillSaved);
          fetchStatus();
        }
      } catch { notify('تعذر التحديث'); }
    } else {
      try {
        const res = await fetch(`/api/folders/${folder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ item_type: item.item_type, item_id: item.item_id, title: item.title, subtitle: item.subtitle || null })
        });
        if (res.status === 201) {
          notify(`تمت الإضافة إلى "${folder.name}"`);
          setStatusData(prev => ({ ...prev, is_in_any_folder: true, is_saved: true }));
          if (onStatusChange) onStatusChange(true);
          fetchStatus();
        }
      } catch { notify('تعذر التحديث'); }
    }
  };

  const submitCreateAndAdd = async (folderName) => {
    if (!folderName || !token) return;
    setCreating(true);
    setNameError('');
    try {
      const res = await fetch('/api/folders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: folderName, color: '#0D3C5C' }),
      });
      if (res.status === 201) {
        const created = await res.json();
        await fetch(`/api/folders/${created.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ item_type: item.item_type, item_id: item.item_id, title: item.title, subtitle: item.subtitle || null })
        });
        if (onStatusChange) onStatusChange(true);
        onClose();
      }
    } catch { setNameError('تعذر إنشاء المجلد'); } finally { setCreating(false); }
  };

  const handleDone = () => {
    const customName = newFolderName.trim();
    if (customName) {
      submitCreateAndAdd(customName);
      return;
    }
    if (onStatusChange) onStatusChange(Boolean(statusData.is_saved));
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13, 60, 92, 0.4)', backdropFilter: 'blur(3px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '410px', direction: 'rtl', fontFamily: 'Cairo, sans-serif', boxShadow: '0 16px 40px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#0D3C5C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FolderIcon size={19} color="#FFFFFF" /></div>
            <div><div style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C' }}>إضافة إلى مجلداتي</div><div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>حفظ مباشر بضغطة زر أو زر إنتر</div></div>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#64748B', fontWeight: '800' }}>✕</button>
        </div>

        <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '9px 12px', marginBottom: '14px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: '700', color: '#0D3C5C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px', maxHeight: '180px', overflowY: 'auto' }}>
          <button onClick={handleToggleFavorite} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '11px', background: statusData.is_favorite ? '#FFFBEB' : '#FFFFFF', border: `1px solid ${statusData.is_favorite ? '#FCD34D' : '#E2E8F0'}`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BookmarkIcon filled={statusData.is_favorite} size={17} color={statusData.is_favorite ? '#D97706' : '#64748B'} /><span style={{ fontSize: '13px', fontWeight: '700', color: '#0D3C5C' }}>المفضلة</span></div>
            {statusData.is_favorite ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontSize: '11px', fontWeight: '700' }}><CheckIcon size={14} color="#D97706" />محفوظ</span> : <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>+ حفظ</span>}
          </button>

          {!loading && statusData.folders.map(f => (
            <button key={f.id} onClick={() => handleToggleFolder(f)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '11px', background: f.has_item ? '#F8FAFC' : '#FFFFFF', border: `1px solid ${f.has_item ? '#CBD5E1' : '#E2E8F0'}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: f.color || '#F5A52A' }} /><span style={{ fontSize: '13px', fontWeight: '700', color: '#0D3C5C' }}>{f.name}</span></div>
              {f.has_item ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0D3C5C', background: '#F1F5F9', padding: '3px 9px', borderRadius: '14px', fontSize: '11px', fontWeight: '700' }}><CheckIcon size={14} color="#0D3C5C" />مضاف</span> : <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>+ إضافة</span>}
            </button>
          ))}
        </div>

        {showCreate ? (
          <AddToFolderInlineCreate nameInputRef={nameInputRef} newFolderName={newFolderName} setNewFolderName={setNewFolderName} nameError={nameError} setNameError={setNameError} creating={creating} onSubmit={handleDone} onCancel={() => { setShowCreate(false); setNameError(''); }} />
        ) : (
          <button onClick={() => { setShowCreate(true); setNameError(''); setTimeout(() => nameInputRef.current?.focus(), 50); }} style={{ width: '100%', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '10px', padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#0D3C5C', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '14px' }}>
            <PlusIcon size={14} color="#0D3C5C" />إنشاء مجلد جديد
          </button>
        )}

        <button onClick={handleDone} style={{ width: '100%', background: '#0D3C5C', color: '#FFFFFF', border: 'none', borderRadius: '11px', padding: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>تم</button>
        {toastMsg && <div style={{ textAlign: 'center', color: '#059669', fontSize: '11px', fontWeight: '700', marginTop: '8px' }}>{toastMsg}</div>}
      </div>
    </div>
  );
}
