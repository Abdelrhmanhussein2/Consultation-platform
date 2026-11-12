import React, { useState, useEffect, useCallback } from 'react';
import '../components/knowledge/knowledge.css';
import { EMPTY_FORM, EMPTY_RULING_FORM } from '../components/knowledge/knowledgeData';
import {
  fetchKnowledgeStats,
  fetchKnowledgeSources,
  fetchKnowledgeSourceDetail,
  syncKnowledgeCore,
  saveLawSource,
  saveRulingSource,
  updateKnowledgeSource,
  deleteKnowledgeSource
} from '../components/knowledge/knowledgeApi';
import KnowledgeHeaderAndStats from '../components/knowledge/KnowledgeHeaderAndStats';
import KnowledgeFilterBar from '../components/knowledge/KnowledgeFilterBar';
import KnowledgeSourceForm from '../components/knowledge/KnowledgeSourceForm';
import KnowledgeRulingForm from '../components/knowledge/KnowledgeRulingForm';
import KnowledgeSourceList from '../components/knowledge/KnowledgeSourceList';
import KnowledgeEditModal from '../components/knowledge/KnowledgeEditModal';
import KnowledgeBroadcastModal from '../components/knowledge/KnowledgeBroadcastModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminKnowledgePage() {
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState({ sources_count: 0, active_count: 0, chunks_count: 0, relations_count: 0 });
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [rulingFormData, setRulingFormData] = useState(EMPTY_RULING_FORM);
  const [editingSource, setEditingSource] = useState(null);
  const [broadcastTarget, setBroadcastTarget] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtractingLaw, setIsExtractingLaw] = useState(false);
  const [isExtractingRuling, setIsExtractingRuling] = useState(false);
  const [isSavingLaw, setIsSavingLaw] = useState(false);
  const [isSavingRuling, setIsSavingRuling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const next = await fetchKnowledgeStats();
      if (next) setStats(next);
    } catch {}
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const items = await fetchKnowledgeSources({ kindFilter, statusFilter, yearFilter, search });
      if (items) setSources(items);
    } catch {}
  }, [kindFilter, statusFilter, yearFilter, search]);

  useEffect(() => { loadSources(); loadStats(); }, [loadSources, loadStats]);

  const handleSyncCore = async () => {
    setIsSyncing(true);
    try {
      const res = await syncKnowledgeCore();
      if (res.ok) {
        const d = await res.json();
        if (d.stats) setStats(d.stats);
        showToast(d.message || 'تم تحديث النواة المرجعية وفهرسة القوانين والأحكام');
        loadSources();
      } else { showToast('تعذر تحديث النواة المرجعية'); }
    } catch { showToast('خطأ في الاتصال بالخادم'); }
    finally { setIsSyncing(false); }
  };

  const handleSaveLaw = async () => {
    if (isSavingLaw) return;
    setIsSavingLaw(true);
    try {
      const res = await saveLawSource(formData);
      if (res.ok) {
        showToast('تمت إضافة القانون وفهرسته بنجاح');
        setFormData(EMPTY_FORM);
        loadSources();
        loadStats();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'تعذر حفظ القانون في الخادم');
      }
    } catch { showToast('خطأ في الاتصال أثناء حفظ القانون'); }
    finally { setIsSavingLaw(false); }
  };

  const handleSaveRuling = async () => {
    if (isSavingRuling) return;
    setIsSavingRuling(true);
    try {
      const res = await saveRulingSource(rulingFormData);
      if (res.ok) {
        showToast('تمت إضافة الحكم وفهرسته بنجاح');
        setRulingFormData(EMPTY_RULING_FORM);
        loadSources();
        loadStats();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'تعذر حفظ الحكم القضائي');
      }
    } catch { showToast('خطأ في الاتصال أثناء حفظ الحكم'); }
    finally { setIsSavingRuling(false); }
  };

  const executeDeleteSource = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteKnowledgeSource(deleteTarget.id, deleteTarget.source_type);
      if (res.ok) {
        const d = await res.json();
        showToast(d.message || 'تم حذف المصدر وفهارسه بنجاح');
        loadSources();
        loadStats();
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[DELETE SOURCE]', res.status, err);
        showToast(err.detail || `فشل الحذف (${res.status})`);
      }
    } catch (e) {
      console.error('[DELETE SOURCE]', e);
      showToast('خطأ في الاتصال أثناء الحذف');
    } finally { setDeleteTarget(null); }
  };

  const handleEdit = async (s) => {
    const srcType = s.source_type || (s.kind === 'precedent' ? 'judgment' : 'law');
    try {
      const full = await fetchKnowledgeSourceDetail(s.id, srcType);
      if (full) {
        setEditingSource({ ...s, body: full.body ?? full.content ?? full.text ?? s.body ?? '' });
        return;
      }
    } catch {}
    setEditingSource(s);
  };

  const handleSaveSourceEdit = async (sourceId, sourceType, updatedData) => {
    try {
      const res = await updateKnowledgeSource(sourceId, sourceType, updatedData);
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
  }, []);

  return (
    <div className="knowledge-page">
      <div className="knowledge-container">
        <KnowledgeHeaderAndStats sourcesCount={stats.sources_count} chunksCount={stats.chunks_count} relationsCount={stats.relations_count} activeCount={stats.active_count} isSyncing={isSyncing} onSyncCore={handleSyncCore} />
        <KnowledgeFilterBar search={search} onSearchChange={setSearch} kind={kindFilter} onKindChange={setKindFilter} status={statusFilter} onStatusChange={setStatusFilter} year={yearFilter} onYearChange={setYearFilter} onReset={handleResetFilters} />
        <KnowledgeSourceForm formData={formData} setFormData={setFormData} onSave={handleSaveLaw} onReset={() => setFormData(EMPTY_FORM)} isExtracting={isExtractingLaw} setIsExtracting={setIsExtractingLaw} isSaving={isSavingLaw} onNotify={showToast} />
        <KnowledgeRulingForm formData={rulingFormData} setFormData={setRulingFormData} onSave={handleSaveRuling} onReset={() => setRulingFormData(EMPTY_RULING_FORM)} isExtracting={isExtractingRuling} setIsExtracting={setIsExtractingRuling} isSaving={isSavingRuling} onNotify={showToast} />
        <KnowledgeSourceList sources={sources} kindFilter={kindFilter} onKindFilterChange={setKindFilter} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} yearFilter={yearFilter} onYearFilterChange={setYearFilter} searchQuery={search} onSearchChange={setSearch} onReset={handleResetFilters} onEdit={handleEdit} onBroadcast={(item) => setBroadcastTarget(item)} onDelete={(id, typ) => setDeleteTarget({ id, source_type: typ })} />
      </div>
      <KnowledgeEditModal isOpen={Boolean(editingSource)} source={editingSource} onSave={handleSaveSourceEdit} onClose={() => setEditingSource(null)} />
      <KnowledgeBroadcastModal isOpen={Boolean(broadcastTarget)} source={broadcastTarget} onClose={() => setBroadcastTarget(null)} onNotify={showToast} />
      <ConfirmModal isOpen={Boolean(deleteTarget)} title="تأكيد حذف المصدر القانوني" message="هل أنت متأكد من حذف هذا المصدر وفهارسه ومتجهاته بالكامل من النظام؟ لا يمكن التراجع عن هذا الإجراء." confirmText="حذف المصدر" onConfirm={executeDeleteSource} onClose={() => setDeleteTarget(null)} />
      {toastMessage && <div className="knowledge-toast">{toastMessage}</div>}
    </div>
  );
}
