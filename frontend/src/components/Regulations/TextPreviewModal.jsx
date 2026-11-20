// frontend/src/components/Regulations/TextPreviewModal.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getLawTree } from '../../services/legalService';
import PreviewArticleCard from './PreviewArticleCard';
import { formatLawAmendedDate, formatOriginalLawTitle } from '../../utils/legalFormatters';

function formatDisplayDate(val) {
  if (!val || val === '—' || val === '-') return '';
  if (typeof val !== 'string') return String(val);
  const trimmed = val.trim();
  if (trimmed === 'لا ينطبق (نص أصلي)') return trimmed;
  const m = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const dd = m[3].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${dd}-${mm}-${m[1]}`;
  }
  return trimmed;
}

export default function TextPreviewModal({ isOpen, onClose, law, onOpenFullReader }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [previewArticles, setPreviewArticles] = useState([]);
  const [lawMeta, setLawMeta] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const lawId = law?.law_id || law?.id || 'قانون_34_2014_وتعديلاته';

  useEffect(() => {
    if (!isOpen || !law) {
      setPreviewArticles([]);
      setLawMeta(null);
      setFetchError(false);
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);
    setPreviewArticles([]);
    setLawMeta(null);
    setFetchError(false);

    getLawTree(lawId)
      .then(data => {
        if (cancelled || !data) return;
        setLawMeta(data);
        const allArticles = (data.sections || []).flatMap(s => s.articles || []);
        setPreviewArticles(allArticles.slice(0, 3));
        setLoadingPreview(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(true);
          setLoadingPreview(false);
        }
      });

    return () => { cancelled = true; };
  }, [isOpen, lawId]);

  if (!isOpen || !law) return null;

  const isOriginal = (law.type || '').includes('أصلية') ||
    (law.title || '').includes('النسخة الأصلية') ||
    (law.title || '').includes('النسخة') ||
    String(law.law_id || '').includes('النسخة') ||
    String(law.law_id || '').includes('الأصلية');

  const meta = {
    number: lawMeta?.number || law.number || `${law.year_short || '2014'}`,
    issue_date: formatDisplayDate(lawMeta?.issue_date || law.issue_date) || (law.year ? `${law.year}` : '—'),
    effective_date: formatDisplayDate(lawMeta?.effective_date || law.effective_date) || '—',
    amended_date: formatDisplayDate(lawMeta?.amended_date || law.amended_date) || formatLawAmendedDate(lawMeta?.amended_date || law.amended_date, lawMeta || law) || (isOriginal ? 'لا ينطبق (نص أصلي)' : '—'),
    title: formatOriginalLawTitle(lawMeta?.title || law.title || 'القانون'),
  };

  const handleSave = () => setIsSaved(prev => !prev);
  const handleOpenFull = () => {
    if (onOpenFullReader) onOpenFullReader(law);
  };

  return ReactDOM.createPortal(
    <div className="text-preview-backdrop" onClick={onClose}>
      <div className="text-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="text-preview-head">
          <div className="text-preview-head-info">
            <small>معاينة التشريع</small>
            <strong>{meta.title}</strong>
          </div>
          <button className="text-preview-close-btn" onClick={onClose} title="إغلاق">✕</button>
        </div>

        <div className="text-preview-body">
          <div className="preview-file-info">
            <div>
              <b>رقم القانون</b>
              <span>{meta.number}</span>
            </div>
            <div>
              <b>تاريخ النشر</b>
              <span>{meta.issue_date}</span>
            </div>
            <div>
              <b>تاريخ السريان</b>
              <span>{meta.effective_date}</span>
            </div>
            <div>
              <b>آخر تعديل نافذ</b>
              <span>{meta.amended_date || '—'}</span>
            </div>
          </div>

          {loadingPreview && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
              <div style={{
                width: 32, height: 32, border: '3px solid #E2E8F0',
                borderTopColor: '#0D3C5C', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
              }} />
              <span style={{ fontSize: '13px' }}>جاري تحميل نص القانون...</span>
            </div>
          )}

          {!loadingPreview && previewArticles.length > 0 && previewArticles.map((article) => (
            <PreviewArticleCard key={article.num || article.number} article={article} />
          ))}

          {!loadingPreview && previewArticles.length === 0 && !fetchError && (
            <div className="preview-article">
              <div className="preview-article-kicker">ملاحظة</div>
              <div className="preview-article-body">
                <p>اضغط على "فتح النص الكامل" للاطلاع على جميع مواد هذا التشريع.</p>
              </div>
            </div>
          )}

          <div className="preview-end-gate">
            <div>
              <strong>هذه معاينة مختصرة من نص القانون</strong>
              <small>للإطلاع على جميع المواد والتفاصيل انتقل إلى النص الكامل.</small>
            </div>
            <button type="button" className="preview-inline-full-btn" onClick={handleOpenFull}>
              عرض النص الكامل
            </button>
          </div>
        </div>

        <div className="text-preview-footer">
          <div className="preview-footer-actions">
            <button type="button" className="preview-action-card-btn"
              onClick={() => setIsFavorite(!isFavorite)} title="المفضلة">
              <svg width="20" height="20" viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>المفضلة</span>
            </button>

            <button type="button" className="preview-action-card-btn"
              onClick={handleSave} title="حفظ التشريع">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{isSaved ? 'تم الحفظ' : 'حفظ'}</span>
            </button>

            <button type="button" className="preview-action-card-btn"
              onClick={handleOpenFull} title="فتح النص الكامل">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>فتح النص الكامل</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
