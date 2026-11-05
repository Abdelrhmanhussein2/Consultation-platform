import React, { useState, useEffect, useCallback } from 'react';
import '../components/knowledge/knowledge.css';
import { EMPTY_FORM, EMPTY_RULING_FORM, parseTags } from '../components/knowledge/knowledgeData';
import KnowledgeHeaderAndStats from '../components/knowledge/KnowledgeHeaderAndStats';
import KnowledgeFilterBar from '../components/knowledge/KnowledgeFilterBar';
import KnowledgeSourceForm from '../components/knowledge/KnowledgeSourceForm';
import KnowledgeRulingForm from '../components/knowledge/KnowledgeRulingForm';
import KnowledgeSourceList from '../components/knowledge/KnowledgeSourceList';
import KnowledgeEditModal from '../components/knowledge/KnowledgeEditModal';
import ConfirmModal from '../../components/ConfirmModal';

const getAuthHeaders = () => {
  let token = null;
  try {
    const m = document.cookie.match(/(?:^|;\s*)(?:token|access_token)=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  } catch {}
  if (!token) {
    try { token = localStorage.getItem('token') || localStorage.getItem('access_token'); } catch {}
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function AdminKnowledgePage() {
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState({ sources_count: 0, active_count: 0, chunks_count: 0, relations_count: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [minRevenueFilter, setMinRevenueFilter] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [rulingFormData, setRulingFormData] = useState(EMPTY_RULING_FORM);
  const [editingSource, setEditingSource] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtractingLaw, setIsExtractingLaw] = useState(false);
  const [isExtractingRuling, setIsExtractingRuling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/legal/stats', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setStats({ sources_count: d.sources_count ?? 0, active_count: d.active_count ?? 0, chunks_count: d.chunks_count ?? 0, relations_count: d.relations_count ?? 0 });
      }
    } catch {}
  }, []);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = kindFilter === 'precedent' ? 'judgment' : kindFilter === 'law' ? 'law' : 'all';
      const params = new URLSearchParams({ source_type: typeParam, page: '1', page_size: '50' });
      if (statusFilter === 'active') params.set('is_active', 'true');
      else if (statusFilter === 'inactive') params.set('is_active', 'false');
      if (yearFilter) params.set('year', yearFilter);
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/legal/sources?${params.toString()}`, { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setSources(data.items.map((s) => ({
            id: s.id, source_type: s.source_type, title: s.title, kind: s.source_type === 'judgment' ? 'precedent' : 'law',
            code: s.number ? `رقم ${s.number}` : s.id, number: s.number, year: s.year, court: s.court, is_active: s.is_active,
            body: s.body || '', articles_count: s.articles_count, citations_count: s.citations_count, tags: s.source_type === 'judgment' ? [s.court || 'حكم قضائي'] : ['تشريع']
          })));
        }
      }
    } catch {} finally { setLoading(false); }
  }, [kindFilter, statusFilter, yearFilter, search]);

  useEffect(() => { loadSources(); loadStats(); }, [loadSources, loadStats]);

  const handleSyncCore = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/legal/sync-core', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        if (d.stats) setStats(d.stats);
        showToast(d.message || 'تم تحديث النواة المرجعية وفهرسة القوانين والأحكام');
        loadSources();
      } else { showToast('تعذر تحديث النواة المرجعية'); }
    } catch { showToast('خطأ في الاتصال بالخادم'); } finally { setIsSyncing(false); }
  };

  const handleSaveLaw = async () => {
    const tags = parseTags(formData.tags);
    try {
      let res;
      if (formData.file?.name?.endsWith('.docx')) {
        const fd = new FormData();
        fd.append('file', formData.file); fd.append('law_id', formData.code || `law_${Date.now()}`);
        fd.append('title', formData.title); fd.append('number', formData.code?.replace(/\D/g, '') || '1');
        fd.append('year', String(formData.year || new Date().getFullYear())); fd.append('version_name', 'الأصلية');
        fd.append('effective_from', `${formData.year || new Date().getFullYear()}-01-01`);
        res = await fetch('/api/legal/upload-law', { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: fd });
      } else {
        res = await fetch('/api/legal/sources/manual-law', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...formData, tags }) });
      }
      if (res.ok) {
        showToast('تمت إضافة القانون وفهرسته بنجاح'); setFormData(EMPTY_FORM); loadSources(); loadStats();
      } else {
        const err = await res.json().catch(() => ({})); showToast(err.detail || 'تعذر حفظ القانون في الخادم');
      }
    } catch { showToast('خطأ في الاتصال أثناء حفظ القانون'); }
  };

  const handleSaveRuling = async () => {
    const tags = parseTags(rulingFormData.tags);
    try {
      let res;
      if (rulingFormData.file?.name?.endsWith('.docx')) {
        const fd = new FormData();
        fd.append('file', rulingFormData.file); fd.append('case_number', rulingFormData.caseNumber || `jdg_${Date.now()}`);
        fd.append('title', rulingFormData.title); fd.append('court', rulingFormData.court || 'تمييز حقوق');
        fd.append('ruling_year', String(rulingFormData.year || new Date().getFullYear()));
        res = await fetch('/api/legal/upload-judgment', { method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: fd });
      } else {
        res = await fetch('/api/legal/sources/manual-judgment', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...rulingFormData, tags }) });
      }
      if (res.ok) {
        showToast('تمت إضافة الحكم وفهرسته بنجاح'); setRulingFormData(EMPTY_RULING_FORM); loadSources(); loadStats();
      } else {
        const err = await res.json().catch(() => ({})); showToast(err.detail || 'تعذر حفظ الحكم القضائي');
      }
    } catch { showToast('خطأ في الاتصال أثناء حفظ الحكم'); }
  };

  const executeDeleteSource = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/legal/sources/${deleteTarget.id}?source_type=${deleteTarget.source_type}&force=true&permanent=true`, { method: 'DELETE', headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        showToast(d.message || 'تم حذف المصدر وفهارسه بنجاح');
        loadSources();
        loadStats();
      } else { showToast('تعذر حذف المصدر'); }
    } catch { showToast('خطأ في الاتصال أثناء الحذف'); }
    finally { setDeleteTarget(null); }
  };

  const handleEdit = (s) => setEditingSource(s);

  const handleSaveSourceEdit = async (sourceId, sourceType, updatedData) => {
    try {
      const res = await fetch(`/api/legal/sources/${sourceId}?source_type=${sourceType}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        showToast('تم تحديث بيانات المصدر القانوني بنجاح');
        setEditingSource(null);
        loadSources();
        loadStats();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'تعذر حفظ التعديلات');
      }
    } catch { showToast('خطأ في الاتصال أثناء التعديل'); }
  };

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setKindFilter('all');
    setStatusFilter('all');
    setYearFilter('');
    setEntityTypeFilter('all');
    setSectorFilter('all');
    setMinRevenueFilter('');
  }, []);

  return (
    <div className="knowledge-page">
      <div className="knowledge-container">
        <KnowledgeHeaderAndStats sourcesCount={stats.sources_count} chunksCount={stats.chunks_count} relationsCount={stats.relations_count} activeCount={stats.active_count} isSyncing={isSyncing} onSyncCore={handleSyncCore} />
        <KnowledgeFilterBar
          search={search}
          onSearchChange={setSearch}
          kind={kindFilter}
          onKindChange={setKindFilter}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          year={yearFilter}
          onYearChange={setYearFilter}
          entityType={entityTypeFilter}
          onEntityTypeChange={setEntityTypeFilter}
          sector={sectorFilter}
          onSectorChange={setSectorFilter}
          minRevenue={minRevenueFilter}
          onMinRevenueChange={setMinRevenueFilter}
          onReset={handleResetFilters}
        />
        <KnowledgeSourceForm formData={formData} setFormData={setFormData} onSave={handleSaveLaw} onReset={() => setFormData(EMPTY_FORM)} isExtracting={isExtractingLaw} setIsExtracting={setIsExtractingLaw} onNotify={showToast} />
        <KnowledgeRulingForm formData={rulingFormData} setFormData={setRulingFormData} onSave={handleSaveRuling} onReset={() => setRulingFormData(EMPTY_RULING_FORM)} isExtracting={isExtractingRuling} setIsExtracting={setIsExtractingRuling} onNotify={showToast} />
        <KnowledgeSourceList
          sources={sources}
          kindFilter={kindFilter}
          onKindFilterChange={setKindFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          yearFilter={yearFilter}
          onYearFilterChange={setYearFilter}
          entityTypeFilter={entityTypeFilter}
          onEntityTypeFilterChange={setEntityTypeFilter}
          sectorFilter={sectorFilter}
          onSectorFilterChange={setSectorFilter}
          minRevenueFilter={minRevenueFilter}
          onMinRevenueFilterChange={setMinRevenueFilter}
          searchQuery={search}
          onSearchChange={setSearch}
          onReset={handleResetFilters}
          onEdit={handleEdit}
          onBroadcast={() => showToast('تم إرسال تنبيه بالمستجدات للمكلفين')}
          onDelete={(id, typ) => setDeleteTarget({ id, source_type: typ })}
        />
      </div>
      <KnowledgeEditModal isOpen={Boolean(editingSource)} source={editingSource} onSave={handleSaveSourceEdit} onClose={() => setEditingSource(null)} />
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="تأكيد حذف المصدر القانوني"
        message="هل أنت متأكد من حذف هذا المصدر وفهارسه ومتجهاته بالكامل من النظام؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف المصدر"
        onConfirm={executeDeleteSource}
        onClose={() => setDeleteTarget(null)}
      />
      {toastMessage && <div className="knowledge-toast">{toastMessage}</div>}
    </div>
  );
}
