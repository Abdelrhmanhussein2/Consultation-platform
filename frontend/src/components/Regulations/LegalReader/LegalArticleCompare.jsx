import React, { useState, useEffect } from 'react';
import { ARTICLE_DIFFS } from './articleDiffs';
import { getArticleHistory } from '../../../services/legalService';
import { computeArticleDiff } from './diffUtil';
import ModernSelect from '../../ModernSelect';

export default function LegalArticleCompare({ articleNum, lawId, lawTitle, onClose }) {
  const isLaw34 = !lawId || String(lawId).includes('34');
  const [cmpLeft, setCmpLeft] = useState('2019');
  const [cmpRight, setCmpRight] = useState('2015');
  const [dynamicHistory, setDynamicHistory] = useState(null);
  const [loading, setLoading] = useState(!isLaw34);

  useEffect(() => {
    setCmpLeft('2019');
    setCmpRight('2015');
    if (lawId && !isLaw34) {
      setLoading(true);
      getArticleHistory(lawId, articleNum)
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setDynamicHistory(data);
            setCmpLeft(data[0].version_name);
            setCmpRight(data[data.length - 1].version_name);
          } else {
            setDynamicHistory([]);
          }
        })
        .catch(() => setDynamicHistory([]))
        .finally(() => setLoading(false));
    }
  }, [articleNum, lawId, isLaw34]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!articleNum) return null;

  const diffData = ARTICLE_DIFFS[String(articleNum)] || {
    old: 'لا يتوفر نص سابق للمقارنة.',
    new: 'لا يتوفر نص سار للمقارنة.',
    changed: false,
    oldplain: 'لا يتوفر نص سابق للمقارنة.',
    newplain: 'لا يتوفر نص سار للمقارنة.'
  };

  const isSingleVersion = !isLaw34 && (!dynamicHistory || dynamicHistory.length <= 1);

  let dynamicDiff = null;
  if (dynamicHistory && dynamicHistory.length > 1) {
    const vLeft = dynamicHistory.find(d => d.version_name === cmpLeft);
    const vRight = dynamicHistory.find(d => d.version_name === cmpRight);
    dynamicDiff = computeArticleDiff(vRight?.text || '', vLeft?.text || '');
  }

  const isSameVersion = cmpLeft === cmpRight;
  const showNoChange = isSameVersion ||
    (dynamicDiff ? !dynamicDiff.hasDiff : (!dynamicHistory && !diffData.changed));

  const getVersionContent = (ver) => {
    if (dynamicDiff) {
      if (ver === cmpRight) return dynamicDiff.oldHtml;
      return dynamicDiff.newHtml;
    }
    if (isSameVersion) {
      const plain = ver === '2015' ? diffData.oldplain : diffData.newplain;
      return (plain || '').replace(/\n/g, '<br/>');
    }
    if (ver === '2015') return diffData.old || diffData.oldplain;
    return diffData.new || diffData.newplain;
  };

  const getVersionLabel = (ver) => {
    if (dynamicHistory) return `نسخة ${ver}`;
    return ver === '2015' ? 'كما صدر — 2015' : 'النص النافذ — 2019';
  };

  const leftOptions = dynamicHistory
    ? dynamicHistory.map(d => ({ value: d.version_name, label: d.version_name }))
    : [
        { value: '2019', label: 'النص النافذ — 2019' },
        { value: '2015', label: 'كما صدر — 2015' }
      ];

  const rightOptions = dynamicHistory
    ? dynamicHistory.map(d => ({ value: d.version_name, label: d.version_name }))
    : [
        { value: '2015', label: 'كما صدر — 2015' },
        { value: '2019', label: 'النص النافذ — 2019' }
      ];

  return (
    <div className="compare-modal-backdrop" onClick={onClose}>
      <div className="compare-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="compare-head">
          <strong>مقارنة النسخ — المادة {articleNum}</strong>
          <button type="button" className="modal-x" onClick={onClose} title="إغلاق">
            ×
          </button>
        </div>

        <div className="compare-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#0D3C5C', fontWeight: 700 }}>
              جاري فحص وتدقيق سجل التعديلات التشريعية...
            </div>
          ) : isSingleVersion ? (
            <div style={{ padding: '24px 16px', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="badge good" style={{ padding: '4px 10px', fontSize: '13px' }}>
                  النسخة الأصلية المعتمدة (نسخة وحيدة)
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 16px', lineHeight: 1.7 }}>
                هذا القانون صدر بنسخة أصلية واحدة فقط، ولا توجد تعديلات تشريعية سابقة أو لاحقة مسجلة على هذه المادة للمقارنة.
              </p>
              <div style={{
                background: '#F8FAFC',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                fontSize: '14px',
                lineHeight: 2,
                color: '#1E293B',
                whiteSpace: 'pre-line'
              }}>
                {dynamicHistory?.[0]?.text || 'نص المادة معتمد بنسخته الأصلية.'}
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
                    options={leftOptions}
                    placeholder="اختر النسخة..."
                  />
                </div>
                <div className="compare-control">
                  <label>النسخة الثانية (السابقة)</label>
                  <ModernSelect
                    value={cmpRight}
                    onChange={(val) => setCmpRight(val)}
                    options={rightOptions}
                    placeholder="اختر النسخة..."
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
                  <span className={`badge ${cmpLeft === '2019' || cmpLeft.includes('نافذ') ? 'good' : ''}`}>
                    {getVersionLabel(cmpLeft)}
                  </span>
                  <h3>المادة {articleNum}</h3>
                  <pre dangerouslySetInnerHTML={{ __html: getVersionContent(cmpLeft) }} />
                </div>

                <div className="version">
                  <span className={`badge ${cmpRight === '2019' || cmpRight.includes('نافذ') ? 'good' : ''}`}>
                    {getVersionLabel(cmpRight)}
                  </span>
                  <h3>المادة {articleNum}</h3>
                  <pre dangerouslySetInnerHTML={{ __html: getVersionContent(cmpRight) }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
