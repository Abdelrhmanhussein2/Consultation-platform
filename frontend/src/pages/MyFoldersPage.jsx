import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast/Toast';
import { showDialog } from '../components/ConfirmModal/dialogManager';
import FolderDetailView from '../components/UserPortal/FolderDetailView';

// ─── Icons ──────────────────────────────────────────────────────────────────

const HeartIcon = ({ filled, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : 'none'} stroke={color} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const FolderIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const PlusIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const ExternalLinkIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ITEM_TYPE_LABELS = {
  regulation: 'تشريع',
  consultant: 'مستشار',
  template: 'نموذج',
  document: 'وثيقة',
};

const ITEM_TYPE_COLORS = {
  regulation: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
  consultant: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
  template: { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6' },
  document: { bg: 'rgba(245,165,42,0.1)', color: '#F5A52A' },
};

const FOLDER_COLORS = ['#F5A52A', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#84CC16'];

const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  } catch { return '--'; }
};

const ItemTypeIcon = ({ type, size = 20 }) => {
  const c = ITEM_TYPE_COLORS[type] || ITEM_TYPE_COLORS.document;
  return (
    <div style={{ background: c.bg, color: c.color, width: size + 20, height: size + 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {type === 'regulation' && (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )}
      {type === 'consultant' && (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        </svg>
      )}
      {type === 'template' && (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )}
      {(type === 'document' || !ITEM_TYPE_LABELS[type]) && (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </div>
  );
};

// ─── Create Folder Modal ──────────────────────────────────────────────────────

function CreateFolderModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#F5A52A');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreate({ name: name.trim(), description: description.trim() || null, color: selectedColor });
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 6px 0' }}>إنشاء مجلد جديد</h2>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 24px 0' }}>سمِّ مجلدك واختر لونًا مميزًا</p>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>اسم المجلد *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: ملفات العقود والقضايا"
            maxLength={80}
            required
            style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', fontFamily: 'Tajawal, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
          />

          <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>وصف (اختياري)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="وصف مختصر للمجلد..."
            rows={2}
            style={{ width: '100%', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', fontFamily: 'Tajawal, sans-serif', outline: 'none', boxSizing: 'border-box', resize: 'none', marginBottom: '16px' }}
          />

          <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '10px' }}>لون المجلد</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {FOLDER_COLORS.map(c => (
              <button
                key={c} type="button"
                onClick={() => setSelectedColor(c)}
                style={{
                  width: '30px', height: '30px', borderRadius: '50%', background: c, border: selectedColor === c ? `3px solid #0D3C5C` : '3px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s', outline: 'none', transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit" disabled={loading || !name.trim()}
              style={{
                flex: 1, background: '#0D3C5C', color: '#FFFFFF', border: 'none', borderRadius: '12px',
                padding: '12px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif', opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء المجلد'}
            </button>
            <button
              type="button" onClick={onClose}
              style={{
                flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '12px',
                padding: '12px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif'
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MyFoldersPage({ navigate }) {
  const { token } = useAuth();
  const { toast, showToast } = useToast();

  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'folders'
  const [favorites, setFavorites] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingFav, setLoadingFav] = useState(true);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openFolder, setOpenFolder] = useState(null); // folder object with items and files

  // ── Fetch favorites ────────────────────────────────────────────────────────
  const fetchFavorites = useCallback(async () => {
    if (!token) return;
    setLoadingFav(true);
    try {
      const res = await fetch('/api/favorites/', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFavorites(await res.json());
      else showToast('فشل في تحميل المفضلة.', 'error');
    } catch { showToast('خطأ في الاتصال بالخادم.', 'error'); }
    finally { setLoadingFav(false); }
  }, [token]);

  // ── Fetch folders list ─────────────────────────────────────────────────────
  const fetchFolders = useCallback(async () => {
    if (!token) return;
    setLoadingFolders(true);
    try {
      const res = await fetch('/api/folders/', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFolders(await res.json());
      else showToast('فشل في تحميل المجلدات.', 'error');
    } catch { showToast('خطأ في الاتصال بالخادم.', 'error'); }
    finally { setLoadingFolders(false); }
  }, [token]);

  useEffect(() => { fetchFavorites(); fetchFolders(); }, [fetchFavorites, fetchFolders]);

  // ── Remove favorite ────────────────────────────────────────────────────────
  const handleRemoveFavorite = async (item) => {
    const ok = await showDialog({ title: 'إزالة من المفضلة', message: 'هل أنت متأكد من إزالة هذا العنصر؟', confirmText: 'إزالة', cancelText: 'إلغاء', variant: 'danger' });
    if (!ok) return;
    try {
      const res = await fetch(`/api/favorites/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 204) { showToast('تمت الإزالة من المفضلة.', 'success'); setFavorites(p => p.filter(f => f.id !== item.id)); }
      else showToast('فشل الحذف.', 'error');
    } catch { showToast('خطأ في الاتصال بالخادم.', 'error'); }
  };

  // ── Create folder ──────────────────────────────────────────────────────────
  const handleCreateFolder = async (payload) => {
    try {
      const res = await fetch('/api/folders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        showToast('تم إنشاء المجلد بنجاح!', 'success');
        setShowCreateModal(false);
        fetchFolders();
      } else showToast('فشل إنشاء المجلد.', 'error');
    } catch { showToast('خطأ في الاتصال بالخادم.', 'error'); }
  };

  // ── Delete folder ──────────────────────────────────────────────────────────
  const handleDeleteFolder = async (folder) => {
    const ok = await showDialog({ title: 'حذف المجلد', message: `سيتم حذف المجلد "${folder.name}" وكل محتوياته وملفاته نهائيًا.`, confirmText: 'حذف', cancelText: 'إلغاء', variant: 'danger' });
    if (!ok) return;
    try {
      const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 204) { showToast('تم حذف المجلد.', 'success'); setFolders(p => p.filter(f => f.id !== folder.id)); if (openFolder?.id === folder.id) setOpenFolder(null); }
      else showToast('فشل الحذف.', 'error');
    } catch { showToast('خطأ في الاتصال بالخادم.', 'error'); }
  };

  // ── Open folder detail ─────────────────────────────────────────────────────
  const handleOpenFolder = async (folder) => {
    try {
      const res = await fetch(`/api/folders/${folder.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setOpenFolder(await res.json());
      else showToast('فشل تحميل المجلد.', 'error');
    } catch { showToast('خطأ في الاتصال بالخادم.', 'error'); }
  };

  // ── Remove platform item from folder ───────────────────────────────────────
  const handleDeleteFolderItem = async (folderId, item) => {
    const ok = await showDialog({ title: 'إزالة من المجلد', message: 'هل أنت متأكد من إزالة هذا العنصر من المجلد؟', confirmText: 'إزالة', cancelText: 'إلغاء', variant: 'danger' });
    if (!ok) return;
    try {
      const res = await fetch(`/api/folders/${folderId}/items/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 204) {
        showToast('تمت الإزالة.', 'success');
        setOpenFolder(prev => prev ? { ...prev, items: (prev.items || []).filter(i => i.id !== item.id) } : null);
        fetchFolders();
      } else showToast('فشل الإزالة.', 'error');
    } catch { showToast('خطأ في الاتصال بالخادم.', 'error'); }
  };

  // ── File Added in folder ───────────────────────────────────────────────────
  const handleFileAdded = (newFile) => {
    setOpenFolder(prev => prev ? { ...prev, files: [newFile, ...(prev.files || [])] } : null);
    fetchFolders();
  };

  // ── File Deleted from folder ───────────────────────────────────────────────
  const handleFileDeleted = (fileId) => {
    setOpenFolder(prev => prev ? { ...prev, files: (prev.files || []).filter(f => f.id !== fileId) } : null);
    fetchFolders();
  };

  // ── Render favorites tab ───────────────────────────────────────────────────
  const renderFavorites = () => {
    const counts = {
      regulation: favorites.filter(f => f.item_type === 'regulation').length,
      consultant: favorites.filter(f => f.item_type === 'consultant').length,
      template: favorites.filter(f => f.item_type === 'template').length,
      document: favorites.filter(f => f.item_type === 'document').length,
    };

    if (loadingFav) return <LoadingSpinner label="جاري تحميل المفضلة..." />;

    return (
      <div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {Object.entries(counts).map(([type, count]) => (
            <div key={type} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <ItemTypeIcon type={type} size={18} />
              <div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0D3C5C', lineHeight: '1.1' }}>{count}</div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', marginTop: '2px' }}>{ITEM_TYPE_LABELS[type]}</div>
              </div>
            </div>
          ))}
        </div>

        {favorites.length === 0 ? (
          <EmptyState icon={<HeartIcon size={48} color="#CBD5E1" />} title="لا توجد عناصر محفوظة" body="احفظ التشريعات والمستشارين والنماذج في المفضلة للوصول السريع إليها لاحقًا." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {favorites.map(item => (
              <FavoriteCard key={item.id} item={item} onDelete={handleRemoveFavorite} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Render folders tab ─────────────────────────────────────────────────────
  const renderFolders = () => {
    if (openFolder) return (
      <FolderDetailView
        folder={openFolder}
        onBack={() => { setOpenFolder(null); fetchFolders(); }}
        onDeleteItem={handleDeleteFolderItem}
        onFileAdded={handleFileAdded}
        onFileDeleted={handleFileDeleted}
        token={token}
        showToast={showToast}
        navigate={navigate}
      />
    );

    if (loadingFolders) return <LoadingSpinner label="جاري تحميل المجلدات..." />;

    return (
      <div>
        {folders.length === 0 ? (
          <EmptyState
            icon={<FolderIcon size={48} color="#CBD5E1" />}
            title="لا توجد مجلدات بعد"
            body="أنشئ مجلدًا لتنظيم مستنداتك وملفاتك وتصنيفها بسهولة."
            action={<button onClick={() => setShowCreateModal(true)} style={{ background: '#0D3C5C', color: '#FFFFFF', border: 'none', borderRadius: '12px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}><PlusIcon color="#FFFFFF" />إنشاء مجلد جديد</button>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {folders.map(folder => (
              <FolderCard key={folder.id} folder={folder} onClick={() => handleOpenFolder(folder)} onDelete={() => handleDeleteFolder(folder)} />
            ))}
            {/* Add new folder card */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ background: 'transparent', border: '2px dashed #CBD5E1', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', color: '#94A3B8', transition: 'all 0.2s', fontFamily: 'Tajawal, sans-serif' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#F5A52A'; e.currentTarget.style.color = '#F5A52A'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <PlusIcon size={24} />
              <span style={{ fontSize: '13px', fontWeight: '700' }}>مجلد جديد</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '60px' }}>
      <Toast {...toast} />

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3C5C, #1A5F8C)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FolderIcon size={24} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0D3C5C', margin: 0 }}>مجلداتي</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '3px 0 0 0' }}>مفضلاتك ومجلداتك المخصصة ورفع الملفات في مكان واحد</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '5px', borderRadius: '14px', marginBottom: '28px', width: 'fit-content' }}>
        {[
          { key: 'favorites', label: 'المفضلة', count: favorites.length },
          { key: 'folders', label: 'مجلداتي', count: folders.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setOpenFolder(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.key ? '#0D3C5C' : '#64748B',
              border: 'none', borderRadius: '10px', padding: '9px 20px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              fontFamily: 'Tajawal, sans-serif',
              boxShadow: activeTab === tab.key ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {tab.key === 'favorites' ? <HeartIcon size={16} filled={activeTab === 'favorites'} color={activeTab === 'favorites' ? '#EF4444' : '#94A3B8'} /> : <FolderIcon size={16} color={activeTab === 'folders' ? '#F5A52A' : '#94A3B8'} />}
            {tab.label}
            {tab.count > 0 && (
              <span style={{ background: activeTab === tab.key ? '#F1F5F9' : '#E2E8F0', color: activeTab === tab.key ? '#0D3C5C' : '#64748B', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'favorites' ? renderFavorites() : renderFolders()}

      {/* Create Folder Modal */}
      {showCreateModal && (
        <CreateFolderModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateFolder} />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FavoriteCard({ item, onDelete, navigate }) {
  const handleView = () => {
    if (item.item_type === 'consultant') navigate(`/consultants/${item.item_id}`);
    else if (item.item_type === 'template') navigate('/consultant/templates');
    else if (item.item_type === 'regulation') navigate('/regulations');
    else if (item.item_type === 'document') navigate('/consultant/documents');
  };

  return (
    <div
      style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <ItemTypeIcon type={item.item_type} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C' }}>{item.title}</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '10px' }}>
              {ITEM_TYPE_LABELS[item.item_type] || item.item_type}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            {item.subtitle && <span>{item.subtitle} · </span>}
            {formatDate(item.created_at)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleView} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }} title="عرض"><ExternalLinkIcon /></button>
        <button onClick={() => onDelete(item)} style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }} title="إزالة"><TrashIcon /></button>
      </div>
    </div>
  );
}

function FolderCard({ folder, onClick, onDelete }) {
  return (
    <div
      style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = folder.color || '#F5A52A'; e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.07)`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: folder.color || '#F5A52A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FolderIcon size={22} color="#FFFFFF" />
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#CBD5E1', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#CBD5E1'; }}
          title="حذف المجلد"
        >
          <TrashIcon size={14} />
        </button>
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</h3>
      {folder.description && <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.description}</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: folder.description ? 0 : '12px' }}>
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formatDate(folder.created_at)}</span>
        <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
          {folder.items_count || 0} {folder.items_count === 1 ? 'عنصر/ملف' : 'عناصر/ملفات'}
        </span>
      </div>
    </div>
  );
}

function LoadingSpinner({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '25vh', gap: '14px', color: '#64748B', fontSize: '14px', fontWeight: '600' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#0D3C5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', background: '#FFFFFF', borderRadius: '20px', border: '1.5px dashed #E2E8F0', padding: '48px 24px', textAlign: 'center' }}>
      {icon}
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', margin: '16px 0 8px' }}>{title}</h2>
      <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '360px', lineHeight: '1.6', margin: 0 }}>{body}</p>
      {action}
    </div>
  );
}
