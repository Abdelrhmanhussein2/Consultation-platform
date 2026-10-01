// frontend/src/components/Regulations/LegalReader/LegalArticleCompare.jsx
import React, { useState, useEffect } from 'react';
import { ARTICLE_DIFFS } from './articleDiffs';
import { getArticleHistory } from '../../../services/legalService';

export default function LegalArticleCompare({ articleNum, lawId, lawTitle, onClose }) {
  const [cmpLeft, setCmpLeft] = useState('2019');
  const [cmpRight, setCmpRight] = useState('2015');
  const [dynamicHistory, setDynamicHistory] = useState(null);

  useEffect(() => {
    setCmpLeft('2019');
    setCmpRight('2015');
    if (lawId && lawId !== 'law_tax_34_2014') {
      getArticleHistory(lawId, articleNum).then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDynamicHistory(data);
          setCmpLeft(data[0].version_name);
          setCmpRight(data[data.length - 1].version_name);
        }
      }).catch(() => {});
    }
  }, [articleNum, lawId]);

  // Handle escape key to close
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

  const isSameVersion = cmpLeft === cmpRight;
  const showNoChange = isSameVersion || (!dynamicHistory && !diffData.changed);

  const getVersionContent = (ver) => {
    if (dynamicHistory) {
      const v = dynamicHistory.find(d => d.version_name === ver);
      return v ? (v.diff_from_previous || v.text || '').replace(/\n/g, '<br/>') : 'لا يوجد نص';
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

  return (
    <div className="compare-modal-backdrop" onClick={onClose}>
      <div className="compare-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Head */}
        <div className="compare-head">
          <strong>مقارنة النسخ — المادة {articleNum}</strong>
          <button type="button" className="modal-x" onClick={onClose} title="إغلاق">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="compare-body">
          <div className="compare-controls">
            <div className="compare-control">
              <label>النسخة الأولى</label>
              <select value={cmpLeft} onChange={(e) => setCmpLeft(e.target.value)}>
                {dynamicHistory ? (
                  dynamicHistory.map((d, i) => <option key={i} value={d.version_name}>{d.version_name}</option>)
                ) : (
                  <>
                    <option value="2019">النص النافذ — 2019</option>
                    <option value="2015">كما صدر — 2015</option>
                  </>
                )}
              </select>
            </div>
            <div className="compare-control">
              <label>النسخة الثانية</label>
              <select value={cmpRight} onChange={(e) => setCmpRight(e.target.value)}>
                {dynamicHistory ? (
                  dynamicHistory.map((d, i) => <option key={i} value={d.version_name}>{d.version_name}</option>)
                ) : (
                  <>
                    <option value="2015">كما صدر — 2015</option>
                    <option value="2019">النص النافذ — 2019</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {showNoChange && (
            <div className="compare-nochange">
              لا يوجد تغيير بين النسختين المحددتين.
            </div>
          )}

          <div className="compare-grid">
            {/* Left Card */}
            <div className="version">
              <span className={`badge ${cmpLeft === '2019' || cmpLeft.includes('نافذ') ? 'good' : ''}`}>
                {getVersionLabel(cmpLeft)}
              </span>
              <h3>المادة {articleNum}</h3>
              <pre dangerouslySetInnerHTML={{ __html: getVersionContent(cmpLeft) }} />
            </div>

            {/* Right Card */}
            <div className="version">
              <span className={`badge ${cmpRight === '2019' || cmpRight.includes('نافذ') ? 'good' : ''}`}>
                {getVersionLabel(cmpRight)}
              </span>
              <h3>المادة {articleNum}</h3>
              <pre dangerouslySetInnerHTML={{ __html: getVersionContent(cmpRight) }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
