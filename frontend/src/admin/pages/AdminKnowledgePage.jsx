import React, { useState, useMemo } from 'react';
import '../components/knowledge/knowledge.css';
import {
  initialSources,
  initialChunks,
  initialRelations,
  EMPTY_FORM,
  EMPTY_RULING_FORM,
  parseTags
} from '../components/knowledge/knowledgeData';
import KnowledgeHeaderAndStats from '../components/knowledge/KnowledgeHeaderAndStats';
import KnowledgeFilterBar from '../components/knowledge/KnowledgeFilterBar';
import KnowledgeSourceForm from '../components/knowledge/KnowledgeSourceForm';
import KnowledgeRulingForm from '../components/knowledge/KnowledgeRulingForm';
import KnowledgeSourceList from '../components/knowledge/KnowledgeSourceList';
import KnowledgeInspectModal from '../components/knowledge/KnowledgeInspectModal';

export default function AdminKnowledgePage() {
  const [sources, setSources] = useState(initialSources);
  const [chunks, setChunks] = useState(initialChunks);
  const [relations, setRelations] = useState(initialRelations);

  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('llc');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [minRevenueFilter, setMinRevenueFilter] = useState('');

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [rulingFormData, setRulingFormData] = useState(EMPTY_RULING_FORM);
  const [inspectSource, setInspectSource] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtractingLaw, setIsExtractingLaw] = useState(false);
  const [isExtractingRuling, setIsExtractingRuling] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSyncCore = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('تم تحديث النواة المرجعية وفهرسة القوانين والأحكام القضائية بنجاح');
    }, 1200);
  };

  const handleSaveLaw = () => {
    const tags = parseTags(formData.tags);
    if (formData.id) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === formData.id
            ? { ...s, title: formData.title, kind: formData.kind, code: formData.code || null, body: formData.body, year: formData.year, tags, source_url: formData.sourceUrl || null, file_name: formData.fileName || s.file_name }
            : s
        )
      );
      showToast('تم تعديل القانون وإعادة فهرسته في RAG');
    } else {
      const newSource = {
        id: 'src-' + Date.now(),
        title: formData.title,
        kind: formData.kind,
        code: formData.code || 'DOC-' + Math.floor(100 + Math.random() * 900),
        body: formData.body,
        year: formData.year,
        tags,
        source_url: formData.sourceUrl || null,
        is_active: true,
        file_name: formData.fileName || null
      };
      setSources((prev) => [newSource, ...prev]);
      showToast('تمت إضافة القانون وفهرسته في RAG');
    }
    setFormData(EMPTY_FORM);
  };

  const handleSaveRuling = () => {
    const tags = parseTags(rulingFormData.tags);
    if (rulingFormData.id) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === rulingFormData.id
            ? { ...s, title: rulingFormData.title, kind: 'precedent', code: rulingFormData.caseNumber || s.code, body: rulingFormData.principle, year: rulingFormData.year, tags, file_name: rulingFormData.fileName || s.file_name }
            : s
        )
      );
      showToast('تم تعديل الحكم القضائي وفهارسه');
    } else {
      const newRuling = {
        id: 'jdg-' + Date.now(),
        title: rulingFormData.title,
        kind: 'precedent',
        code: rulingFormData.caseNumber || 'JDG-' + Math.floor(1000 + Math.random() * 9000),
        body: rulingFormData.principle,
        year: rulingFormData.year,
        tags: tags.length ? tags : ['حكم قضائي'],
        is_active: true,
        file_name: rulingFormData.fileName || null
      };
      setSources((prev) => [newRuling, ...prev]);
      showToast('تمت إضافة الحكم القضائي وفهرسته في RAG');
    }
    setRulingFormData(EMPTY_RULING_FORM);
  };

  const handleEdit = (source) => {
    if (source.kind === 'precedent') {
      setRulingFormData({
        id: source.id,
        title: source.title,
        court: 'cassation_rights',
        caseNumber: source.code || '',
        legalArticle: '',
        year: source.year || new Date().getFullYear(),
        tags: (source.tags || []).join('، '),
        principle: source.body || '',
        sourceUrl: source.source_url || '',
        fileName: source.file_name || null
      });
      window.scrollTo({ top: 680, behavior: 'smooth' });
    } else {
      setFormData({
        id: source.id,
        title: source.title,
        kind: source.kind,
        code: source.code || '',
        body: source.body || '',
        year: source.year || new Date().getFullYear(),
        tags: (source.tags || []).join('، '),
        sourceUrl: source.source_url || '',
        isActive: source.is_active ?? true,
        fileName: source.file_name || null
      });
      window.scrollTo({ top: 220, behavior: 'smooth' });
    }
  };

  const filteredSources = useMemo(() => {
    return sources.filter((item) => {
      const matchKind = kindFilter === 'all' || item.kind === kindFilter;
      const term = search.trim().toLowerCase();
      const matchSearch =
        !term ||
        `${item.title} ${item.code || ''} ${(item.tags || []).join(' ')}`
          .toLowerCase()
          .includes(term);
      return matchKind && matchSearch;
    });
  }, [sources, kindFilter, search]);

  const activeCount = useMemo(() => sources.filter((s) => s.is_active).length, [sources]);

  return (
    <div className="knowledge-page">
      <div className="knowledge-container">
        <KnowledgeHeaderAndStats
          sourcesCount={sources.length}
          chunksCount={chunks.length}
          relationsCount={relations.length}
          activeCount={activeCount}
          isSyncing={isSyncing}
          onSyncCore={handleSyncCore}
        />

        <KnowledgeFilterBar
          search={search}
          onSearchChange={setSearch}
          kind={kindFilter}
          onKindChange={setKindFilter}
          entityType={entityTypeFilter}
          onEntityTypeChange={setEntityTypeFilter}
          sector={sectorFilter}
          onSectorChange={setSectorFilter}
          minRevenue={minRevenueFilter}
          onMinRevenueChange={setMinRevenueFilter}
          onReset={() => {
            setSearch('');
            setKindFilter('all');
            setEntityTypeFilter('all');
            setSectorFilter('all');
            setMinRevenueFilter('');
          }}
        />

        {/* Form 1: القانون والمادة */}
        <KnowledgeSourceForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveLaw}
          onReset={() => setFormData(EMPTY_FORM)}
          isExtracting={isExtractingLaw}
          setIsExtracting={setIsExtractingLaw}
          onNotify={showToast}
        />

        {/* Form 2: الحكم القضائي (تحتها مباشرة) */}
        <KnowledgeRulingForm
          formData={rulingFormData}
          setFormData={setRulingFormData}
          onSave={handleSaveRuling}
          onReset={() => setRulingFormData(EMPTY_RULING_FORM)}
          isExtracting={isExtractingRuling}
          setIsExtracting={setIsExtractingRuling}
          onNotify={showToast}
        />

        {/* قائمة المصادر والأحكام الحالية */}
        <KnowledgeSourceList
          sources={filteredSources}
          onInspect={(s) => setInspectSource(s)}
          onEdit={handleEdit}
          onBroadcast={(s) => showToast(`تم إرسال تنبيه بالحكم/التعديل إلى 115 مكلف متأثر`)}
          onDelete={(id) => {
            setSources((prev) => prev.filter((s) => s.id !== id));
            showToast('تم حذف السجل وفهارسه بنجاح');
          }}
        />
      </div>

      <KnowledgeInspectModal
        isOpen={Boolean(inspectSource)}
        onClose={() => setInspectSource(null)}
        source={inspectSource}
        chunks={chunks}
        relations={relations}
      />

      {toastMessage && <div className="knowledge-toast">{toastMessage}</div>}
    </div>
  );
}
