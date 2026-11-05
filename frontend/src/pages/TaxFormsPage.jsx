// frontend/src/pages/TaxFormsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './../components/TaxForms/taxForms.css';
import TaxFormsHeader from '../components/TaxForms/TaxFormsHeader';
import TaxFormsFilterBar from '../components/TaxForms/TaxFormsFilterBar';
import TaxFormsGrid from '../components/TaxForms/TaxFormsGrid';
import AddTaxFormModal from '../components/TaxForms/AddTaxFormModal';
import ConfirmModal from '../components/ConfirmModal';

const getAuthHeaders = () => {
  let token = null;
  try {
    const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  } catch {}
  if (!token) { try { token = localStorage.getItem('token'); } catch {} }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapTemplate = (t) => ({ id: t.id, code: t.code, title: t.title, desc: t.description || '', cat: t.category || 'عام', lang: t.language || 'عربي', format: (t.file_type || 'PDF').toUpperCase(), file_url: t.file_url, file_name: t.file_name, downloads_count: t.downloads_count || 0, is_active: t.is_active });

export default function TaxFormsPage({ isAdmin = false }) {
  const isEffectiveAdmin =
    isAdmin || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  const [formsList, setFormsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const [favorites, setFavorites] = useState([]);
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch('/api/favorites/', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setFavorites(data.filter((f) => f.item_type === 'template').map((f) => String(f.item_id)));
      }
    } catch {}
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/templates/', { headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFormsList(Array.isArray(data) ? data.map(mapTemplate) : []);
    } catch {
      setLoadError('تعذر تحميل النماذج الضريبية من الخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); loadFavorites(); }, [loadTemplates, loadFavorites]);

  const handleToggleFavorite = async (form) => {
    const fid = String(form.id);
    const isFav = favoritesSet.has(fid);
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== fid) : [...prev, fid]));
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ item_type: 'template', item_id: fid, title: form.title, subtitle: `${form.cat} · ${form.format}` })
      });
      if (res.ok) {
        const d = await res.json();
        showToast(d.status === 'added' ? 'تمت إضافة النموذج إلى المفضلة' : 'تمت إزالة النموذج من المفضلة');
      }
    } catch {
      setFavorites((prev) => (isFav ? [...prev, fid] : prev.filter((id) => id !== fid)));
    }
  };

  const handleDownload = async (form) => {
    try {
      const res = await fetch(`/api/templates/${form.id}/download`, { headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('فشل التحميل من الخادم');
      const disp = res.headers.get('Content-Disposition') || '';
      const fmt = (form.format || '').toUpperCase();
      const ext = fmt.includes('XLS') ? 'xlsx' : fmt.includes('DOC') ? 'docx' : 'pdf';
      let filename = `${form.title || form.code}.${ext}`;
      const match = disp.match(/filename\*=UTF-8''([^;]+)/i) || disp.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) filename = decodeURIComponent(match[1]);
      const blob = await res.blob();

      if (typeof window.showSaveFilePicker === 'function') {
        try {
          const handle = await window.showSaveFilePicker({ suggestedName: filename });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          setFormsList((prev) => prev.map((f) => (f.id === form.id ? { ...f, downloads_count: (f.downloads_count || 0) + 1 } : f)));
          showToast('تم حفظ وتحميل النموذج بنجاح');
          return;
        } catch (pickerErr) {
          if (pickerErr.name === 'AbortError') return;
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFormsList((prev) => prev.map((f) => (f.id === form.id ? { ...f, downloads_count: (f.downloads_count || 0) + 1 } : f)));
      setTimeout(() => showToast('تم تنزيل النموذج بنجاح'), 800);
    } catch {
      showToast('تعذر تحميل النموذج، تأكد من توفر الملف على الخادم');
    }
  };

  const handleAddForm = async (payload, file) => {
    const fd = new FormData();
    fd.append('title', payload.title); fd.append('code', payload.code); fd.append('description', payload.desc || '');
    fd.append('category', payload.cat || 'عام'); fd.append('language', payload.lang || 'عربي');
    if (file) fd.append('file', file);
    try {
      const res = await fetch('/api/templates/upload', { method: 'POST', headers: getAuthHeaders(), body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'فشل في إضافة النموذج');
      const created = await res.json();
      setFormsList((prev) => [mapTemplate(created), ...prev]);
      showToast('تمت إضافة النموذج الضريبي بنجاح');
    } catch (err) { showToast(err.message || 'حدث خطأ أثناء الإضافة'); }
  };

  const handleUpdateForm = async (updatedForm, newFile) => {
    try {
      const res = await fetch(`/api/templates/${updatedForm.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: updatedForm.title, code: updatedForm.code, description: updatedForm.desc, category: updatedForm.cat, language: updatedForm.lang })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'فشل في تحديث بيانات النموذج');
      let fresh = await res.json();
      if (newFile) {
        const fd = new FormData(); fd.append('file', newFile);
        const fRes = await fetch(`/api/templates/${updatedForm.id}/file`, { method: 'PUT', headers: getAuthHeaders(), body: fd });
        if (fRes.ok) fresh = await fRes.json();
      }
      setFormsList((prev) => prev.map((f) => (f.id === updatedForm.id ? mapTemplate(fresh) : f)));
      showToast('تم تحديث بيانات النموذج بنجاح');
    } catch (err) { showToast(err.message || 'حدث خطأ أثناء التحديث'); }
  };

  const executeDeleteForm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/templates/${deleteTarget.id}`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('فشل في حذف النموذج');
      setFormsList((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      showToast('تم مسح النموذج بنجاح');
    } catch (err) { showToast(err.message || 'حدث خطأ أثناء الحذف'); }
    finally { setDeleteTarget(null); }
  };

  const filteredForms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return formsList.filter((f) => (selectedCategory === 'الكل' || f.cat === selectedCategory) && (!q || [f.title, f.code, f.desc].join(' ').toLowerCase().includes(q)));
  }, [formsList, searchQuery, selectedCategory]);

  return (
    <div className="tax-forms-container">
      <TaxFormsHeader isAdmin={isEffectiveAdmin} onOpenAddModal={() => { setEditingForm(null); setIsAddModalOpen(true); }} />
      <TaxFormsFilterBar
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory}
        onReset={() => { setSearchQuery(''); setSelectedCategory('الكل'); }}
      />
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B', fontWeight: 600 }}>
          جاري تحميل النماذج الضريبية من قاعدة البيانات...
        </div>
      ) : loadError ? (
        <div className="tax-empty-state">
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0D3C5C', margin: '0 0 8px 0' }}>
            تعذر الاتصال بقاعدة بيانات النماذج
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0', maxWidth: '420px', lineHeight: 1.6 }}>
            {loadError}. تأكد من تشغيل خادم المنصة، أو أعد المحاولة بعد قليل.
          </p>
          <button type="button" onClick={loadTemplates} className="tax-cat-pill active" style={{ margin: '0 auto', display: 'inline-block' }}>
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <TaxFormsGrid
          forms={filteredForms} favoritesSet={favoritesSet} isAdmin={isEffectiveAdmin}
          onDownload={handleDownload} onToggleFavorite={handleToggleFavorite}
          onEdit={(f) => { setEditingForm(f); setIsAddModalOpen(true); }} onDelete={(f) => setDeleteTarget(f)}
          onResetFilters={() => { setSearchQuery(''); setSelectedCategory('الكل'); }}
        />
      )}
      {isEffectiveAdmin && (
        <AddTaxFormModal
          isOpen={isAddModalOpen} initialForm={editingForm}
          onClose={() => { setIsAddModalOpen(false); setEditingForm(null); }}
          onAddForm={handleAddForm} onUpdateForm={handleUpdateForm}
        />
      )}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="تأكيد حذف النموذج الضريبي"
        message={`هل أنت متأكد من حذف النموذج: "${deleteTarget?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف النموذج"
        onConfirm={executeDeleteForm}
        onClose={() => setDeleteTarget(null)}
      />
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '26px', left: '50%', transform: 'translateX(-50%)',
          background: '#0D3C5C', color: '#FFFFFF', padding: '11px 24px', borderRadius: '12px',
          fontWeight: 700, fontSize: '13.5px', boxShadow: '0 10px 30px rgba(13,60,92,0.3)',
          zIndex: 1100, border: '1px solid #1E4E70', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E58A13', display: 'inline-block' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
