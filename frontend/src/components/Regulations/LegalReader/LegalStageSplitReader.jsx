import React, { useState, useEffect } from 'react';
import RelatedFilesGrid from './RelatedFilesGrid';
import LegalStageMetaTable from './LegalStageMetaTable';
import LegalStageArticlesList from './LegalStageArticlesList';
import { getLawTree } from '../../../services/legalService';

export const STAGES_CONFIG = {};

export function getArticlesForStage(stageId, lawTree) {
  if (!lawTree) return [];
  const secs = lawTree.sections || [];
  if (secs.length > 0) return secs.flatMap(s => s.articles || []);
  return lawTree.articles || [];
}

export default function LegalStageSplitReader({
  stageId,
  stageObj,
  stagesList,
  lawTree,
  onClose,
  onSetAsMain,
  relatedDoc,
  isMaximized,
  onToggleMaximize,
  onSelectStage
}) {
  const [sideTab, setSideTab] = useState('info');
  const [fetchedTree, setFetchedTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState(14);
  const [copied, setCopied] = useState(false);

  const isRelated = Boolean(relatedDoc);
  const currentStage = stageObj || stagesList?.find(s => s.id === stageId) || null;
  const title = isRelated
    ? relatedDoc.title
    : (currentStage?.title || lawTree?.title || 'التشريع القانوني');
  const meta = isRelated
    ? { ...(relatedDoc || {}), ...(relatedDoc?.meta || {}) }
    : (currentStage?.meta || {
        type: 'قانون',
        number: lawTree?.number ? `${lawTree.number} لسنة ${lawTree.year || ''}` : '—',
        issueDate: lawTree?.issue_date || '—',
        effectiveDate: lawTree?.effective_date || '—',
        gazette: lawTree?.gazette || '—',
        status: currentStage?.status || lawTree?.status || 'ساري'
      });

  const isRuling = Boolean(
    (meta?.type || '').includes('حكم') || (title || '').includes('حكم') || (title || '').includes('قرار') || meta?.ruling_number
  );
  const docType = meta?.type || (isRuling ? 'حكم قضائي' : 'تشريع مرتبط');
  const docNum = meta?.number || meta?.ruling_number || '—';
  const docDate = meta?.effectiveDate || meta?.issueDate || meta?.date || '—';
  const docCourt = meta?.court || meta?.source || (isRuling ? 'محكمة مختصة' : 'الجريدة الرسمية');
  const docFullText = (relatedDoc?.full_text || relatedDoc?.text || meta?.full_text || meta?.text || '').trim();

  useEffect(() => {
    if (isRelated || !stageId) return;
    const targetLawId = currentStage?.law_id;
    const currentLawId = lawTree?.law_id || lawTree?.id;
    if (targetLawId && targetLawId !== currentLawId) {
      setLoading(true);
      getLawTree(targetLawId)
        .then(data => { if (data) setFetchedTree(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setFetchedTree(null);
    }
  }, [stageId, isRelated, currentStage?.law_id, lawTree?.law_id, lawTree?.id]);

  const activeTree = fetchedTree || lawTree;
  const articles = activeTree
    ? ((activeTree.sections || []).flatMap(s => s.articles || []).length > 0
        ? (activeTree.sections || []).flatMap(s => s.articles || [])
        : (activeTree.articles || []))
    : [];

  const handleCopy = () => {
    if (!docFullText) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(docFullText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className={`side-reader-pane ${isMaximized ? 'is-maximized' : ''}`} id="stagePopupReader">
      <div className="side-reader-head">
        <div className="side-reader-head-actions">
          <button className="side-reader-icon-btn close-btn" onClick={onClose} title="إغلاق">✕</button>
          <button
            className={`side-reader-icon-btn popout-btn ${isMaximized ? 'active' : ''}`}
            onClick={onToggleMaximize || (() => onSetAsMain && onSetAsMain(isRelated ? relatedDoc : (currentStage || stageId)))}
            title={isMaximized ? 'استعادة الحجم الطبيعي' : 'تكبير الشاشة'}
          >
            {isMaximized ? '🗗' : '🗖'}
          </button>
        </div>
        <h3 className="side-reader-head-title" title={title}>{title}</h3>
      </div>

      <div className="side-reader-tabs-wrap">
        <div className="side-reader-tabs">
          <button className={sideTab === 'info' ? 'active' : ''} onClick={() => setSideTab('info')}>معلومات الوثيقة</button>
          <button className={sideTab === 'description' ? 'active' : ''} onClick={() => setSideTab('description')}>وصف الوثيقة</button>
          <button className={sideTab === 'related' ? 'active' : ''} onClick={() => setSideTab('related')}>ملفات ذات صلة</button>
          <button className={sideTab === 'timeline' ? 'active' : ''} onClick={() => setSideTab('timeline')}>مراحل التشريع</button>
        </div>
      </div>

      <div className="side-reader-body">
        {sideTab === 'info' && (
          <LegalStageMetaTable
            isRelated={isRelated}
            isRuling={isRuling}
            meta={meta}
            docType={docType}
            docNum={docNum}
            docDate={docDate}
            docCourt={docCourt}
            title={title}
            docFullText={docFullText}
            copied={copied}
            handleCopyFullText={handleCopy}
            readerFontSize={readerFontSize}
            setReaderFontSize={setReaderFontSize}
          />
        )}

        {sideTab === 'description' && (
          <div className="side-reader-tab-page">
            <div className="side-reader-title-card" style={{ marginBottom: '16px' }}>{title}</div>
            <div className="side-reader-desc-box">
              <div style={{ whiteSpace: 'pre-line', lineHeight: 2, color: '#334155' }}>
                {activeTree?.summary || docFullText || `${title} — وثيقة قانونية معتمدة وفقاً للأحكام والأنظمة السارية.`}
              </div>
            </div>
          </div>
        )}

        {sideTab === 'related' && (
          <div className="side-reader-tab-page">
            <RelatedFilesGrid
              selectedFileId={relatedDoc?.id}
              onSelectFile={(doc) => { if (onSetAsMain) onSetAsMain(doc); }}
            />
          </div>
        )}

        {sideTab === 'timeline' && (
          <div className="side-reader-tab-page">
            <div className="side-reader-timeline-box" style={{ direction: 'rtl' }}>
              {(stagesList && stagesList.length > 0 ? stagesList : [{ id: 'current', title, date: docDate }]).map((stg) => (
                <div
                  key={stg.id}
                  className="side-timeline-item"
                  onClick={() => onSelectStage && onSelectStage(stg.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <strong className="side-t-title">{stg.title}</strong>
                  <span className="side-t-date">{stg.date || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isRelated && (
          <>
            <div className="side-reader-doc-title">
              <h2>{title}</h2>
            </div>
            <LegalStageArticlesList articles={articles} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
}
