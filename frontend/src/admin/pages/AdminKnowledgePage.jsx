import React, { useState, useEffect, useCallback } from 'react';
import '../components/knowledge/knowledge.css';
import { EMPTY_FORM, EMPTY_RULING_FORM } from '../components/knowledge/knowledgeData';
import {
  fetchKnowledgeStats,
  fetchKnowledgeSources,
  fetchKnowledgeSourceDetail,
  fetchParentLaws,
  syncKnowledgeCore,
  saveLawSource,
  saveRulingSource,
  updateKnowledgeSource,
  toggleKnowledgeSourceActive,
  deleteKnowledgeSource
} from '../components/knowledge/knowledgeApi';
import KnowledgeHeaderAndStats from '../components/knowledge/KnowledgeHeaderAndStats';
import KnowledgeFilterBar from '../components/knowledge/KnowledgeFilterBar';
import KnowledgeSourceForm from '../components/knowledge/KnowledgeSourceForm';
import KnowledgeRulingForm from '../components/knowledge/KnowledgeRulingForm';
import KnowledgeSourceList from '../components/knowledge/KnowledgeSourceList';
import KnowledgeEditModal from '../components/knowledge/KnowledgeEditModal';
import KnowledgeBroadcastModal from '../components/knowledge/KnowledgeBroadcastModal';
import RepealLawModal from '../components/knowledge/RepealLawModal';
import RestoreLawModal from '../components/knowledge/RestoreLawModal';

export default function AdminKnowledgePage() {
  const [sources, setSources] = useState([]);
  const [parentLaws, setParentLaws] = useState([]);
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
  const [repealTarget, setRepealTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
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

  const loadParentLaws = useCallback(async () => {
    try {
      const items = await fetchParentLaws({ limit: 50 });
      if (Array.isArray(items)) setParentLaws(items);
    } catch {}
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const items = await fetchKnowledgeSources({ kindFilter, statusFilter, yearFilter, search });
      if (items) setSources(items);
    } catch {}
  }, [kindFilter, statusFilter, yearFilter, search]);

  useEffect(() => { loadSources(); loadStats(); loadParentLaws(); }, [loadSources, loadStats, loadParentLaws]);

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

  const handleRepealSuccess = () => {
    showToast('تم إلغاء المصدر وتحديث حالة التوابع بنجاح');
    loadSources();
    loadStats();
    loadParentLaws();
  };

  const handleRestoreSuccess = () => {
    showToast('تمت إعادة تفعيل المصدر بنجاح');
    loadSources();
    loadStats();
    loadParentLaws();
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
        const d = await res.json().catch(() => ({}));
        showToast(d.warning ? d.warning : 'تم تحديث بيانات المصدر وارتباطاته بنجاح');
        setEditingSource(null);
        loadSources();
        loadStats();
        loadParentLaws();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'تعذر حفظ التعديلات');
      }
    } catch { showToast('خطأ في الاتصال أثناء التعديل'); }
  };

  const handleToggleActive = async (item) => {
    const srcType = item.source_type || (item.kind === 'precedent' ? 'judgment' : 'law');
    try {
      const res = await toggleKnowledgeSourceActive(item.id, srcType);
      if (res.ok) {
        const d = await res.json();
        showToast(d.is_active ? 'تم تفعيل المصدر وإتاحته في المنصة' : 'تم إيقاف المصدر وإخفاؤه من المنصة');
        loadSources();
        loadStats();
      } else {
        showToast('تعذر تغيير حالة المصدر');
      }
    } catch {
      showToast('خطأ في الاتصال أثناء تغيير الحالة');
    }
  };

  const handleResetFilters = useCallback(() => {
    setSearch(''); setKindFilter('all'); setStatusFilter('all'); setYearFilter('');
  }, []);

  return (
    <div className="knowledge-page">
      <div className="knowledge-container">
        <KnowledgeHeaderAndStats sourcesCount={stats.sources_count} chunksCount={stats.chunks_count} relationsCount={stats.relations_count} activeCount={stats.active_count} isSyncing={isSyncing} onSyncCore={handleSyncCore} />
        <KnowledgeFilterBar search={search} onSearchChange={setSearch} kind={kindFilter} onKindChange={setKindFilter} status={statusFilter} onStatusChange={setStatusFilter} year={yearFilter} onYearChange={setYearFilter} onReset={handleResetFilters} />
        <KnowledgeSourceForm formData={formData} setFormData={setFormData} onSave={handleSaveLaw} onReset={() => setFormData(EMPTY_FORM)} isExtracting={isExtractingLaw} setIsExtracting={setIsExtractingLaw} isSaving={isSavingLaw} onNotify={showToast} parentLaws={parentLaws} />
        <KnowledgeRulingForm formData={rulingFormData} setFormData={setRulingFormData} onSave={handleSaveRuling} onReset={() => setRulingFormData(EMPTY_RULING_FORM)} isExtracting={isExtractingRuling} setIsExtracting={setIsExtractingRuling} isSaving={isSavingRuling} onNotify={showToast} parentLaws={parentLaws} />
        <KnowledgeSourceList sources={sources} kindFilter={kindFilter} onKindFilterChange={setKindFilter} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} yearFilter={yearFilter} onYearFilterChange={setYearFilter} searchQuery={search} onSearchChange={setSearch} onReset={handleResetFilters} onEdit={handleEdit} onToggleActive={handleToggleActive} onBroadcast={(item) => setBroadcastTarget(item)} onRepeal={(item) => setRepealTarget(item)} onRestore={(item) => setRestoreTarget(item)} />
      </div>
      <KnowledgeEditModal isOpen={Boolean(editingSource)} source={editingSource} onSave={handleSaveSourceEdit} onClose={() => setEditingSource(null)} />
      <KnowledgeBroadcastModal isOpen={Boolean(broadcastTarget)} source={broadcastTarget} onClose={() => setBroadcastTarget(null)} onNotify={showToast} />
      <RepealLawModal isOpen={Boolean(repealTarget)} source={repealTarget} onClose={() => setRepealTarget(null)} onSuccess={handleRepealSuccess} parentLaws={parentLaws} />
      <RestoreLawModal isOpen={Boolean(restoreTarget)} source={restoreTarget} onClose={() => setRestoreTarget(null)} onSuccess={handleRestoreSuccess} />
      {toastMessage && <div className="knowledge-toast">{toastMessage}</div>}
    </div>
  );
}
