import React, { useState, useEffect } from 'react';
import { getArticleHistory } from '../../../services/legalService';
import { computeArticleDiff } from './diffUtil';
import ModernSelect from '../../ModernSelect';

export default function LegalArticleCompare({ articleNum, lawId, onClose }) {
  const [cmpLeft, setCmpLeft] = useState('');
  const [cmpRight, setCmpRight] = useState('');
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!articleNum) return;
    setLoading(true);
    getArticleHistory(lawId, articleNum)
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setHistory(list);
        if (list.length > 0) {
          setCmpLeft(list[0].version_name);
          setCmpRight(list.length > 1 ? list[1].version_name : list[0].version_name);
        }
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [articleNum, lawId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!articleNum) return null;

  const hasMultipleVersions = history && history.length > 1;
  const leftItem = history?.find(h => h.version_name === cmpLeft) || history?.[0];
  const rightItem = history?.find(h => h.version_name === cmpRight) || history?.[history?.length - 1];

  const diffResult = hasMultipleVersions && leftItem && rightItem && cmpLeft !== cmpRight
    ? computeArticleDiff(rightItem.text || '', leftItem.text || '')
    : {
        oldHtml: (rightItem?.text || '').replace(/\n/g, '<br/>'),
        newHtml: (leftItem?.text || '').replace(/\n/g, '<br/>'),
        hasDiff: false
      };

  const showNoChange = hasMultipleVersions && (!diffResult.hasDiff || cmpLeft === cmpRight);

  const versionOptions = (history || []).map(v => ({
    value: v.version_name,
    label: v.version_name
  }));

  return (
    <div className="compare-modal-backdrop" onClick={onClose}>
      <div
        className="compare-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={!hasMultipleVersions ? { width: 'min(760px, 92vw)', maxWidth: '760px' } : { width: 'min(980px, 94vw)', maxWidth: '980px' }}
      >
        <div className="compare-head">
          <strong>مقارنة النسخ — المادة {articleNum}</strong>
          <button type="button" className="modal-x" onClick={onClose} title="إغلاق">
            ×
          </button>
        </div>

        <div className="compare-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#0D3C5C', fontWeight: 700 }}>
              جاري فحص وتدقيق النسخ التشريعية من قاعدة البيانات...
            </div>
          ) : !hasMultipleVersions ? (
            <div>
              <div
                className="compare-nochange"
                style={{ margin: '0 0 16px', textAlign: 'center', fontWeight: 700 }}
              >
                هذا القانون صدر بنسخة أصلية واحدة فقط ولا توجد له نسخ أو تعديلات تشريعية أخرى مسجلة للمقارنة.
              </div>

              <div
                className="compare-grid"
                style={{ gridTemplateColumns: '1fr', width: '100%', margin: '0 auto' }}
              >
                <div className="version">
                  <span className="badge good">
                    {history?.[0]?.version_name || 'النسخة الأصلية المعتمدة'}
                  </span>
                  <h3>المادة {articleNum}</h3>
                  <pre
                    className="article-body"
                    dangerouslySetInnerHTML={{
                      __html: (history?.[0]?.text || 'لا يتوفر نص مسجل لهذه المادة.').replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="compare-controls">
                <div className="compare-control">
                  <label>النسخة الأولى (الأحدث)</label>
                  <ModernSelect
                    value={cmpLeft}
                    onChange={(val) => setCmpLeft(val)}
                    options={versionOptions}
                    placeholder="اختر النسخة الأولى..."
                  />
                </div>
                <div className="compare-control">
                  <label>النسخة الثانية (السابقة)</label>
                  <ModernSelect
                    value={cmpRight}
                    onChange={(val) => setCmpRight(val)}
                    options={versionOptions}
                    placeholder="اختر النسخة الثانية..."
                  />
                </div>
              </div>

              {showNoChange && (
                <div className="compare-nochange">
                  لا يوجد تغيير بين النسختين المحددتين لهذه المادة.
                </div>
              )}

              <div className="compare-grid">
                <div className="version">
                  <span className={`badge ${cmpLeft.includes('نافذ') || cmpLeft.includes('2019') ? 'good' : ''}`}>
                    {cmpLeft}
                  </span>
                  <h3>المادة {articleNum}</h3>
                  <pre dangerouslySetInnerHTML={{ __html: diffResult.newHtml }} />
                </div>

                <div className="version">
                  <span className="badge">
                    {cmpRight}
                  </span>
                  <h3>المادة {articleNum}</h3>
                  <pre dangerouslySetInnerHTML={{ __html: diffResult.oldHtml }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
