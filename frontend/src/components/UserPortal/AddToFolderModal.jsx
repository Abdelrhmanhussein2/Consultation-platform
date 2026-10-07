import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const FolderIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = ({ filled, size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const CheckIcon = ({ size = 15, color = '#10B981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FOLDER_COLORS = ['#F5A52A', '#0D3C5C', '#3B82F6', '#10B981', '#8B5CF6', '#64748B'];

export default function AddToFolderModal({ item, isOpen, onClose, onStatusChange }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState({ is_favorite: false, folders: [] });
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#F5A52A');
  const [creating, setCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, item, onStatusChange]);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setShowCreate(false);
      setNewFolderName('');
      setToastMsg(null);
    }
  }, [isOpen, fetchStatus]);

  if (!isOpen || !item) return null;

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          item_type: item.item_type,
          item_id: item.item_id,
          title: item.title,
          subtitle: item.subtitle || null,
        })
      });
      if (res.ok) {
        const data = await res.json();
        const isFav = data.status === 'added';
        setStatusData(prev => ({
          ...prev,
          is_favorite: isFav,
          is_saved: isFav || prev.is_in_any_folder,
        }));
        if (onStatusChange) onStatusChange(isFav || statusData.is_in_any_folder);
        notify(isFav ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
      }
    } catch {
      notify('تعذر التحديث');
    }
  };

  // Toggle item in a folder
  const handleToggleFolder = async (folder) => {
    if (!token) return;

    if (folder.has_item) {
      try {
        const res = await fetch(`/api/folders/${folder.id}/items/${folder.folder_item_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 204) {
          notify(`تمت الإزالة من "${folder.name}"`);
          fetchStatus();
        }
      } catch {
        notify('تعذر التحديث');
      }
    } else {
      try {
        const res = await fetch(`/api/folders/${folder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            item_type: item.item_type,
            item_id: item.item_id,
            title: item.title,
            subtitle: item.subtitle || null,
          })
        });
        if (res.status === 201) {
          notify(`تمت الإضافة إلى "${folder.name}"`);
          fetchStatus();
        }
      } catch {
        notify('تعذر التحديث');
      }
    }
  };

  // Create new folder and add item
  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim() || !token) return;
    setCreating(true);
    try {
      const res = await fetch('/api/folders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newFolderName.trim(), color: newFolderColor }),
      });
      if (res.status === 201) {
        const createdFolder = await res.json();
        await fetch(`/api/folders/${createdFolder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            item_type: item.item_type,
            item_id: item.item_id,
            title: item.title,
            subtitle: item.subtitle || null,
          })
        });
        notify(`تم إنشاء مجلد "${createdFolder.name}" وإضافة التشريع`);
        setNewFolderName('');
        setShowCreate(false);
        fetchStatus();
      }
    } catch {
      notify('فشل إنشاء المجلد');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(13, 60, 92, 0.4)', backdropFilter: 'blur(3px)',
        zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '410px',
          direction: 'rtl', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#0D3C5C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderIcon size={19} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>إضافة إلى مجلداتي</h3>
              <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>اختر المجلد أو المفضلة لحفظ العنصر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>

        {/* Item minimal preview */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0D3C5C', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </div>
        </div>

        {/* Small Toast banner */}
        {toastMsg && (
          <div style={{ background: '#0D3C5C', color: '#FFFFFF', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            {toastMsg}
          </div>
        )}

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
          
          {/* 1. Quick Favorite Row (Clean, subtle design) */}
          <button
            onClick={handleToggleFavorite}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: '11px',
              background: statusData.is_favorite ? '#F8FAFC' : '#FFFFFF',
              border: `1px solid ${statusData.is_favorite ? '#CBD5E1' : '#E2E8F0'}`,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Tajawal, sans-serif'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookmarkIcon filled={statusData.is_favorite} size={18} color={statusData.is_favorite ? '#F5A52A' : '#94A3B8'} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0D3C5C' }}>المفضلة</span>
            </div>
            {statusData.is_favorite ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0D3C5C', background: '#F1F5F9', padding: '3px 9px', borderRadius: '14px', fontSize: '11px', fontWeight: '700' }}>
                <CheckIcon size={14} color="#0D3C5C" />
                مضاف
              </span>
            ) : (
              <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>+ حفظ</span>
            )}
          </button>

          {/* 2. User Folders List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '16px', color: '#94A3B8', fontSize: '12px' }}>جاري التحميل...</div>
          ) : (
            statusData.folders.map(f => (
              <button
                key={f.id}
                onClick={() => handleToggleFolder(f)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '11px',
                  background: f.has_item ? '#F8FAFC' : '#FFFFFF',
                  border: `1px solid ${f.has_item ? '#CBD5E1' : '#E2E8F0'}`,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Tajawal, sans-serif'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: f.color || '#F5A52A' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0D3C5C' }}>{f.name}</span>
                </div>
                {f.has_item ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0D3C5C', background: '#F1F5F9', padding: '3px 9px', borderRadius: '14px', fontSize: '11px', fontWeight: '700' }}>
                    <CheckIcon size={14} color="#0D3C5C" />
                    مضاف
                  </span>
                ) : (
                  <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>+ إضافة</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Create Folder Inline */}
        {showCreate ? (
          <form onSubmit={handleCreateAndAdd} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
            <input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="اسم المجلد الجديد..."
              maxLength={60}
              autoFocus
              required
              style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', fontFamily: 'Tajawal, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c} type="button" onClick={() => setNewFolderColor(c)}
                    style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, border: newFolderColor === c ? '2px solid #0D3C5C' : 'none', cursor: 'pointer' }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button" onClick={() => setShowCreate(false)}
                  style={{ background: '#E2E8F0', color: '#64748B', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit" disabled={creating || !newFolderName.trim()}
                  style={{ background: '#0D3C5C', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
                >
                  {creating ? '...' : 'إنشاء وحفظ'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              width: '100%', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '10px',
              padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              color: '#0D3C5C', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
              marginBottom: '14px', transition: 'all 0.15s'
            }}
          >
            <PlusIcon size={14} color="#0D3C5C" />
            إنشاء مجلد جديد
          </button>
        )}

        {/* Footer Done Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', background: '#0D3C5C', color: '#FFFFFF', border: 'none', borderRadius: '11px',
            padding: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif'
          }}
        >
          تم
        </button>

      </div>
    </div>
  );
}
